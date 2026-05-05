'use client'

import React, { useState } from 'react'
import { Send, Clock, Ambulance, AlertCircle, MessageCircle, Mail, Paperclip, Plus, ShieldCheck, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { togglePatientPrivateProfile } from '../app/patients/actions'
import MassBlastModal from './MassBlastModal'
import ChargeEvolutionModal from './ChargeEvolutionModal'
import AttachEvolutionModal from './AttachEvolutionModal'

type Patient = {
  id: string
  name: string
  severity: string
  status: string
  origin_hospital: string
  is_private?: boolean
  created_at: Date
}

function formatHours(dateString: Date) {
  const diffHours = (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) return `${diffHours.toFixed(1)}h`;
  return `${(diffHours/24).toFixed(1)} dias`;
}

export default function DashboardQueue({ patients, user }: { patients: Patient[], user: any }) {
  const [localPatients, setLocalPatients] = React.useState(patients);
  const [blastModal, setBlastModal] = useState<{id: string, severity: string, is_private?: boolean} | null>(null);
  const [chargeModal, setChargeModal] = useState<{id: string, origin: string} | null>(null);
  const [attachModal, setAttachModal] = useState<{id: string, name: string} | null>(null);

  // Sync local state when props change
  React.useEffect(() => {
    setLocalPatients(patients);
  }, [patients]);

  const canAction = user?.role === 'ADMIN' || user?.canCancelPatient;

  const handleTogglePrivate = async (id: string, current: boolean) => {
    // Optimistic Update
    setLocalPatients(prev => prev.map(p => 
      p.id === id ? { ...p, is_private: !current } : p
    ));

    // Server Action
    const result = await togglePatientPrivateProfile(id, current);
    if (result.error) {
      // Rollback on error
      setLocalPatients(prev => prev.map(p => 
        p.id === id ? { ...p, is_private: current } : p
      ));
      alert("Erro ao atualizar perfil: " + result.error);
    }
  };

  // Show all relevant active patients on the dashboard
  const priorityPatients = localPatients;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div className="card" style={{ padding: '1.5rem 1.25rem', background: 'rgba(8, 20, 40, 0.65)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <AlertCircle size={18} color="#f87171" strokeWidth={3} /> Fila de Regulação em Tempo Real
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{priorityPatients.length} pacientes</span>
            <Link href="/patients/new" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <Plus size={14} /> Nova Regulação
            </Link>
          </div>
        </div>

        {priorityPatients.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            Não há pacientes na fila no momento.
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
                  <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Ações de Comunicação</th>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        <div style={{ fontSize: '0.75rem', color: p.status === 'WAITING' ? '#94a3b8' : '#818cf8', fontWeight: 600 }}>
                          {p.status === 'WAITING' ? 'Aguardando Vaga' : 'Vaga Solicitada'}
                        </div>
                        
                        <button 
                          onClick={() => handleTogglePrivate(p.id, p.is_private ?? false)}
                          style={{ 
                            background: p.is_private ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.1)', 
                            color: p.is_private ? '#fbbf24' : '#94a3b8', 
                            border: `1px solid ${p.is_private ? 'rgba(245, 158, 11, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`, 
                            padding: '4px 12px', 
                            borderRadius: '8px', 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            width: 'fit-content',
                            marginTop: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                          title={p.is_private ? "Clique para mudar para perfil SUS" : "Clique para mudar para perfil Privado"}
                        >
                          {p.is_private ? <ShieldCheck size={13} strokeWidth={2.5} /> : <ShieldAlert size={13} strokeWidth={2.5} />}
                          {p.is_private ? 'PERFIL PRIVADO' : 'PERFIL SUS'}
                        </button>
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
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setAttachModal({ id: p.id, name: p.name })}
                          style={{ 
                            background: 'rgba(59, 130, 246, 0.15)', 
                            color: '#60a5fa', 
                            border: '1px solid rgba(59, 130, 246, 0.3)', 
                            padding: '0.75rem 1.25rem', 
                            borderRadius: '14px', 
                            fontSize: '0.85rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                          title="Anexar Evolução Médica (PDF/Laudos)"
                        >
                          <Paperclip size={16} /> ANEXAR
                        </button>

                        <button 
                          onClick={() => setChargeModal({ id: p.id, origin: p.origin_hospital })}
                          style={{ 
                            background: 'rgba(34, 197, 94, 0.15)', 
                            color: '#4ade80', 
                            border: '1px solid rgba(34, 197, 94, 0.3)', 
                            padding: '0.75rem 1.25rem', 
                            borderRadius: '14px', 
                            fontSize: '0.85rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                          title="Cobrar Evolução (WhatsApp/Email)"
                        >
                          <MessageCircle size={16} /> COBRAR
                        </button>
                        
                        <button 
                          onClick={() => {
                            if (canAction) setBlastModal({ id: p.id, severity: p.severity, is_private: p.is_private })
                          }}
                          style={{ 
                            background: canAction ? 'rgba(0, 180, 216, 0.15)' : 'rgba(148, 163, 184, 0.1)', 
                            color: canAction ? '#00e5ff' : '#64748b', 
                            border: `1px solid ${canAction ? 'rgba(0, 180, 216, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`, 
                            padding: '0.75rem 1.25rem', 
                            borderRadius: '14px', 
                            fontSize: '0.85rem', 
                            fontWeight: 700, 
                            cursor: canAction ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: canAction ? 1 : 0.6,
                            transition: 'all 0.2s'
                          }}
                          title={canAction ? "Disparo (Busca de Vaga)" : "Acesso Restrito: Requer liberação do Administrador"}
                        >
                          <Send size={16} /> DISPARO
                        </button>
                      </div>
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
          isPrivatePatient={blastModal.is_private}
          onClose={() => setBlastModal(null)} 
        />
      )}

      {chargeModal && (
        <ChargeEvolutionModal
          patientId={chargeModal.id}
          originHospital={chargeModal.origin}
          onClose={() => setChargeModal(null)}
        />
      )}
      {attachModal && (
        <AttachEvolutionModal
          patientId={attachModal.id}
          patientName={attachModal.name}
          onClose={() => setAttachModal(null)}
        />
      )}
    </div>
  )
}
