$max = 12
$ok = $false
for ($i = 0; $i -lt $max; $i++) {
  try {
    Invoke-WebRequest 'http://127.0.0.1:8000' -UseBasicParsing -TimeoutSec 2 | Out-Null
    $ok = $true
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}
<# wait_and_run.ps1 - removed. Tests have been executed and this file is intentionally disabled. #>
