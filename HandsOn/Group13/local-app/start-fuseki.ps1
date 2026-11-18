$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    $jar = Join-Path $PSScriptRoot 'runtime\apache-jena-fuseki-6.2.0\fuseki-server.jar'
    if (-not (Test-Path -LiteralPath $jar) -or -not (Test-Path -LiteralPath 'runtime\source.json')) {
        throw 'Run setup.ps1 first, with both services stopped.'
    }
    $env:FUSEKI_BASE = Join-Path $PSScriptRoot 'runtime\fuseki'
    java -jar $jar --localhost --port=3030 --config=fuseki-config.ttl
    if ($LASTEXITCODE -ne 0) { throw "Fuseki exited with code $LASTEXITCODE." }
} finally {
    Pop-Location
}
