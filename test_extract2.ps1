$wc = New-Object System.Net.WebClient
$wc.DownloadFile('https://github.com/1j01/jspaint/archive/refs/heads/master.zip', 'jspaint_test2.zip')
Write-Output "Downloaded."
Expand-Archive -Path 'jspaint_test2.zip' -DestinationPath 'jspaint_test2_dir' -Force
Write-Output "Extracted."
