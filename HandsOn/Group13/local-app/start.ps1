$ErrorActionPreference = 'Stop'
if (-not $IsWindows -or $PSVersionTable.PSVersion.Major -lt 7) {
    throw 'This launcher requires PowerShell 7 on Windows.'
}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'runtime\source.json'))) {
    throw 'Run setup.ps1 first, with the services stopped.'
}
$webPort = 8080
if ($env:PORT -and (-not [int]::TryParse($env:PORT, [ref]$webPort) -or $webPort -lt 1 -or $webPort -gt 65535)) {
    throw 'PORT must be a valid TCP port.'
}
if ($webPort -eq 3030) { throw 'PORT must differ from the Fuseki port (3030).' }
$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in @(3030, $webPort) }
if ($listeners) { throw 'A required port is occupied. Stop the existing service before running start.ps1.' }

# A Windows job object also closes native descendants if the launcher is force-terminated.
if (-not ('ParkingServiceScope' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;

public sealed class ParkingServiceScope : IDisposable
{
    [StructLayout(LayoutKind.Sequential)]
    private struct Limits
    {
        public long ProcessTime, JobTime;
        public uint Flags;
        public UIntPtr MinWorkingSet, MaxWorkingSet;
        public uint ActiveProcesses;
        public UIntPtr Affinity;
        public uint Priority, Scheduling;
    }
    [StructLayout(LayoutKind.Sequential)]
    private struct Counters { public ulong A, B, C, D, E, F; }
    [StructLayout(LayoutKind.Sequential)]
    private struct ExtendedLimits
    {
        public Limits Basic;
        public Counters IO;
        public UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
    }
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateJobObject(IntPtr attributes, string name);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetInformationJobObject(IntPtr job, int infoClass, ref ExtendedLimits limits, uint length);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
    [DllImport("kernel32.dll")]
    private static extern bool CloseHandle(IntPtr handle);
    private IntPtr handle;

    public ParkingServiceScope()
    {
        handle = CreateJobObject(IntPtr.Zero, null);
        if (handle == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
        var limits = new ExtendedLimits();
        limits.Basic.Flags = 0x2000;
        if (!SetInformationJobObject(handle, 9, ref limits, (uint)Marshal.SizeOf<ExtendedLimits>()))
        {
            int error = Marshal.GetLastWin32Error();
            Dispose();
            throw new Win32Exception(error);
        }
    }
    public void Add(int processId)
    {
        using (var process = Process.GetProcessById(processId))
            if (!AssignProcessToJobObject(handle, process.Handle))
                throw new Win32Exception(Marshal.GetLastWin32Error());
    }
    public void Dispose()
    {
        if (handle != IntPtr.Zero) { CloseHandle(handle); handle = IntPtr.Zero; }
    }
}
'@
}

$scope = $null
$gate = $null
$serviceJobs = @()
try {
    $scope = [ParkingServiceScope]::new()
    $gateName = 'Local\MadridParking-' + [guid]::NewGuid().ToString('N')
    $gate = [Threading.EventWaitHandle]::new($false, [Threading.EventResetMode]::ManualReset, $gateName)
    foreach ($script in @('start-fuseki.ps1', 'start-app.ps1')) {
        $job = Start-Job -Name "MadridParking-$script" -ArgumentList (Join-Path $PSScriptRoot $script), $gateName -ScriptBlock {
            param($scriptPath, $gateName)
            $ErrorActionPreference = 'Stop'
            $gate = [Threading.EventWaitHandle]::OpenExisting($gateName)
            try {
                Write-Output $PID
                if (-not $gate.WaitOne(30000)) { throw 'Launcher did not release service startup.' }
                & $scriptPath
            } finally { $gate.Dispose() }
        }
        $serviceJobs += $job
        $deadline = [DateTime]::UtcNow.AddSeconds(25)
        $workerId = $null
        while (-not $workerId) {
            $output = @(Receive-Job -Job $job -ErrorAction Stop)
            if ($output.Count) { $workerId = [int]$output[0]; break }
            if ($job.State -ne 'Running' -or [DateTime]::UtcNow -gt $deadline) {
                throw "Could not start background worker for $script."
            }
            Start-Sleep -Milliseconds 100
        }
        # Workers wait until both are enrolled, so native services cannot escape the scope.
        $scope.Add($workerId)
    }
    $null = $gate.Set()
    Write-Host "Starting Fuseki and the web app. Open http://127.0.0.1:$webPort once Fuseki reports 'Start Fuseki'."
    Write-Host 'Keep this launcher running. Press Ctrl+C to stop both services.'
    while ($true) {
        foreach ($job in $serviceJobs) {
            Receive-Job -Job $job -ErrorAction Stop
            if ($job.State -ne 'Running') {
                throw "$($job.Name) stopped unexpectedly. Shutting down both services."
            }
        }
        Start-Sleep -Milliseconds 300
    }
} finally {
    try {
        foreach ($job in $serviceJobs) {
            Stop-Job -Job $job
            Remove-Job -Job $job -Force
        }
    } finally {
        if ($scope) { $scope.Dispose() }
        if ($gate) { $gate.Dispose() }
    }
}
