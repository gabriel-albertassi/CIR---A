import { prisma } from '@/lib/prisma'
import PrintButton from '@/components/PrintButton'
import FinalStatusActions from './FinalStatusActions'

export const dynamic = 'force-dynamic'

export default async function TransferidosPage() {
  const patients = await prisma.patient.findMany({
    where: {
      status: { in: ['TRANSFERRED', 'ALTA', 'FALECIMENTO'] }
    },
    include: {
      logs: {
        where: { action: { in: ['TRANSFER', 'FINAL_STATUS'] } },
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
            Pacientes Transferidos
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500 }}>
            Histórico completo de pacientes já transferidos e seus destinos.
          </p>
        </div>
        <div className="no-print" style={{ paddingTop: '0.5rem' }}>
          <PrintButton />
        </div>
      </div>

      {/* TABELA */}
      <div className="card" style={{ padding: '0', backgroundColor: 'var(--surface)' }}>
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            
            <thead style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '2px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Paciente</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Diagnóstico</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Hospital de Origem</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, borderLeft: '1px dashed var(--border)' }}>Hospital de Destino</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Data da Transferência</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Data da Alta/Óbito</th>
                <th className="no-print" style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status Final</th>
              </tr>
            </thead>

            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Nenhum paciente transferido ainda.
                  </td>
                </tr>
              ) : null}

              {patients.map((p, idx) => {
                const eventLog = p.logs && p.logs.length > 0 ? p.logs[0] : null;
                
                let destination = 'Não registrado';
                if (p.status === 'ALTA') destination = 'Alta Médica';
                else if (p.status === 'FALECIMENTO') destination = 'Falecimento';
                else if (eventLog && eventLog.action === 'TRANSFER') destination = eventLog.details || '';

                const transferDateToUse = p.transfer_date ? new Date(p.transfer_date) : 
                                          (eventLog && eventLog.action === 'TRANSFER' ? new Date(eventLog.timestamp) : new Date(p.created_at));
                
                const outcomeDateToUse = p.outcome_date ? new Date(p.outcome_date) : 
                                         (p.status === 'ALTA' || p.status === 'FALECIMENTO' ? 
                                            (eventLog && eventLog.action === 'FINAL_STATUS' ? new Date(eventLog.timestamp) : null) 
                                            : null);

                return (
                  <tr key={p.id} style={{ 
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--surface-hover)' 
                  }}>
                    
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <span className={`badge badge-${p.severity}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                        {p.severity}
                      </span>
                    </td>

                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {p.diagnosis}
                    </td>

                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500 }}>
                      {p.origin_hospital}
                    </td>

                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: '#16a34a', borderLeft: '1px dashed var(--border)' }}>
                      {destination}
                    </td>

                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {transferDateToUse.toLocaleDateString('pt-BR')} 
                      <br/>
                      <small>{transferDateToUse.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>

                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {outcomeDateToUse ? (
                        <>
                          {outcomeDateToUse.toLocaleDateString('pt-BR')}
                          <br/>
                          <small>{outcomeDateToUse.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>

                    <td className="no-print" style={{ padding: '1.25rem 1.5rem' }}>
                      <FinalStatusActions patientId={p.id} currentStatus={p.status} />
                    </td>

                  </tr>
                )
              })}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  )
}