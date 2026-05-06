const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL.trim().replace(/^["']|["']$/g, ''),
    },
  },
})

async function main() {
  try {
    console.log('Testando conexão com o banco...')
    const patients = await prisma.patient.findMany({ take: 1 })
    console.log('Conexão bem sucedida! Pacientes encontrados:', patients.length)
    if (patients.length > 0) {
      console.log('Exemplo de paciente:', patients[0].name)
    }
  } catch (e) {
    console.error('Erro na conexão:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
