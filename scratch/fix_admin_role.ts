import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.update({
    where: { email: 'albertassi.pixel@gmail.com' },
    data: { role: 'ADMIN' }
  })
  console.log('Role updated successfully')
}

main().finally(() => prisma.$disconnect())
