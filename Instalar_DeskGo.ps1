<#
.SYNOPSIS
Instalador de DeskGo OS para unidades extraibles (Pendrives y Discos Externos).
Incluye Chromium Portable pre-descargado - NO requiere internet.
#>

# Forzar encoding UTF-8 en consola
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Clear-Host
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "         Instalador de DeskGo OS" -ForegroundColor White
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Tu pendrive se convierte en un escritorio." -ForegroundColor DarkGray
Write-Host ""

# Obtener unidades (DriveType 2 = Removable, DriveType 3 = Local Disk)
# Ignoramos C: para evitar instalacion en el sistema principal
$drives = Get-WmiObject Win32_LogicalDisk | Where-Object { ($_.DriveType -eq 2 -or $_.DriveType -eq 3) -and $_.DeviceID -ne "C:" }

if ($drives.Count -eq 0 -or $drives -eq $null) {
    Write-Host "  [ERROR] No se encontraron pendrives o unidades externas." -ForegroundColor Red
    Write-Host "  Conecta un pendrive y vuelve a intentarlo." -ForegroundColor Yellow
    Write-Host ""
    Pause
    exit
}

Write-Host "  Unidades detectadas:" -ForegroundColor Green
Write-Host ""
$drivesArray = @($drives)
for ($i = 0; $i -lt $drivesArray.Count; $i++) {
    $drive = $drivesArray[$i]
    $label = if ($drive.DriveType -eq 2) { "Pendrive" } else { "Disco Externo" }
    $volName = if ($drive.VolumeName) { $drive.VolumeName } else { "Sin nombre" }
    
    $freeGB = "???"
    if ($drive.FreeSpace -ne $null) {
        $freeGB = "$([math]::Round($drive.FreeSpace / 1GB, 1)) GB libres"
    }
    
    Write-Host "  [$($i + 1)] $($drive.DeviceID) $volName - $label ($freeGB)" -ForegroundColor White
}

Write-Host ""
$selection = Read-Host "  Selecciona el numero de la unidad"
$selectedIndex = [int]$selection - 1

if ($selectedIndex -lt 0 -or $selectedIndex -ge $drivesArray.Count) {
    Write-Host "  Seleccion no valida." -ForegroundColor Red
    Pause
    exit
}

$targetDrive = $drivesArray[$selectedIndex].DeviceID
$targetFolder = "$targetDrive\DeskGo_System"

Write-Host ""
Write-Host "  Instalando en $targetDrive ..." -ForegroundColor Cyan
Write-Host ""

# Crear carpeta del sistema
if (-not (Test-Path $targetFolder)) {
    New-Item -ItemType Directory -Path $targetFolder | Out-Null
}

# Ruta del instalador
$sourcePath = $PSScriptRoot
if ($sourcePath -eq "" -or $sourcePath -eq $null) {
    $sourcePath = (Get-Location).Path
}

# === COPIAR ARCHIVOS DEL SISTEMA ===
$filesToCopy = @("index.html", "style.css", "core.js", "apps.js", "server.ps1", "wallpaper.png")

foreach ($file in $filesToCopy) {
    $sourceFile = Join-Path -Path $sourcePath -ChildPath $file
    if (Test-Path $sourceFile) {
        Copy-Item -Path $sourceFile -Destination $targetFolder -Force
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [!!] No se encontro: $file" -ForegroundColor Red
    }
}

# === COPIAR CHROMIUM PORTABLE (pre-incluido) ===
$browserSource = Join-Path $sourcePath "Browser"
$browserDest = "$targetFolder\Browser"

if (Test-Path $browserSource) {
    Write-Host ""
    Write-Host "  Copiando navegador Chromium Portable..." -ForegroundColor Yellow
    Write-Host "  (Esto puede tardar unos minutos, por favor espera)" -ForegroundColor DarkGray
    
    if (Test-Path $browserDest) { Remove-Item $browserDest -Recurse -Force }
    
    $allBrowserFiles = @(Get-ChildItem -Path $browserSource -Recurse)
    $totalBrowserFiles = $allBrowserFiles.Count
    $browserCounter = 0
    
    foreach ($item in $allBrowserFiles) {
        $browserCounter++
        if ($browserCounter % 10 -eq 0 -or $browserCounter -eq $totalBrowserFiles) {
            $percent = [math]::Round((($browserCounter / $totalBrowserFiles) * 100), 1)
            Write-Progress -Activity "Copiando navegador (Portable Apps)" -Status "$browserCounter / $totalBrowserFiles archivos copiados" -PercentComplete $percent
            Write-Host -NoNewline "`r  --> Copiando: $percent% completado ($browserCounter de $totalBrowserFiles)...        "
        }
        
        $relPath = $item.FullName.Substring($browserSource.Length)
        $destPath = "$browserDest$relPath"
        
        if ($item.PSIsContainer) {
            if (-not (Test-Path $destPath)) { New-Item -ItemType Directory -Path $destPath | Out-Null }
        } else {
            $parentDir = Split-Path $destPath
            if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir | Out-Null }
            Copy-Item -Path $item.FullName -Destination $destPath -Force
        }
    }
    Write-Progress -Activity "Copiando navegador (Portable Apps)" -Completed
    Write-Host ""
    
    Write-Host "  [OK] Chromium Portable copiado" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  [!!] No se encontro la carpeta 'Browser' junto al instalador." -ForegroundColor Red
    Write-Host "  Asegurate de que la carpeta Browser/ este en:" -ForegroundColor Yellow
    Write-Host "  $sourcePath" -ForegroundColor Yellow
    Write-Host ""
    Pause
    exit
}

# === CREAR LANZADOR VBS ===
$vbsPath = "$targetDrive\Abrir DeskGo.vbs"
$vbsContent = @"
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
driveLetter = objFSO.GetDriveName(WScript.ScriptFullName)

serverPath = driveLetter & "\DeskGo_System\server.ps1"
chromePath = driveLetter & "\DeskGo_System\Browser\chrome-win\chrome.exe"

' Iniciar el backend de manera oculta
objShell.Run "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & serverPath & """", 0, False

' Esperar a que el servidor arranque
WScript.Sleep 1500

' Lanzar Chromium en modo app y esperar a que cierre
command = """" & chromePath & """ --app=""http://localhost:8555"" --start-maximized --disable-extensions --no-first-run --no-default-browser-check"
objShell.Run command, 1, True

' Apagar el servidor al cerrar
objShell.Run "powershell.exe -WindowStyle Hidden -Command ""Invoke-RestMethod -Uri 'http://localhost:8555/api/shutdown'""", 0, False
"@

Set-Content -Path $vbsPath -Value $vbsContent -Encoding Ascii
Write-Host "  [OK] Lanzador creado" -ForegroundColor Green

# === RESUMEN FINAL ===
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "    Instalacion completada con exito!" -ForegroundColor White
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Abre tu unidad $targetDrive y haz doble clic en:" -ForegroundColor Yellow
Write-Host "  'Abrir DeskGo.vbs'" -ForegroundColor White
Write-Host ""
Write-Host "  No necesita internet. Todo funciona offline." -ForegroundColor DarkGray
Write-Host ""
Pause
