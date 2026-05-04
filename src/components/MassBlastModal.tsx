'use client';

import React, { useState } from 'react';
import { sendMassBedRequest, getBedRequestWhatsAppUrl } from '../app/patients/communicationActions';
import { X, Send, MessageCircle, CheckCircle2 } from 'lucide-react';
import { PUBLIC_HOSPITALS, PRIVATE_HOSPITALS } from '@/lib/constants';

export default function MassBlastModal({ 
  patientId, 
  severity, 
  onClose, 
  isPrivatePatient,
  initialSelectedUnits 
}: { 
  patientId: string, 
  severity: string, 
  onClose: () => void, 
  isPrivatePatient?: boolean,
  initialSelectedUnits?: string[]
}) {
  const [selectedUnits, setSelectedUnits] = useState<string[]>(initialSelectedUnits || []);
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const canOfferToHNSG = severity !== 'CTI' && severity !== 'SALA_VERMELHA';
  
  const isTargeted = !!initialSelectedUnits && initialSelectedUnits.length > 0;
  
  const basePublic = [...PUBLIC_HOSPITALS, 'Hospital Regional'];
  const basePrivate = PRIVATE_HOSPITALS;

  // Filter if targeted, otherwise show all relevant
  const publicUnitsToShow = isTargeted 
    ? (initialSelectedUnits || []).filter(u => !basePrivate.includes(u))
    : basePublic;
    
  const privateUnitsToShow = isTargeted
    ? (initialSelectedUnits || []).filter(u => basePrivate.includes(u))
    : (isPrivatePatient ? basePrivate : []);

  const toggleUnit = (unit: string) => {
    setSelectedUnits(prev => 
      prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
    );
  };

  const toggleAllPublic = () => {
    const allSelected = publicUnitsToShow.every(u => selectedUnits.includes(u));
    if (allSelected) {
      setSelectedUnits(prev => prev.filter(u => !publicUnitsToShow.includes(u)));
    } else {
      setSelectedUnits(prev => Array.from(new Set([...prev, ...publicUnitsToShow])));
    }
  };

  const toggleAllPrivate = () => {
    const allSelected = privateUnitsToShow.every(u => selectedUnits.includes(u));
    if (allSelected) {
      setSelectedUnits(prev => prev.filter(u => !privateUnitsToShow.includes(u)));
    } else {
      setSelectedUnits(prev => Array.from(new Set([...prev, ...privateUnitsToShow])));
    }
  };

  async function handleSend() {
    if (selectedUnits.length === 0) {
      alert("Por favor, selecione pelo menos uma unidade para o disparo.");
      return;
    }
    setLoading(true);
    const res = await sendMassBedRequest(patientId, 'PUBLIC_ONLY', severity, selectedUnits);
    setLoading(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      setIsSent(true);
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('NIR_WEBHOOK_REPLY', { detail: `Temos retornos/respostas às vagas disparadas por e-mail há pouco!` }));
        }
      }, 15000);
    }
  }

  async function handleZap(hosp: string) {
    const url = await getBedRequestWhatsAppUrl(patientId, hosp);
    if (url) window.open(url, '_blank');
    else alert("Número de WhatsApp não encontrado para este NIR.");
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '480px', padding: '2rem', position: 'relative', animation: 'fadeInSlideUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            background: '#f1f5f9', 
            border: '1px solid #e2e8f0', 
            cursor: 'pointer', 
            color: '#64748b',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {!isSent ? (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              {isTargeted ? 'Notificação de Unidade' : 'Disparo de Vaga'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Selecione as unidades NIR que devem receber a solicitação oficial de <strong>{severity}</strong>:
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Rede Pública</span>
                {!isTargeted && <button onClick={toggleAllPublic} style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Alternar Todos</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {publicUnitsToShow.map(unit => {
                  const isHNSG = unit.includes('Nelson Gonçalves');
                  const disabled = isHNSG && !canOfferToHNSG;
                  return (
                    <label key={unit} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '10px 14px', 
                      background: selectedUnits.includes(unit) ? '#eff6ff' : '#f8fafc',
                      borderRadius: '10px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      border: `1px solid ${selectedUnits.includes(unit) ? '#bfdbfe' : '#f1f5f9'}`,
                      transition: 'all 0.2s',
                      opacity: disabled ? 0.5 : 1
                    }}>
                      <input 
                        type="checkbox" 
                        checked={selectedUnits.includes(unit)} 
                        onChange={() => !disabled && toggleUnit(unit)}
                        disabled={disabled}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{unit}</span>
                        {isHNSG && !canOfferToHNSG && (
                          <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700 }}>❌ Não recebe CTI / Sala Vermelha</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {privateUnitsToShow.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Rede Privada</span>
                  {!isTargeted && <button onClick={toggleAllPrivate} style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Alternar Todos</button>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {privateUnitsToShow.map(unit => (
                    <label key={unit} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '10px 14px', 
                      background: selectedUnits.includes(unit) ? '#fff7ed' : '#f8fafc',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: `1px solid ${selectedUnits.includes(unit) ? '#fed7aa' : '#f1f5f9'}`,
                      transition: 'all 0.2s'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={selectedUnits.includes(unit)} 
                        onChange={() => toggleUnit(unit)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{unit}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button 
              className="btn" 
              disabled={loading || selectedUnits.length === 0}
              onClick={handleSend}
              style={{ width: '100%', padding: '1rem', background: selectedUnits.length > 0 ? 'linear-gradient(135deg, #0f172a, #334155)' : '#94a3b8', color: 'white', borderRadius: '12px', fontSize: '1rem', justifyContent: 'center', fontWeight: '700', cursor: selectedUnits.length > 0 ? 'pointer' : 'not-allowed' }}
            >
              <Send size={18} /> {loading ? 'Disparando...' : `Disparar para ${selectedUnits.length} unidade(s)`}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ color: '#10b981', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Disparo Concluído!</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
              E-mails enviados com sucesso para as unidades selecionadas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', maxHeight: '300px', overflowY: 'auto' }}>
              {selectedUnits.map(hosp => (
                <div key={hosp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', textAlign: 'left' }}>{hosp.replace('Hospital ', '').split(' (')[0]}</span>
                  <button 
                    onClick={() => handleZap(hosp)}
                    style={{ background: '#dcfce7', color: '#16a34a', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800 }}
                  >
                    <MessageCircle size={14} /> Zap
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={onClose}
              style={{ marginTop: '1.5rem', width: '100%', padding: '0.8rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Concluir e Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
