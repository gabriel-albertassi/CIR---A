'use client'

import React, { useState, useMemo } from 'react'
import { requestBed, transferPatient, cancelPatient, registerRefusal, evolvePatient } from './actions'
import { AlertTriangle, Clock, Activity, MessageSquare, TrendingUp, Search, MessageCircle, Mail, Send, Paperclip, Plus, ShieldCheck, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { togglePatientPrivateProfile } from './actions'
import PrintButton from '@/components/PrintButton'
import ChargeEvolutionModal from '@/components/ChargeEvolutionModal'
import MassBlastModal from '@/components/MassBlastModal'
import AttachEvolutionModal from '@/components/AttachEvolutionModal'
import { ALL_HOSPITALS, SEVERITY_LEVELS, HOSPITAL_CONTACTS } from '@/lib/constants'
import styles from './ClientQueue.module.css'

// We maintain the logic for the red Score tag on rows, but transfer the banner to Cirila's logic.

type PatientData = {
  id: string
  name: string
  origin_hospital: string
  diagnosis: string
  severity: string
  status: string
  is_private?: boolean
  created_at: Date
  attempts_count: number
  last_offer_date: Date | null
  score: number
  isDelayed: boolean
  refused_hospitals: string[]
  requested_hospitals: string[]
}

function truncateString(str: string, num: number) {
  if (str.length <= num) return str
  return str.slice(0, num) + '...'
}

function formatHours(dateString: Date) {
  const diffHours = (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) return `${diffHours.toFixed(1)}h`;
  return `${(diffHours/24).toFixed(1)} dias`;
}

export default function ClientQueue({ initialPatients, user }: { initialPatients: PatientData[], user: any }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Otimização: Memoização da filtragem para evitar recálculos desnecessários
  const filteredPatients = useMemo(() => {
    return initialPatients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.diagnosis.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [initialPatients, search, filterStatus]);
  
  const criticalScorePatients = useMemo(() => 
    initialPatients.filter(p => p.score > 35 || p.score === -1),
    [initialPatients]
  );

  const [chargeModal, setChargeModal] = useState<{id: string, origin: string} | null>(null);
  const [blastModal, setBlastModal] = useState<{id: string, severity: string} | null>(null);
  const [attachModal, setAttachModal] = useState<{id: string, name: string} | null>(null);

  // State for inline hospital selection when requesting a bed
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [targetHospital, setTargetHospital] = useState<string>('');

  // State for inline hospital selection when registering a refusal
  const [refusingId, setRefusingId] = useState<string | null>(null);
  const [refusalHospital, setRefusalHospital] = useState<string>('');
  const [refusalNote, setRefusalNote] = useState<string>('');

  // State for inline hospital selection when transferring
  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [transferHospital, setTransferHospital] = useState<string>('');

  // State for evolving patient
  const [evolvingId, setEvolvingId] = useState<string | null>(null);
  const [newSeverity, setNewSeverity] = useState<string>('');
  const [newDiagnosis, setNewDiagnosis] = useState<string>('');

  // State for cancel/exit panel
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [exitType, setExitType] = useState<'ALTA_MEDICA' | 'OBITO' | 'OUTRO' | ''>('');
  const [exitNote, setExitNote] = useState<string>('');

  const TRANSFER_HOSPITALS = [...ALL_HOSPITALS, 'Hospital Regional'];

  async function handleAction(action: 'request' | 'transfer' | 'cancel' | 'refusal' | 'evolve', id: string) {
    try {
      setLoadingId(id);
      if (action === 'request') {
        if (!targetHospital) {
          alert('Selecione o hospital para qual o leito foi solicitado.');
          return;
        }
        await requestBed(id, targetHospital);
        setRequestingId(null);
        setTargetHospital('');
      } else if (action === 'refusal') {
        if (!refusalHospital) {
          alert('Selecione o hospital que recusou a solicitação.');
          return;
        }
        if (refusalHospital === 'Paciente Recusou Transferencia' && !refusalNote.trim()) {
          alert('Por favor, informe o motivo da recusa do paciente.');
          return;
        }
        await registerRefusal(id, refusalHospital, refusalNote.trim() || undefined);
        setRefusingId(null);
        setRefusalHospital('');
        setRefusalNote('');
      } else if (action === 'transfer') {
        if (!transferHospital) {
          alert('Selecione o hospital de destino para finalizar a transferência.');
          return;
        }
        await transferPatient(id, transferHospital);
        setTransferringId(null);
        setTransferHospital('');
      } else if (action === 'evolve') {
        if (!newSeverity) {
          alert('Selecione a nova gravidade.');
          return;
        }
        const res = await evolvePatient(id, newSeverity, newDiagnosis);
        if (res && res.error) {
          throw new Error(res.error);
        }
        setEvolvingId(null);
        setNewSeverity('');
        setNewDiagnosis('');
      } else if (action === 'cancel') {
        if (!exitType) {
          alert('Selecione o tipo de saída.');
          return;
        }
        if (!exitNote.trim()) {
          alert('Informe o motivo da saída.');
          return;
        }
        await cancelPatient(id, exitNote.trim(), exitType as 'ALTA_MEDICA' | 'OBITO' | 'OUTRO');
        setCancellingId(null);
        setExitType('');
        setExitNote('');
      }
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function fillAiSuggestion(p: PatientData) {
    setLoadingAi(p.id);
    try {
      // Simulate an AI thinking delay
      await new Promise(r => setTimeout(r, 600));
      let text = '';
      if (p.severity === 'SALA_VERMELHA' || p.score === -1) {
        text = 'Prioridade 1: Risco Iminente de Vida. Acionar recurso de Vaga Zero IMEDIATAMENTE (Hospital Regional ou Santa Casa). Acionar chefia médica no local.';
      } else if (p.score > 35) {
        text = 'Score muito crítico. Se houver fila no CTI, comunique o plantonista da Regulação para contato telefônico urgente com a origem.';
      } else if (p.status === 'OFFERED') {
        text = 'Já estamos solicitando este leito. Uma boa prática é cobrar a resposta em sistema ou acionar o contato do hospital no Dashboard.';
      } else {
        text = 'Paciente estável aguardando vaga. Monitoramento de rotina a cada 6h recomendado.';
      }
      setAiSuggestion(prev => ({ ...prev, [p.id]: text }));
    } catch (err) {
      // ignore
    } finally {
      setLoadingAi(null);
    }
  }

  React.useEffect(() => {
    if (criticalScorePatients.length > 0) {
      window.dispatchEvent(new CustomEvent('CIRILA_CRITICAL_ALERT', { detail: criticalScorePatients.length }));
    }
  }, [initialPatients.length]);

  return (
    <>
    <div className="card" style={{ overflowX: 'auto', padding: '0', backgroundColor: 'var(--surface)' }}>
      
      <div className={styles.queueHeader}>
        <div className={styles.queueTitle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Fila Dinâmica de Pacientes</h1>
            <Link href="/patients/new" className="btn btn-primary" style={{ 
              padding: '0.4rem 1rem', 
              fontSize: '0.8rem', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(59, 130, 246, 0.25)', 
              color: '#60a5fa', 
              border: '1px solid rgba(59, 130, 246, 0.4)',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <Plus size={16} /> Nova Regulação
            </Link>
          </div>
          <p style={{ margin: 0, opacity: 0.7 }}>Gerenciamento estratégico de transferências e ocupação.</p>
        </div>
        
        <div className={`no-print ${styles.filterPanel}`}>
          <PrintButton user={user} />
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div className={styles.searchWrapper}>
              <div className={styles.searchIcon}>
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar por paciente ou protocolo..." 
                className="input"
                style={{ paddingLeft: '2.5rem', borderRadius: '12px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <select 
                className="input" 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ appearance: 'none', borderRadius: '12px', fontWeight: 600 }}
              >
                <option value="ALL">Todas as Vagas</option>
                <option value="WAITING">Aguardando Vaga</option>
                <option value="OFFERED">Em Solicitação</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          
          <thead style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '0.75rem 1.5rem' }}>Critério (Score)</th>
              <th style={{ padding: '0.75rem 1.5rem' }}>Paciente</th>
              <th style={{ padding: '0.75rem 1.5rem' }}>Diagnóstico & Origem</th>
              <th style={{ padding: '0.75rem 1.5rem' }}>Status / Espera</th>
              <th className="no-print" style={{ padding: '0.75rem 1.5rem', minWidth: '320px' }}>Ações de Regulação</th>
            </tr>
          </thead>

          <tbody>
            {filteredPatients.map((p) => {
              
              const canOfferToHNSG = p.severity !== 'CTI' && p.severity !== 'SALA_VERMELHA';

              // Filtra: hospitais já solicitados para este paciente não aparecem novamente
              // LOGIC FIX: Também remove o hospital de origem para não permitir auto-transferência
              const availableHospitals = ALL_HOSPITALS.filter(h => {
                if (h === p.origin_hospital) return false;
                if (h === 'Hospital Doutor Nelson Gonçalves (HNSG)') return canOfferToHNSG;
                if (p.requested_hospitals && p.requested_hospitals.includes(h)) return false;
                return true;
              });

              // Filtra: hospitais já recusados não aparecem no dropdown de recusa
              const availableRefusalHospitals = ALL_HOSPITALS.filter(h => {
                if (p.refused_hospitals && p.refused_hospitals.includes(h)) return false;
                return true;
              });

              return (
                <React.Fragment key={p.id}>
                  <tr style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: p.severity === 'SALA_VERMELHA'
                      ? 'rgba(239,68,68,0.12)'
                      : (p.isDelayed ? 'rgba(239,68,68,0.07)' : 'transparent'),
                    borderLeft: p.severity === 'SALA_VERMELHA'
                      ? '4px solid #ef4444'
                      : (p.isDelayed ? '4px solid #f97316' : '4px solid transparent'),
                  }}>
                    
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                        <span className={`badge badge-${p.severity}`}>{p.severity}</span>
                        <strong style={{ fontSize: '18px', color: (p.score > 35 || p.score === -1) ? '#dc2626' : 'inherit' }}>
                          {p.score === -1 ? 'VAGA ZERO' : `${p.score} pts`}
                        </strong>
                        {(p.score > 35 || p.score === -1) && (
                          <span className="animate-pulse" style={{ fontSize: '10px', backgroundColor: '#dc2626', color: 'white', padding: '3px 8px', borderRadius: '4px', fontWeight: 800 }}>
                            RISCO MÁXIMO
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.5rem', minWidth: '240px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <strong style={{ color: '#f1f5f9', fontSize: '15px' }}>{p.name}</strong>
                          <button 
                            onClick={() => togglePatientPrivateProfile(p.id, p.is_private ?? false)}
                            style={{ 
                              background: p.is_private ? 'linear-gradient(135deg, #facc15, #a16207)' : 'rgba(30, 41, 59, 0.5)', 
                              color: p.is_private ? '#000' : '#94a3b8', 
                              border: p.is_private ? 'none' : '2px solid rgba(148, 163, 184, 0.4)', 
                              padding: '6px 14px', 
                              borderRadius: '8px', 
                              fontSize: '0.75rem', 
                              fontWeight: 900, 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.3s ease',
                              boxShadow: p.is_private ? '0 0 20px rgba(234, 179, 8, 0.4)' : 'none',
                              whiteSpace: 'nowrap',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                            title={p.is_private ? "Clique para mudar para perfil SUS" : "Clique para mudar para perfil Privado"}
                          >
                            {p.is_private ? <ShieldCheck size={16} strokeWidth={3} /> : <ShieldAlert size={16} strokeWidth={3} />}
                            {p.is_private ? 'PERFIL PRIVADO' : 'PERFIL SUS'}
                          </button>
                        </div>
                        {p.isDelayed && p.severity !== 'SALA_VERMELHA' && (
                          <span style={{ color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> Fila Atrasada
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 600, marginTop: '4px' }}>
                          {p.attempts_count} recusa(s)
                        </span>
                        {p.refused_hospitals && p.refused_hospitals.length > 0 && (
                          <ul style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '1rem', margin: 0 }}>
                            {p.refused_hospitals.map((hosp, idx) => (
                              <li key={idx}>{hosp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.5rem' }}>
                      {/* Tela normal: truncado. Impressão: completo */}
                      <span className="no-print">{truncateString(p.diagnosis, 35)}</span>
                      <span className="only-print" style={{ fontWeight: 600 }}>{p.diagnosis}</span>
                      <br />
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Origem: {p.origin_hospital}</span>
                      
                      {/* AÇÃO DE COBRAR NIR (SISTEMA) */}
                      {HOSPITAL_CONTACTS[p.origin_hospital] && (
                        <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <button 
                            onClick={() => setChargeModal({ id: p.id, origin: p.origin_hospital })}
                            className="btn"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '11px', backgroundColor: 'rgba(22,163,74,0.15)', color: '#86efac', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '6px' }}
                            title="Cobrar pelo Sistema"
                          >
                            <MessageCircle size={12} /> Cobrar NIR
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.5rem', minWidth: '180px' }}>
                      <div>
                        {p.status === 'WAITING' ? 'AGUARDANDO' : 'EM SOLICITAÇÃO'}
                      </div>
                      <small style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <Clock size={12} /> {formatHours(p.created_at)}
                      </small>

                      {p.requested_hospitals && p.requested_hospitals.length > 0 && (
                        <div style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', borderRadius: '4px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#3730a3', fontWeight: 600 }}>Solicitado para:</span>
                          <ul style={{ fontSize: '11px', color: '#4338ca', paddingLeft: '1rem', margin: 0 }}>
                            {p.requested_hospitals.map((hosp, idx) => (
                              <li key={idx} style={{ paddingBottom: '2px' }}>{hosp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>

                    <td className="no-print" style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        
                        {/* BED REQUEST LOGIC */}
                        {requestingId === p.id ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', width: '100%' }}>
                            <select 
                              className="input" 
                              style={{ padding: '0.25rem', flex: 1 }} 
                              value={targetHospital} 
                              onChange={(e) => setTargetHospital(e.target.value)}
                            >
                              <option value="">Solicitado para...</option>
                              {availableHospitals.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                              {availableHospitals.length === 0 && (
                                <option disabled value="">Todos os hospitais já foram solicitados</option>
                              )}
                            </select>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '0.25rem 0.75rem' }}
                              onClick={() => handleAction('request', p.id)} 
                              disabled={loadingId === p.id || !targetHospital}
                            >
                              Confirmar
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem' }}
                              onClick={() => { setRequestingId(null); setTargetHospital(''); }}
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => setAttachModal({ id: p.id, name: p.name })}
                              style={{ 
                                background: 'rgba(59, 130, 246, 0.15)', 
                                color: '#60a5fa', 
                                border: '1px solid rgba(59, 130, 246, 0.3)', 
                                padding: '0.4rem 0.6rem', 
                                borderRadius: '8px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                flex: 1
                              }}
                              title="Anexar Evolução Médica (PDF/Laudos)"
                            >
                              <Paperclip size={14} /> Anexar
                            </button>

                            <button 
                              className="btn btn-primary" 
                              style={{ flex: 2, padding: '0.5rem' }}
                              onClick={() => setRequestingId(p.id)} 
                              disabled={loadingId === p.id}
                            >
                              Leito Solicitado
                            </button>
                            
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.5rem', background: '#0f172a', color: 'white', border: 'none' }}
                              onClick={() => setBlastModal({ id: p.id, severity: p.severity })}
                              title="Disparo em Massa (E-mail)"
                            >
                              <Send size={16} /> Disparo
                            </button>
                          </div>
                        )}

                        {/* REFUSAL LOGIC */}
                        {refusingId === p.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', width: '100%', border: '1px solid #fecaca' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select 
                                className="input" 
                                style={{ padding: '0.25rem', flex: 1, borderColor: '#fca5a5', color: '#1e293b', background: '#fff' }} 
                                value={refusalHospital} 
                                onChange={(e) => { setRefusalHospital(e.target.value); if (e.target.value !== 'Paciente Recusou Transferencia') setRefusalNote(''); }}
                              >
                                <option value="">Recusado por...</option>
                                <option value="Paciente Recusou Transferencia" style={{ fontWeight: 600, color: '#b45309' }}>Paciente Recusou Transferencia</option>
                                {availableRefusalHospitals.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                                {availableRefusalHospitals.length === 0 && (
                                  <option disabled value="">Todos os hospitais já foram registrados</option>
                                )}
                              </select>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '0.25rem 0.75rem', whiteSpace: 'nowrap' }}
                                onClick={() => handleAction('refusal', p.id)} 
                                disabled={loadingId === p.id || !refusalHospital || (refusalHospital === 'Paciente Recusou Transferencia' && !refusalNote.trim())}
                              >
                                Confirmar
                              </button>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.25rem 0.5rem' }}
                                onClick={() => { setRefusingId(null); setRefusalHospital(''); setRefusalNote(''); }}
                              >
                                X
                              </button>
                            </div>

                            {/* Campo de motivo — aparece apenas quando paciente recusou */}
                            {refusalHospital === 'Paciente Recusou Transferencia' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  ⚠️ Motivo da recusa do paciente *
                                </label>
                                <textarea
                                  rows={2}
                                  placeholder="Ex: Paciente recusou pois família é contra, aguarda vaga em outro município..."
                                  value={refusalNote}
                                  onChange={(e) => setRefusalNote(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1.5px solid #fca5a5',
                                    fontSize: '0.85rem',
                                    resize: 'vertical',
                                    fontFamily: 'Inter, sans-serif',
                                    color: '#1e293b',
                                    background: '#fff',
                                    outline: 'none',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <button 
                            className="btn" 
                            onClick={() => setRefusingId(p.id)} 
                            disabled={loadingId === p.id}
                            style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                          >
                            Leito Recusado
                          </button>
                        )}

                        {/* TRANSFER LOGIC */}
                        {p.status === 'OFFERED' && (
                          transferringId === p.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#dcfce7', padding: '0.5rem', borderRadius: '8px', width: '100%' }}>
                              <select 
                                className="input" 
                                style={{ padding: '0.25rem', flex: 1, borderColor: '#86efac' }} 
                                value={transferHospital} 
                                onChange={(e) => setTransferHospital(e.target.value)}
                              >
                                <option value="">Transferido para...</option>
                                {TRANSFER_HOSPITALS.filter(h => h !== p.origin_hospital).map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <button 
                                className="btn" 
                                style={{ padding: '0.25rem 0.75rem', backgroundColor: '#16a34a', color: 'white' }}
                                onClick={() => handleAction('transfer', p.id)} 
                                disabled={loadingId === p.id || !transferHospital}
                              >
                                Confirmar
                              </button>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.25rem 0.5rem' }}
                                onClick={() => { setTransferringId(null); setTransferHospital(''); }}
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <button className="btn" style={{ backgroundColor: '#16a34a', color: 'white' }} onClick={() => setTransferringId(p.id)} disabled={loadingId === p.id}>
                              Transferir
                            </button>
                          )
                        )}

                        {/* SAÍDA DO PACIENTE (Alta Médica / Óbito / Outro) */}
                        {cancellingId === p.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(220,38,38,0.08)', padding: '0.75rem', borderRadius: '8px', width: '100%', border: '1px solid rgba(220,38,38,0.25)' }}>
                            {/* Label */}
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Tipo de saída da regulação
                            </div>

                            {/* 3 botões de tipo */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                className="btn"
                                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem', border: `2px solid ${exitType === 'ALTA_MEDICA' ? '#22c55e' : 'rgba(34,197,94,0.3)'}`, background: exitType === 'ALTA_MEDICA' ? 'rgba(34,197,94,0.2)' : 'transparent', color: '#86efac', fontWeight: 700 }}
                                onClick={() => setExitType('ALTA_MEDICA')}
                              >
                                ✅ Alta Médica
                              </button>
                              <button
                                className="btn"
                                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem', border: `2px solid ${exitType === 'OBITO' ? '#94a3b8' : 'rgba(148,163,184,0.3)'}`, background: exitType === 'OBITO' ? 'rgba(148,163,184,0.15)' : 'transparent', color: '#cbd5e1', fontWeight: 700 }}
                                onClick={() => setExitType('OBITO')}
                              >
                                🪦 Óbito
                              </button>
                              <button
                                className="btn"
                                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem', border: `2px solid ${exitType === 'OUTRO' ? '#f59e0b' : 'rgba(245,158,11,0.3)'}`, background: exitType === 'OUTRO' ? 'rgba(245,158,11,0.1)' : 'transparent', color: '#fcd34d', fontWeight: 700 }}
                                onClick={() => setExitType('OUTRO')}
                              >
                                📋 Outro
                              </button>
                            </div>

                            {/* Campo motivo */}
                            {exitType && (
                              <textarea
                                rows={2}
                                placeholder={exitType === 'ALTA_MEDICA' ? 'Ex: Paciente recebeu alta do hospital de origem...' : exitType === 'OBITO' ? 'Ex: Paciente foi a óbito às 14h32 no HMD...' : 'Descreva o motivo da retirada da regulação...'}
                                value={exitNote}
                                onChange={(e) => setExitNote(e.target.value)}
                                style={{ width: '100%', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1.5px solid rgba(220,38,38,0.4)', fontSize: '0.82rem', resize: 'vertical', fontFamily: 'Inter, sans-serif', color: '#f1f5f9', background: 'rgba(0,0,0,0.3)', outline: 'none' }}
                              />
                            )}

                            {/* Ações */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn"
                                style={{ padding: '0.3rem 0.75rem', background: '#dc2626', color: 'white', fontWeight: 700, fontSize: '0.82rem', opacity: (!exitType || !exitNote.trim()) ? 0.4 : 1 }}
                                onClick={() => handleAction('cancel', p.id)}
                                disabled={loadingId === p.id || !exitType || !exitNote.trim()}
                              >
                                Confirmar Saída
                              </button>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
                                onClick={() => { setCancellingId(null); setExitType(''); setExitNote(''); }}
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn"
                            onClick={() => setCancellingId(p.id)}
                            disabled={loadingId === p.id}
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
                          >
                            Saída / Cancelar
                          </button>
                        )}

                        {/* EVOLVE LOGIC */}
                        {evolvingId === p.id ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fff7ed', padding: '0.5rem', borderRadius: '8px', width: '100%' }}>
                            <select 
                              className="input" 
                              style={{ padding: '0.25rem', width: '140px', borderColor: '#fdba74' }} 
                              value={newSeverity} 
                              onChange={(e) => setNewSeverity(e.target.value)}
                            >
                              <option value="">Nova Gravidade...</option>
                              {SEVERITY_LEVELS.filter(s => s.value !== p.severity).map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            <input 
                              type="text" 
                              className="input"
                              placeholder="Atualizar Diagnóstico (Opcional)"
                              style={{ padding: '0.25rem', flex: 1, borderColor: '#fdba74' }}
                              value={newDiagnosis}
                              onChange={(e) => setNewDiagnosis(e.target.value)}
                            />
                            <button 
                              className="btn" 
                              style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f97316', color: 'white' }}
                              onClick={() => handleAction('evolve', p.id)} 
                              disabled={loadingId === p.id || !newSeverity}
                            >
                              Confirmar
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem' }}
                              onClick={() => { setEvolvingId(null); setNewSeverity(''); setNewDiagnosis(''); }}
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn" 
                            onClick={() => setEvolvingId(p.id)} 
                            disabled={loadingId === p.id}
                            style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                            title="Atualizar Quadro Clínico"
                          >
                            <TrendingUp size={16} /> Evoluir
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-outline" 
                          onClick={() => fillAiSuggestion(p)} 
                          disabled={loadingAi === p.id}
                          style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
                          title="Dica da Inteligência"
                        >
                          <Activity size={16} /> IA
                        </button>

                      </div>
                    </td>

                  </tr>

                  {/* AI Suggestion Row */}
                  {aiSuggestion[p.id] && (
                    <tr>
                      <td colSpan={5} style={{ padding: '0.5rem 1.5rem 1rem 1.5rem', backgroundColor: '#faf5ff', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <MessageSquare size={18} color="#8b5cf6" style={{ marginTop: '2px' }} />
                          <div style={{ flex: 1, fontSize: '0.875rem', color: '#4c1d95' }}>
                            <strong>Sugestão Inteligente:</strong> {aiSuggestion[p.id]}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>

    {chargeModal && (
      <ChargeEvolutionModal 
        patientId={chargeModal.id} 
        originHospital={chargeModal.origin} 
        onClose={() => setChargeModal(null)} 
      />
    )}

    {blastModal && (
      <MassBlastModal 
        patientId={blastModal.id} 
        severity={blastModal.severity} 
        onClose={() => setBlastModal(null)} 
      />
    )}

    {attachModal && (
      <AttachEvolutionModal
        patientId={attachModal.id}
        patientName={attachModal.name}
        onClose={() => setAttachModal(null)}
      />
    )}
    </>
  )
}