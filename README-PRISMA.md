# Prisma Database Setup

## Masalah Connection Pool

Jika mendapat error `MaxClientsInSessionMode` atau `Can't reach database server`, ikuti langkah berikut:

## 1. Setup DIRECT_URL di .env

Tambahkan `DIRECT_URL` di file `.env` sesuai dokumentasi Supabase:

```env
# Untuk aplikasi (menggunakan connection pooling dengan pgbouncer)
DATABASE_URL="postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Untuk migration (direct connection, tanpa pgbouncer)
DIRECT_URL="postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

**Perbedaan:**
- `DATABASE_URL`: Port `6543` dengan `?pgbouncer=true` (untuk aplikasi dengan connection pooling)
- `DIRECT_URL`: Port `5432` tanpa `pgbouncer=true` (untuk migration, direct connection)

## 2. Cara Mendapatkan Connection String dari Supabase

1. Buka Supabase Dashboard
2. Pergi ke **Project Settings** → **Database**
3. Scroll ke **Connection String**
4. Untuk `DATABASE_URL`: Pilih tab **Connection Pooling** → Port `6543` → Copy dan tambahkan `?pgbouncer=true`
5. Untuk `DIRECT_URL`: Pilih tab **Connection Pooling** → Port `5432` → Copy (tanpa `?pgbouncer=true`)

**Contoh format:**
- `DATABASE_URL`: `postgresql://postgres.xxx:password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- `DIRECT_URL`: `postgresql://postgres.xxx:password@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`

## 3. Push Schema

Setelah `DIRECT_URL` di-set, jalankan:

```bash
# Menggunakan script helper (recommended)
powershell -ExecutionPolicy Bypass -File scripts/push-schema.ps1

# Atau manual
npx prisma db push
```

## 4. Jika Masih Error

1. **Stop semua Node processes:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
   ```

2. **Tunggu 5-10 menit** untuk koneksi timeout

3. **Coba lagi:**
   ```bash
   npx prisma db push
   ```

## 5. Alternative: Manual SQL

Jika masih error, bisa buat tabel manual via Supabase SQL Editor:

```sql
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  linkdata TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX businesses_user_id_idx ON businesses(user_id);
```

