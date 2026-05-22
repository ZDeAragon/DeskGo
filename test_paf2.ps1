$ErrorActionPreference='Stop'
$url='https://downloads.sourceforge.net/project/portableapps/Notepad%2B%2B%20Portable/NotepadPlusPlusPortable_8.6.5.paf.exe'
$id='notepadpp'
$installerPath = Join-Path $env:TEMP "$id.paf.exe"
$tempExtractDir = Join-Path $env:TEMP "$id-temp-extract"
if (Test-Path $tempExtractDir) { Remove-Item $tempExtractDir -Force -Recurse }
New-Item -ItemType Directory -Path $tempExtractDir -Force | Out-Null
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$wc = New-Object System.Net.WebClient
$wc.DownloadFile($url, $installerPath)
Unblock-File -Path $installerPath
$process = Start-Process -FilePath $installerPath -ArgumentList "/S /D=$tempExtractDir" -Wait -NoNewWindow -PassThru
Write-Output "Process ExitCode: $($process.ExitCode)"
Get-ChildItem $tempExtractDir | Select-Object Name
