import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log(users.map(u => ({ email: u.email, role: u.role, name: u.name })))
}

main().finally(() => prisma.$disconnect())
