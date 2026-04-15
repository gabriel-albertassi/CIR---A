'use client'

import React, { useState } from 'react'
import { Send, Clock, Ambulance, AlertCircle } from 'lucide-react'
import MassBlastModal from './MassBlastModal'

type Patient = {
  id: string
  name: string
  severity: string
  status: string
  origin_hospital: string
  created_at: Date
}

function formatHours(dateString: Date) {
  const diffHours = (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) return `${diffHours.toFixed(1)}h`;
  return `${(diffHours/24).toFixed(1)} dias`;
}

export default function DashboardQueue({ patients }: { patients: Patient[] }) {
  const [blastModal, setBlastModal] = useState<{id: string, severity: string} | null>(null);

  // Show all relevant active patients on the dashboard
  const priorityPatients = patients;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div className="card" style={{ padding: '1.5rem 1.25rem', background: 'rgba(8, 20, 40, 0.65)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#f87171" strokeWidth={3} /> Caso Críticos em Tempo Real
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{priorityPatients.length} casos prioritários</span>
        </div>

        {priorityPatients.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            Não há pacientes em estado crítico na fila no momento.
          </div>
        ) : (
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Gravidade</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Paciente</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Origem</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Espera</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {priorityPatients.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className={`badge badge-${p.severity}`} style={{ fontSize: '0.7rem' }}>{p.severity}</span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: p.status === 'WAITING' ? '#94a3b8' : '#818cf8' }}>
                        {p.status === 'WAITING' ? 'Aguardando Vaga' : 'Vaga Solicitada'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                      {p.origin_hospital}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {formatHours(p.created_at)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => setBlastModal({ id: p.id, severity: p.severity })}
                        style={{ 
                          background: 'rgba(0, 180, 216, 0.15)', 
                          color: '#00e5ff', 
                          border: '1px solid rgba(0, 180, 216, 0.3)', 
                          padding: '0.4rem 0.8rem', 
                          borderRadius: '8px', 
                          fontSize: '0.8rem', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Send size={14} /> Disparo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {blastModal && (
        <MassBlastModal 
          patientId={blastModal.id} 
          severity={blastModal.severity} 
          onClose={() => setBlastModal(null)} 
        />
      )}
    </div>
  )
}
