import { prisma } from '@/lib/prisma'
import { ALL_HOSPITALS } from '@/lib/constants'
import VagasForm from './VagasForm'

export const dynamic = 'force-dynamic'

export default async function VagasPage() {
  const currentAvailabilities = await prisma.bedAvailability.findMany();

  // Map into an easily consumable format for the client
  const mapData: Record<string, any> = {};
  currentAvailabilities.forEach(b => {
    mapData[b.hospital_name] = b;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          🏥 Censo Diário de Leitos
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Atualize a quantidade de vagas disponíveis informadas em cada hospital.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {ALL_HOSPITALS.map(hospitalName => {
          const data = mapData[hospitalName] || {
            cti_masc: 0, cti_fem: 0, clinica_masc: 0, clinica_fem: 0, sem_vagas: false
          };

          return (
            <VagasForm key={hospitalName} hospitalName={hospitalName} initialData={data} />
          )
        })}
      </div>
    </div>
  )
}
