
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testando conexão com o banco de dados...')
    const userCount = await prisma.user.count()
    console.log(`Conexão bem sucedida! Total de usuários: ${userCount}`)
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
