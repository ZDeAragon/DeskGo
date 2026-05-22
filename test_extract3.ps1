$tempZip = Join-Path $env:TEMP "jspaint_test3.zip"
$wc = New-Object System.Net.WebClient
$wc.DownloadFile('https://github.com/1j01/jspaint/archive/refs/heads/master.zip', $tempZip)
Write-Output "Downloaded."
Expand-Archive -Path $tempZip -DestinationPath '.\jspaint_test3_dir' -Force
Write-Output "Extracted."
