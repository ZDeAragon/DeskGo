$job = Start-Job -ScriptBlock { Write-Output "Hello from job" }
Wait-Job $job
Receive-Job $job
