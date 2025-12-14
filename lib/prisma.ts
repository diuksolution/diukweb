import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma Client with connection pooling
// connection_limit: Limit jumlah koneksi yang bisa dibuat (sesuai dengan Supabase pool_size)
// Untuk Supabase free tier, pool_size biasanya 10-15
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL, // Gunakan pooler URL untuk aplikasi
      },
    },
  })

// Ensure connections are properly managed
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

