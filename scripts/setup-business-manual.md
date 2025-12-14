# Setup Business Table Manual

Jika `npx prisma db push` masih error karena connection pool penuh, gunakan cara manual ini:

## Langkah 1: Buat Tabel di Supabase SQL Editor

1. Buka **Supabase Dashboard** → Project Anda
2. Pergi ke **SQL Editor** (di sidebar kiri)
3. Copy seluruh isi file `scripts/create-business-table.sql`
4. Paste di SQL Editor
5. Klik **Run** atau tekan `Ctrl+Enter`

## Langkah 2: Generate Prisma Client

Setelah tabel berhasil dibuat, generate Prisma Client:

```bash
npx prisma generate
```

## Langkah 3: Verifikasi

Cek apakah tabel sudah ada:

```bash
npx prisma studio
```

Atau jalankan seeder:

```bash
npx prisma db seed
```

## Catatan

- Tabel `businesses` akan dibuat dengan struktur yang sama seperti di `schema.prisma`
- Foreign key ke `users` sudah di-set dengan `ON DELETE CASCADE`
- Trigger untuk `updated_at` sudah dibuat otomatis
- Setelah tabel dibuat, Prisma Client akan mengenali tabel ini saat di-generate

## Jika Masih Ada Masalah

1. **Cek apakah tabel sudah ada:**
   ```sql
   SELECT * FROM businesses;
   ```

2. **Cek foreign key:**
   ```sql
   SELECT 
     tc.table_name, 
     kcu.column_name, 
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name 
   FROM information_schema.table_constraints AS tc 
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' 
     AND tc.table_name = 'businesses';
   ```

