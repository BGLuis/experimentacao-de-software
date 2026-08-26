$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$python = Get-ChildItem -Path "$env:LOCALAPPDATA\Python" -Directory -Filter 'pythoncore-*' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName 'python.exe' } |
    Where-Object { Test-Path $_ } |
    Select-Object -First 1

if (-not $python) {
    throw 'Python não encontrado. Instale o Python antes de executar a mineração.'
}

$logDirectory = Join-Path $projectRoot 'output\logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Set-Location $projectRoot
Start-Transcript -Path (Join-Path $logDirectory 'mineracao-dashboard-diaria.log') -Append
try {
    & $python "$projectRoot\src\scripts\coleta_n_repo.py" `
        --limit 1000 `
        --fresh `
        --output "$projectRoot\dashboard\public\data\repositorios_populares_1000.csv"
    if ($LASTEXITCODE -ne 0) {
        throw "A mineração terminou com código $LASTEXITCODE."
    }
} finally {
    Stop-Transcript
}
