import { prisma } from '../../lib/db'
import ClientQueue from './ClientQueue'
import { calculatePatientScore } from '../../lib/scoring'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/sb-server'

export const dynamic = 'force-dynamic'

export default async function PatientsPage() {
  try {
    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    
    let user = null
    if (supabaseUser) {
      user = await prisma.user.findUnique({
        where: { id: supabaseUser.id }
      })
    }

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

        <ClientQueue initialPatients={processedPatients} user={user} />
      </div>
    )
  } catch (err) {
    console.error('Patients Page Error:', err);
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Erro ao carregar fila</h1>
        <p style={{ color: '#94a3b8' }}>{err instanceof Error ? err.message : String(err)}</p>
      </div>
    );
  }
}
