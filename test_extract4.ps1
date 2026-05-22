$tempZip = Join-Path $env:TEMP "jspaint_test4.zip"
$wc = New-Object System.Net.WebClient
$wc.DownloadFile('https://github.com/1j01/jspaint/archive/refs/heads/master.zip', $tempZip)
Write-Output "Downloaded."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($tempZip, ".\jspaint_test4_dir")
Write-Output "Extracted."
