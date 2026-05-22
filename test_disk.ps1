$items = @()
$json = $items | ConvertTo-Json -Compress
Write-Output "JSON empty array: '$json'"
$items2 = @( [pscustomobject]@{Name="A"; Length=10; IsFolder=$true} )
$json2 = $items2 | ConvertTo-Json -Compress
Write-Output "JSON single item: '$json2'"
