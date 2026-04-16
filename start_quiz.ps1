# Forest Sciences MCQ Quiz - Launcher
# Run this to start the server and open the quiz in your browser.

$Port = 8765
$Root = $PSScriptRoot
$Url  = "http://localhost:$Port"

# 1. Kill any process already using the port
$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    $oldPid = ($existing | Select-Object -First 1).OwningProcess
    Write-Host "Port $Port already in use (PID $oldPid) - stopping it..." -ForegroundColor Yellow
    Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

# 2. Start Python HTTP server silently in the background
Write-Host "Starting server at $Url ..." -ForegroundColor Cyan
$server = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", $Port -WorkingDirectory $Root -PassThru -WindowStyle Hidden

Start-Sleep -Milliseconds 800

# 3. Open the browser
Write-Host "Opening quiz in browser..." -ForegroundColor Green
Start-Process $Url

Write-Host ""
Write-Host "  Quiz is live at $Url" -ForegroundColor Green
Write-Host "  Press Ctrl+C or close this window to stop the server." -ForegroundColor DarkGray
Write-Host ""

# 4. Keep alive and clean up on Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host "Shutting down server..." -ForegroundColor Yellow
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Done. Goodbye!" -ForegroundColor Cyan
}
