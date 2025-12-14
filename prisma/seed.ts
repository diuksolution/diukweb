import { PrismaClient } from '@prisma/client'

// Untuk seeder, gunakan instance terpisah dan pastikan disconnect setelah selesai
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Gunakan pooler URL untuk seeder juga
    },
  },
})

async function main() {
  console.log('🌱 Seeding Business...')

  // Daftar Business yang akan di-seed
  const businessData = {
    nama: 'DIUK Business',
    linkdata: 'https://docs.google.com/spreadsheets/d/1kvNxHzWoZHmi1IGadjN03qQwAkA9oLI8UMqNBpSWOj8/edit?gid=484285918#gid=484285918',
  }

  // Create atau get business
  let business = await prisma.business.findFirst({
    where: { nama: businessData.nama },
  })

  if (!business) {
    business = await prisma.business.create({
      data: {
        nama: businessData.nama,
        linkdata: businessData.linkdata,
      },
    })
    console.log(`✅ Created Business: ${business.nama}`)
  } else {
    console.log(`⏭️  Business already exists: ${business.nama}`)
  }

  console.log('🌱 Seeding Super Admin users...')

  // Daftar Super Admin yang akan di-seed
  // Ganti dengan email Google yang valid
  const superAdmins = [
    {
      email: 'alghifarirasyidzola@gmail.com', // Ganti dengan email Google Super Admin Anda
      name: 'Alghifari Rasyid Zola',
      supabaseId: 'temp-id-will-be-updated', // Akan di-update setelah user login via Google
    },
  ]

  for (const admin of superAdmins) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: admin.email },
      include: { business: true },
    })

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          email: admin.email,
          name: admin.name,
          supabaseId: admin.supabaseId,
          provider: 'google',
          role: 'super_admin',
          businessId: business.id, // Assign business ke user
        },
      })
      console.log(`✅ Created Super Admin: ${user.email} with Business: ${business.nama}`)
    } else {
      // Update to super_admin if exists
      if (existingUser.role !== 'super_admin') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'super_admin', provider: 'google' },
        })
        console.log(`✅ Updated to Super Admin: ${existingUser.email}`)
      } else {
        console.log(`⏭️  Super Admin already exists: ${existingUser.email}`)
      }

      // Check if user has business, if not assign business
      if (!existingUser.business) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { businessId: business.id },
        })
        console.log(`✅ Assigned Business to existing Super Admin: ${business.nama}`)
      }
    }
  }

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
