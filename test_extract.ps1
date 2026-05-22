$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri 'https://github.com/1j01/jspaint/archive/refs/heads/master.zip' -OutFile 'jspaint_test.zip' -UseBasicParsing
Write-Output "Downloaded."
Expand-Archive -Path 'jspaint_test.zip' -DestinationPath 'jspaint_test_dir' -Force
Write-Output "Extracted."
