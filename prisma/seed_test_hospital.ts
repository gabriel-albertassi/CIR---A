import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cadastrando Unidade de Teste...')

  await prisma.hospital.upsert({
    where: { name: 'Unidade de Teste CIR-A' },
    update: {
      email: 'ALBERTASSI.PIXEL@GMAIL.COM',
      type: 'PUBLICO',
      accepts_cti: true,
      accepts_clinica: true,
    },
    create: {
      name: 'Unidade de Teste CIR-A',
      email: 'ALBERTASSI.PIXEL@GMAIL.COM',
      type: 'PUBLICO',
      accepts_cti: true,
      accepts_clinica: true,
    },
  })

  console.log('✓ Unidade de Teste cadastrada com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
