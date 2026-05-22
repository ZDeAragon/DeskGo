$id = "jspaint"
$url = "https://github.com/1j01/jspaint/archive/refs/heads/master.zip"
$portableDir = Join-Path $PSScriptRoot "PortableApps"
if (-not (Test-Path $portableDir)) { New-Item -ItemType Directory -Path $portableDir | Out-Null }

$tempDir = Join-Path $portableDir "$id-temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$isZip = $url.EndsWith(".zip")
$installerPath = Join-Path $portableDir "$id$(if($isZip){'.zip'}else{'.paf.exe'})"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $installerPath -UseBasicParsing
    
    if ($isZip) {
        Write-Output "Extracting $installerPath to $tempDir"
        Expand-Archive -Path $installerPath -DestinationPath $tempDir -Force
    } else {
        Start-Process -FilePath $installerPath -ArgumentList "/DESTINATION=`"$tempDir`"" -Wait -NoNewWindow
    }
    Remove-Item $installerPath -Force
    
    $finalDir = Join-Path $portableDir $id
    if (Test-Path $finalDir) { Remove-Item $finalDir -Recurse -Force }
    Rename-Item -Path $tempDir -NewName $id -Force
    Write-Output "Done"
} catch {
    Write-Output "Error: $_"
}
