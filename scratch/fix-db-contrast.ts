import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando correção de "CONTRAST" para "CONTRASTE" no banco de dados...');

  // 1. Corrigir AuthorizationKey
  const keysToFix = await prisma.authorizationKey.findMany({
    where: {
      OR: [
        { exam: { contains: 'CONTRAST', mode: 'insensitive' } },
        { procedure: { contains: 'CONTRAST', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Encontradas ${keysToFix.length} chaves para correção.`);

  let fixCount = 0;
  for (const k of keysToFix) {
    const fixedExam = k.exam.replace(/\bCONTRAST\b/gi, 'CONTRASTE');
    const fixedProcedure = k.procedure ? k.procedure.replace(/\bCONTRAST\b/gi, 'CONTRASTE') : null;

    if (fixedExam !== k.exam || fixedProcedure !== k.procedure) {
      await prisma.authorizationKey.update({
        where: { id: k.id },
        data: {
          exam: fixedExam,
          procedure: fixedProcedure
        }
      });
      fixCount++;
    }
  }
  console.log(`Sucesso: ${fixCount} chaves atualizadas.`);

  // 2. Corrigir Patient (se houver diagnósticos com CONTRAST)
  const patientsToFix = await prisma.patient.findMany({
    where: {
      diagnosis: { contains: 'CONTRAST', mode: 'insensitive' }
    }
  });

  console.log(`Encontrados ${patientsToFix.length} pacientes para correção.`);

  let patientFixCount = 0;
  for (const p of patientsToFix) {
    const fixedDiag = p.diagnosis.replace(/\bCONTRAST\b/gi, 'CONTRASTE');
    if (fixedDiag !== p.diagnosis) {
      await prisma.patient.update({
        where: { id: p.id },
        data: { diagnosis: fixedDiag }
      });
      patientFixCount++;
    }
  }
  console.log(`Sucesso: ${patientFixCount} pacientes atualizados.`);

  console.log('Correção finalizada!');
}

main()
  .catch(err => {
    console.error('Erro na migração:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
