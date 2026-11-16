$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22 or later is required.' }
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java 21 or later is required.' }
    $settings = (& java -XshowSettings:properties -version 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect the installed Java runtime.' }
    $javaHome = [regex]::Match($settings, '(?m)^\s*java.home\s*=\s*(.+)$').Groups[1].Value.Trim()
    if (-not $javaHome) { throw 'Unable to resolve java.home.' }
    $javaExe = Join-Path $javaHome 'bin\java.exe'
    $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in @(3030, 3031) }
    if ($listeners) { throw 'Ports 3030/3031 must be free. Stop the parking services before setup.' }
    $version = '6.2.0'
    $fusekiHome = Join-Path $PSScriptRoot "runtime\apache-jena-fuseki-$version"
    $jar = Join-Path $fusekiHome 'fuseki-server.jar'
    New-Item -ItemType Directory -Force -Path 'runtime' | Out-Null
    if (-not (Test-Path -LiteralPath $jar)) {
        $archive = Join-Path $PSScriptRoot "runtime\apache-jena-fuseki-$version.zip"
        $checksumUrl = "https://downloads.apache.org/jena/binaries/apache-jena-fuseki-$version.zip.sha512"
        $url = "https://dlcdn.apache.org/jena/binaries/apache-jena-fuseki-$version.zip"
        Write-Host "Downloading Apache Jena Fuseki $version..."
        Invoke-WebRequest -Uri $url -OutFile $archive
        $checksum = (Invoke-WebRequest -Uri $checksumUrl).Content
        if ($checksum -is [byte[]]) { $checksum = [Text.Encoding]::UTF8.GetString($checksum) }
        $match = [regex]::Match($checksum, '(?i)\b[0-9a-f]{128}\b')
        if (-not $match.Success -or (Get-FileHash -LiteralPath $archive -Algorithm SHA512).Hash -ne $match.Value) {
            throw 'Fuseki download failed SHA-512 verification.'
        }
        Expand-Archive -LiteralPath $archive -DestinationPath 'runtime' -Force
        Remove-Item -LiteralPath $archive
    }
    $env:FUSEKI_BASE = Join-Path $PSScriptRoot 'runtime\fuseki'
    $database = Join-Path $PSScriptRoot 'runtime\database'
    New-Item -ItemType Directory -Force -Path $database | Out-Null
    $arguments = @('-jar', "`"$jar`"", '--localhost', '--port=3031', '--tdb2', "--loc=`"$database`"", '--update', '/parking')
    $process = Start-Process $javaExe -ArgumentList $arguments -PassThru -NoNewWindow `
        -RedirectStandardOutput 'runtime\setup-stdout.log' -RedirectStandardError 'runtime\setup-stderr.log'
    try {
        node data.mjs prepare
        if ($LASTEXITCODE -ne 0) { throw 'Data preparation failed. Check runtime\setup-stderr.log.' }
    } finally {
        if (-not $process.HasExited) { Stop-Process -Id $process.Id; $process.WaitForExit() }
    }
    Write-Host 'Setup complete. Run start-fuseki.ps1 and start-app.ps1 in separate terminals.'
} finally {
    Pop-Location
}
