$port = 8555
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

$root = $PSScriptRoot
$settingsFile = Join-Path $root "user_settings.json"

# MIME types
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

function Read-Body($request) {
    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
    $body = $reader.ReadToEnd()
    $reader.Close()
    return $body
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        $method = $request.HttpMethod
        
        # CORS
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        $response.Headers.Add("Cache-Control", "no-cache")
        
        # Handle preflight
        if ($method -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.OutputStream.Close()
            continue
        }
        
        if ($path -eq "/api/shutdown") {
            $body = [System.Text.Encoding]::UTF8.GetBytes('{"status":"bye"}')
            $response.ContentType = "application/json"
            $response.ContentLength64 = $body.Length
            $response.OutputStream.Write($body, 0, $body.Length)
            $response.OutputStream.Close()
            $listener.Stop()
            break
        }
        elseif ($path -eq "/api/disk") {
            $driveLetter = (Get-Item $root).Root.Name.Substring(0,2)
            $disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='$driveLetter'"
            $free = [long]$disk.FreeSpace
            $size = [long]$disk.Size
            $used = $size - $free
            $json = "{ `"total`": $size, `"free`": $free, `"used`": $used, `"drive`": `"$driveLetter`" }"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        elseif ($path -eq "/api/files") {
            $reqPath = $request.QueryString["path"]
            $driveRoot = (Get-Item $root).Root.Name
            if (-not $reqPath -or $reqPath -eq "") { $dirPath = $driveRoot }
            else { $dirPath = Join-Path $driveRoot $reqPath }
            
            if (Test-Path $dirPath) {
                $items = Get-ChildItem $dirPath -ErrorAction SilentlyContinue | 
                    Where-Object { $_.Name -ne 'DeskGo_System' -and -not $_.Name.StartsWith('$') -and $_.Name -ne 'System Volume Information' } |
                    Select-Object Name, Length, @{Name='IsFolder';Expression={$_.PSIsContainer}}
                $json = $items | ConvertTo-Json -Compress
                if (-not $json) { $json = "[]" }
                elseif ($json.StartsWith("{")) { $json = "[$json]" }
            } else { $json = "[]" }
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        # === READ FILE CONTENT ===
        elseif ($path -eq "/api/file/read") {
            $reqPath = $request.QueryString["path"]
            $driveRoot = (Get-Item $root).Root.Name
            $filePath = Join-Path $driveRoot $reqPath
            
            if (Test-Path $filePath -PathType Leaf) {
                $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
                $obj = @{ content = $content; path = $reqPath; name = (Split-Path $filePath -Leaf) }
                $json = $obj | ConvertTo-Json -Compress
            } else {
                $json = '{"error":"File not found"}'
                $response.StatusCode = 404
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        # === WRITE FILE CONTENT ===
        elseif ($path -eq "/api/file/write" -and $method -eq "POST") {
            $body = Read-Body $request
            $data = $body | ConvertFrom-Json
            $driveRoot = (Get-Item $root).Root.Name
            $filePath = Join-Path $driveRoot $data.path
            
            try {
                [System.IO.File]::WriteAllText($filePath, $data.content, [System.Text.Encoding]::UTF8)
                $json = '{"status":"ok"}'
            } catch {
                $json = '{"error":"Write failed"}'
                $response.StatusCode = 500
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        # === PORTABLE APPS ===
        elseif ($path -eq "/api/apps/check" -and $method -eq "GET") {
            $driveRoot = (Get-Item $root).Root.Name
            $portableDir = Join-Path $driveRoot "PortableApps"
            $installed = @()
            if (Test-Path $portableDir) {
                $installed = Get-ChildItem $portableDir -Directory | Select-Object -ExpandProperty Name
            }
            $json = $installed | ConvertTo-Json -Compress
            if (-not $json) { $json = "[]" }
            elseif ($json.StartsWith("{")) { $json = "[$json]" }
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        elseif ($path -eq "/api/apps/run" -and $method -eq "POST") {
            $body = Read-Body $request
            $data = $body | ConvertFrom-Json
            $baseDir = (Resolve-Path $root).Path
            $exePath = Join-Path $baseDir $data.exe
            
            if (Test-Path $exePath) {
                Start-Process $exePath -WorkingDirectory (Split-Path $exePath)
                $json = '{"status":"ok"}'
            } else {
                $json = '{"error":"Exe not found"}'
                $response.StatusCode = 404
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        elseif ($path -eq "/api/apps/scan-local" -and $method -eq "GET") {
            $baseDir = (Resolve-Path $root).Path
            # Search for .exe files within the DeskGo root folder
            $exeFiles = Get-ChildItem -Path $baseDir -Filter "*.exe" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { 
                $f = $_.FullName
                $deskGoSys = ($f -match "\\DeskGo_System\\") -and ($_.Name -ne "chrome.exe")
                -not $deskGoSys
            }
            
            $result = @()
            foreach ($file in $exeFiles) {
                # Get path relative to the base directory
                $relPath = $file.FullName.Substring($baseDir.Length).TrimStart('\')
                $result += @{
                    name = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
                    path = $relPath
                    size = $file.Length
                }
            }
            $json = $result | ConvertTo-Json -Depth 5 -Compress
            if (-not $json) { $json = '[]' }
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        elseif ($path -eq "/api/apps/install" -and $method -eq "POST") {
            $body = Read-Body $request
            $data = $body | ConvertFrom-Json
            $driveRoot = (Get-Item $root).Root.Name
            $portableDir = Join-Path $driveRoot "PortableApps"
            if (-not (Test-Path $portableDir)) { New-Item -ItemType Directory -Path $portableDir | Out-Null }
            
            $jobScript = {
                param($id, $url, $portableDir)
                $isZip = $url.EndsWith('.zip')
                $isExe = $url.EndsWith('.exe')
                
                $installerPath = Join-Path $env:TEMP "$id$(if($isZip){'.zip'}elseif($isExe){'.exe'}else{'.bin'})"
                $tempExtractDir = Join-Path $env:TEMP "$id-temp-extract"
                
                try {
                    if (Test-Path $installerPath) { Remove-Item $installerPath -Force -ErrorAction SilentlyContinue }
                    if (Test-Path $tempExtractDir) { Remove-Item $tempExtractDir -Force -Recurse -ErrorAction SilentlyContinue }
                    
                    New-Item -ItemType Directory -Path $tempExtractDir -Force | Out-Null
                    
                    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                    $wc = New-Object System.Net.WebClient
                    $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    $wc.DownloadFile($url, $installerPath)
                    
                    if ($isZip) {
                        Add-Type -AssemblyName System.IO.Compression.FileSystem
                        [System.IO.Compression.ZipFile]::ExtractToDirectory($installerPath, $tempExtractDir)
                        
                        # Manejar el caso donde el zip contiene una sola carpeta principal (ej. jspaint-master)
                        $extractedItems = Get-ChildItem -Path $tempExtractDir
                        if ($extractedItems.Count -eq 1 -and $extractedItems[0].PSIsContainer) {
                            $tempExtractDir = $extractedItems[0].FullName
                        }
                    } elseif ($isExe) {
                        # Es un ejecutable directo (ej. Rufus.exe), lo movemos a la carpeta de extracción temporal
                        Move-Item -Path $installerPath -Destination (Join-Path $tempExtractDir "$id.exe") -Force
                    }
                    
                    $finalDir = Join-Path $portableDir $id
                    if (Test-Path $finalDir) { Remove-Item $finalDir -Recurse -Force }
                    
                    Move-Item -Path $tempExtractDir -Destination $finalDir -Force
                    
                    if (Test-Path $installerPath) { Remove-Item $installerPath -Force -ErrorAction SilentlyContinue }
                    if (Test-Path $tempExtractDir) { Remove-Item $tempExtractDir -Force -Recurse -ErrorAction SilentlyContinue }
                } catch {
                    $_ | Out-File (Join-Path $portableDir "${id}_error.log") -Force
                }
            }
            
            Start-Job -ScriptBlock $jobScript -ArgumentList $data.id, $data.url, $portableDir | Out-Null
            
            $json = '{"status":"installing"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        # === USER SETTINGS ===
        elseif ($path -eq "/api/settings" -and $method -eq "GET") {
            if (Test-Path $settingsFile) {
                $json = [System.IO.File]::ReadAllText($settingsFile, [System.Text.Encoding]::UTF8)
            } else {
                $json = '{}'
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        elseif ($path -eq "/api/settings" -and $method -eq "POST") {
            $body = Read-Body $request
            [System.IO.File]::WriteAllText($settingsFile, $body, [System.Text.Encoding]::UTF8)
            $json = '{"status":"saved"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        else {
            # Static files
            if ($path -eq "/") { $path = "/index.html" }
            $filePath = Join-Path $root ($path.TrimStart('/').Replace('/', '\'))
            
            if (Test-Path $filePath -PathType Leaf) {
                $buffer = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                if ($mimeTypes.ContainsKey($ext)) { $response.ContentType = $mimeTypes[$ext] }
                else { $response.ContentType = "application/octet-stream" }
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } else {
                $response.StatusCode = 404
                $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
                $response.ContentLength64 = $body.Length
                $response.OutputStream.Write($body, 0, $body.Length)
            }
        }
        $response.OutputStream.Close()
    }
    catch {
        try { $response.OutputStream.Close() } catch {}
    }
}
