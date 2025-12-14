# Script untuk reset database connections
# Gunakan ini jika connection pool penuh

Write-Host "🔄 Stopping all Node processes..."
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "⏳ Waiting 15 seconds for connections to timeout..."
Start-Sleep -Seconds 15

Write-Host "✅ Ready to run Prisma commands"
Write-Host ""
Write-Host "Sekarang jalankan:"
Write-Host "  npx prisma db push"
Write-Host "atau"
Write-Host "  npx prisma migrate dev --name your_migration_name"

