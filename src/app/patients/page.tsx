import { prisma } from '@/lib/prisma'
import ClientQueue from './ClientQueue'
import { calculatePatientScore } from '@/lib/scoring'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PatientsPage() {
  const patientsDB = await prisma.patient.findMany({
    where: {
      status: {
        in: ['WAITING', 'OFFERED']
      }
    },
    include: {
      logs: {
        where: { 
          action: { in: ['REFUSAL', 'REQUEST'] } 
        }
      }
    }
  });

  const processedPatients = patientsDB.map(p => {
    const score = calculatePatientScore(p);
    const isDelayed = score > 100 || p.attempts_count >= 3; 
    
    const refused_hospitals = Array.from(new Set(p.logs.filter(l => l.action === 'REFUSAL').map(log => log.details).filter(Boolean))) as string[];
    const requested_hospitals = Array.from(new Set(p.logs.filter(l => l.action === 'REQUEST').map(log => log.details).filter(Boolean))) as string[];

    return {
      ...p,
      score,
      isDelayed,
      refused_hospitals,
      requested_hospitals
    };
  });

  // Sort descending by score, but Critical (-1) is treated as a priority alert, 
  // so we'll put Critical at the very top, then descending by score.
  processedPatients.sort((a, b) => {
    if (a.score === -1 && b.score !== -1) return -1;
    if (b.score === -1 && a.score !== -1) return 1;
    return b.score - a.score;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Fila Inteligente de Solicitações</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Pacientes ordenados automaticamente por gravidade, tempo de espera e número de recusas.
          </p>
        </div>
      </div>

      <ClientQueue initialPatients={processedPatients} />
    </div>
  )
}
