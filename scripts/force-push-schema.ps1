# Script untuk force push schema dengan DIRECT_URL
# Ini memastikan migration menggunakan direct connection

Write-Host "🔄 Checking environment variables..."

# Load .env file manually
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Loaded .env file"
} else {
    Write-Host "❌ .env file not found"
    exit 1
}

if (-not $env:DIRECT_URL) {
    Write-Host "❌ DIRECT_URL not found in .env file"
    Write-Host ""
    Write-Host "Please add DIRECT_URL to your .env file:"
    Write-Host "  DIRECT_URL=\"postgresql://postgres.xxx:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres\""
    Write-Host ""
    Write-Host "Note: Use port 5432 (not 6543) and without ?pgbouncer=true"
    exit 1
}

Write-Host "✅ DIRECT_URL found"
Write-Host ""
Write-Host "⏳ Waiting 10 seconds for existing connections to timeout..."
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🚀 Running Prisma db push with DIRECT_URL..."
Write-Host ""

# Force Prisma to use DIRECT_URL by temporarily setting DATABASE_URL
$originalDbUrl = $env:DATABASE_URL
$env:DATABASE_URL = $env:DIRECT_URL

try {
    npx prisma db push
    $exitCode = $LASTEXITCODE
} finally {
    # Restore original DATABASE_URL
    $env:DATABASE_URL = $originalDbUrl
}

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Schema pushed successfully!"
} else {
    Write-Host ""
    Write-Host "❌ Schema push failed. Try waiting a few more minutes and run again."
}

exit $exitCode

