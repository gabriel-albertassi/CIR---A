import { prisma } from '@/lib/prisma'
import { PRIVATE_HOSPITALS } from '@/lib/constants'
import PrivateReportClient from '@/components/PrivateReportClient'

export const dynamic = 'force-dynamic'

export default async function RelatorioPrivadosPage() {
  // Busca todos os logs de transferência para hospitais privados, com dados do paciente
  const transferLogs = await prisma.log.findMany({
    where: {
      action: 'TRANSFER',
      details: { in: PRIVATE_HOSPITALS }
    },
    include: {
      patient: {
        select: {
          name: true,
          diagnosis: true,
          severity: true,
          origin_hospital: true,
          created_at: true,
          transfer_date: true,
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  })

  // Agrupa por hospital privado
  const byHospital: Record<string, typeof transferLogs> = {}
  for (const hosp of PRIVATE_HOSPITALS) {
    byHospital[hosp] = transferLogs.filter(l => l.details === hosp)
  }

  // Totais gerais para o cabeçalho
  const totalTransfers = transferLogs.length
  const generatedAt = new Date().toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short'
  })

  return (
    <PrivateReportClient
      byHospital={byHospital}
      totalTransfers={totalTransfers}
      generatedAt={generatedAt}
      privateHospitals={PRIVATE_HOSPITALS}
    />
  )
}
