-- SQL Script untuk membuat tabel businesses secara manual
-- Jalankan ini di Supabase SQL Editor jika Prisma db push masih error

-- Buat tabel businesses (1 business bisa punya banyak users)
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama TEXT NOT NULL,
  linkdata TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tambahkan kolom business_id ke tabel users (jika belum ada)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE users ADD COLUMN business_id TEXT;
    ALTER TABLE users ADD CONSTRAINT users_business_id_fkey 
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS users_business_id_idx ON users(business_id);
  END IF;
END $$;

-- Buat trigger untuk update updated_at otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at 
  BEFORE UPDATE ON businesses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verifikasi tabel sudah dibuat
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

