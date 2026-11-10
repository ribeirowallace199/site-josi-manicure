$port = 3000
$baseDir = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "Servidor iniciado com sucesso em http://localhost:$port/"
} catch {
    $port = 8080
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    Write-Host "Servidor iniciado com sucesso em http://localhost:$port/"
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/" -or [string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "/index.html"
        }

        $localPath = Join-Path $baseDir ($urlPath.TrimStart('/').Replace('/', '\'))

        if (Test-Path $localPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) {
                $contentType = $mimeTypes[$ext]
            }
            $response.ContentType = $contentType

            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - Arquivo nao encontrado")
            $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
        }
        $response.Close()
    } catch {
        # Ignora erros de desconexão rápida do cliente
    }
}
