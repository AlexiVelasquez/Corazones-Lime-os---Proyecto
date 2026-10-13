param(
    [int]$Port = 8080,
    [string]$ListenAddress = '127.0.0.1',
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'app'))

if (-not (Test-Path -LiteralPath (Join-Path $appRoot 'index.html') -PathType Leaf)) {
    Write-Host 'No se encontro portable\app\index.html.' -ForegroundColor Red
    Write-Host 'En la computadora de desarrollo ejecuta: npm run build:portable'
    exit 1
}

function Get-ContentType([string]$Path) {
    switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        '.html' { 'text/html; charset=utf-8' }
        '.js'   { 'text/javascript; charset=utf-8' }
        '.css'  { 'text/css; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.svg'  { 'image/svg+xml' }
        '.png'  { 'image/png' }
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.gif'  { 'image/gif' }
        '.ico'  { 'image/x-icon' }
        '.webp' { 'image/webp' }
        '.woff' { 'font/woff' }
        '.woff2'{ 'font/woff2' }
        default { 'application/octet-stream' }
    }
}

$securityHeaders = "Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://localhost:8081 http://127.0.0.1:8081 http://10.0.2.2:8081 http://10.242.146.148:8081`r`nX-Frame-Options: DENY`r`nX-Content-Type-Options: nosniff`r`nReferrer-Policy: strict-origin-when-cross-origin`r`nPermissions-Policy: camera=(), microphone=(), geolocation=()`r`n"

$listenIp = if ($ListenAddress -eq '0.0.0.0') {
    [Net.IPAddress]::Any
} else {
    [Net.IPAddress]::Parse($ListenAddress)
}
$listener = [Net.Sockets.TcpListener]::new($listenIp, $Port)

try {
    $listener.Start()
} catch {
    Write-Host "El puerto $Port esta ocupado. Cierra la otra ventana del proyecto o ejecuta:" -ForegroundColor Red
    Write-Host ".\servidor.ps1 -Port 8081"
    exit 1
}

$url = "http://127.0.0.1:$Port/"
Write-Host ''
Write-Host "Corazones Limenos esta disponible en $url" -ForegroundColor Green
if ($ListenAddress -eq '0.0.0.0') {
    Write-Host "Desde Kali con NAT abre: http://10.0.2.2:$Port/" -ForegroundColor Cyan
    $networkAddresses = [Net.Dns]::GetHostAddresses([Net.Dns]::GetHostName()) |
        Where-Object { $_.AddressFamily -eq [Net.Sockets.AddressFamily]::InterNetwork -and -not [Net.IPAddress]::IsLoopback($_) }
    foreach ($address in $networkAddresses) {
        Write-Host "Desde Kali con puente/Host-Only: http://$($address.IPAddressToString):$Port/" -ForegroundColor Cyan
    }
}
Write-Host 'Esta version no necesita Angular CLI ni acceso a internet.'
Write-Host 'Para detenerla, presiona Ctrl+C o cierra esta ventana.'
Write-Host ''
if (-not $NoBrowser) {
    Start-Process $url
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()

            do {
                $headerLine = $reader.ReadLine()
            } while ($null -ne $headerLine -and $headerLine.Length -gt 0)

            if ($requestLine -notmatch '^(GET|HEAD)\s+([^\s]+)') {
                continue
            }

            $method = $Matches[1]
            $requestTarget = $Matches[2].Split('?')[0]
            $relativePath = [Uri]::UnescapeDataString($requestTarget).TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = 'index.html'
            }

            $candidate = [IO.Path]::GetFullPath((Join-Path $appRoot $relativePath))
            $insideApp = $candidate.StartsWith($appRoot, [StringComparison]::OrdinalIgnoreCase)
            $isFile = $insideApp -and (Test-Path -LiteralPath $candidate -PathType Leaf)

            if (-not $isFile) {
                if ([string]::IsNullOrEmpty([IO.Path]::GetExtension($relativePath))) {
                    $candidate = Join-Path $appRoot 'index.html'
                } else {
                    $body = [Text.Encoding]::UTF8.GetBytes('404 - Archivo no encontrado')
                    $header = "HTTP/1.1 404 Not Found`r`n${securityHeaders}Content-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
                    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    if ($method -eq 'GET') { $stream.Write($body, 0, $body.Length) }
                    continue
                }
            }

            $body = [IO.File]::ReadAllBytes($candidate)
            $contentType = Get-ContentType $candidate
            $cacheControl = if ($contentType.StartsWith('text/html')) { 'no-store' } else { 'public, max-age=3600' }
            $header = "HTTP/1.1 200 OK`r`n${securityHeaders}Content-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: $cacheControl`r`nConnection: close`r`n`r`n"
            $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            if ($method -eq 'GET') { $stream.Write($body, 0, $body.Length) }
        } catch {
            Write-Host "Solicitud omitida: $($_.Exception.Message)" -ForegroundColor Yellow
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
}
