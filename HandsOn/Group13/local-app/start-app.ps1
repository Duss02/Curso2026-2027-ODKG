$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    node server.mjs
    if ($LASTEXITCODE -ne 0) { throw "Application exited with code $LASTEXITCODE." }
} finally {
    Pop-Location
}
