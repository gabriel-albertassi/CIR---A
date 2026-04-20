import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Criando usuário Administrador Master...')

  const adminEmail = 'albertassi.pixel@gmail.com'
  
  // Nota: Como não temos o UID do Supabase Auth ainda, 
  // vamos criar um registro inicial que será vinculado no primeiro login
  // ou fornecer um ID temporário.
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      canCancelPatient: true,
      canPrintReports: true
    },
    create: {
      id: 'temp-admin-id-' + Date.now(), // Será atualizado no primeiro login real
      name: 'Gabriel Albertassi',
      email: adminEmail,
      role: 'ADMIN',
      canCancelPatient: true,
      canPrintReports: true
    },
  })

  console.log(`✅ Sucesso! O usuário ${adminEmail} agora é ADMINISTRADOR no banco de dados.`)
}

main()
  .catch((e) => {
    console.error('❌ Erro de Conexão:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
