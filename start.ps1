# Wedding Invitation — Start Script
# Chạy: .\start.ps1

$PORT = 3000
$DIR  = $PSScriptRoot

Write-Host ""
Write-Host "==============================" -ForegroundColor Magenta
Write-Host "   WEDDING INVITATION SERVER  " -ForegroundColor Magenta
Write-Host "==============================" -ForegroundColor Magenta
Write-Host ""

# Kiểm tra serve
if (-not (Get-Command serve -ErrorAction SilentlyContinue)) {
    Write-Host "[!] 'serve' chua duoc cai. Dang cai..." -ForegroundColor Yellow
    npm install -g serve
}

# Kiểm tra ngrok
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "[!] 'ngrok' khong tim thay. Vui long cai ngrok tu ngrok.com" -ForegroundColor Red
    exit 1
}

Write-Host "[1] Khoi dong HTTP server tren port $PORT..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "serve `"$DIR`" -p $PORT --no-clipboard"

Start-Sleep -Seconds 2

Write-Host "[2] Khoi dong ngrok tunnel..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http $PORT"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[OK] Da khoi dong!" -ForegroundColor Green
Write-Host "  Local:  http://localhost:$PORT" -ForegroundColor White
Write-Host "  Admin:  http://localhost:$PORT/admin.html" -ForegroundColor White
Write-Host "  Ngrok:  Xem cua so ngrok de lay URL cong khai" -ForegroundColor Yellow
Write-Host ""
