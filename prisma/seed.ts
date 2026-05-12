import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create superadmin
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@tradein.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@tradein.com',
      password: hashedPassword,
      role: 'superadmin',
    },
  })

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      pickupFee: 10,
      currency: 'SGD',
      whatsappNumber: '+6591234567',
    },
  })

  console.log('✅ Seed complete:', admin.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())