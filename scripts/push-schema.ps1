# Script untuk push schema menggunakan DIRECT_URL
# Ini memastikan migration menggunakan direct connection, bukan pooler

Write-Host "🔄 Checking environment variables..."

if (-not $env:DIRECT_URL) {
    Write-Host "❌ DIRECT_URL not found in environment"
    Write-Host ""
    Write-Host "Please set DIRECT_URL in your .env file:"
    Write-Host ""
    Write-Host "For Supabase with Prisma:"
    Write-Host "  DATABASE_URL=\"postgresql://postgres.xxx:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true\""
    Write-Host "  DIRECT_URL=\"postgresql://postgres.xxx:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres\""
    Write-Host ""
    Write-Host "Note: DIRECT_URL uses port 5432 (not 6543) and without ?pgbouncer=true"
    exit 1
}

Write-Host "✅ DIRECT_URL found"
Write-Host ""
Write-Host "🚀 Running Prisma db push with DIRECT_URL..."
Write-Host ""

# Set DATABASE_URL sementara ke DIRECT_URL untuk migration
$originalDbUrl = $env:DATABASE_URL
$env:DATABASE_URL = $env:DIRECT_URL

try {
    npx prisma db push
} finally {
    # Restore original DATABASE_URL
    $env:DATABASE_URL = $originalDbUrl
}

