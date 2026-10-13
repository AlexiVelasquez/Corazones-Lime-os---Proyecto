$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$php = 'C:\xampp\php\php.exe'
if (-not (Test-Path -LiteralPath $php -PathType Leaf)) {
    $phpCommand = Get-Command php -ErrorAction SilentlyContinue
    if ($phpCommand) { $php = $phpCommand.Source }
}

if (-not (Test-Path -LiteralPath $php -PathType Leaf)) {
    Write-Host 'No se encontro PHP en XAMPP ni en la variable PATH.' -ForegroundColor Red
    Write-Host 'Instala XAMPP o configura PHP antes de iniciar la API.'
    Read-Host 'Presiona Enter para cerrar'
    exit 1
}

$mysqlReady = $false
$client = [Net.Sockets.TcpClient]::new()
try {
    $connect = $client.BeginConnect('127.0.0.1', 3306, $null, $null)
    $mysqlReady = $connect.AsyncWaitHandle.WaitOne(1200) -and $client.Connected
} catch {
    $mysqlReady = $false
} finally {
    $client.Close()
}

if (-not $mysqlReady) {
    Write-Host 'MySQL no esta iniciado.' -ForegroundColor Yellow
    Write-Host 'Abre XAMPP Control Panel, inicia MySQL y vuelve a ejecutar este archivo.'
    Read-Host 'Presiona Enter para cerrar'
    exit 1
}

$logDirectory = Join-Path $projectRoot 'tmp\database-server'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$outputLog = Join-Path $logDirectory 'php.out.log'
$errorLog = Join-Path $logDirectory 'php.err.log'
$backendPath = Join-Path $projectRoot 'backend'

$backend = Start-Process -FilePath $php -ArgumentList @('-S', '127.0.0.1:8081', '-t', $backendPath) `
    -WorkingDirectory $projectRoot -RedirectStandardOutput $outputLog -RedirectStandardError $errorLog `
    -WindowStyle Hidden -PassThru

Start-Sleep -Milliseconds 900
try {
    $health = Invoke-RestMethod 'http://127.0.0.1:8081/api.php?action=health' -TimeoutSec 4
    if (-not $health.ok) { throw 'La API no pudo consultar MySQL.' }
    Write-Host 'Base de datos y API conectadas correctamente.' -ForegroundColor Green
    & (Join-Path $projectRoot 'portable\servidor.ps1')
} catch {
    Write-Host 'No se pudo abrir la base de datos corazones_limenos.' -ForegroundColor Red
    Write-Host 'Importa database\corazones_limenos.sql desde MySQL Workbench.'
    Write-Host $_.Exception.Message
    Read-Host 'Presiona Enter para cerrar'
} finally {
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
}
