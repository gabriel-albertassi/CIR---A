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
  
  const basePublic = PUBLIC_HOSPITALS.filter(u => {
    const low = u.toLowerCase();
    return low !== 'upa 24h' && !low.includes('regional') && !low.includes('upa');
  });
  const basePrivate = [...PRIVATE_HOSPITALS, 'Hospitais Privados (Geral)'];

  // Filter if targeted, otherwise show all relevant
  const publicUnitsToShow = isTargeted 
    ? (initialSelectedUnits || []).filter(u => {
        const low = u.toLowerCase();
        return !basePrivate.includes(u) && low !== 'upa 24h' && !low.includes('regional') && !low.includes('upa');
      })
    : basePublic;

  const privateUnitsToShow = isTargeted
    ? (initialSelectedUnits || []).filter(u => basePrivate.includes(u))
    : basePrivate;

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
    
    // Determine profile based on selection
    const hasPrivate = selectedUnits.some(u => basePrivate.includes(u));
    const hasPublic = selectedUnits.some(u => basePublic.includes(u));
    let profile: 'PUBLIC_ONLY' | 'PUBLIC_AND_PRIVATE' | 'PRIVATE_ONLY' = 'PUBLIC_ONLY';
    if (hasPrivate && hasPublic) profile = 'PUBLIC_AND_PRIVATE';
    else if (hasPrivate) profile = 'PRIVATE_ONLY';

    const res = await sendMassBedRequest(patientId, profile, severity, selectedUnits);
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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(40px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999999 }}>
      <div className="card" style={{ width: '520px', padding: '2.5rem', position: 'relative', animation: 'fadeInSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', maxHeight: '92vh', overflowY: 'auto', border: '1px solid rgba(56, 189, 248, 0.4)', fontFamily: "'Outfit', sans-serif", background: 'rgba(15, 23, 42, 0.95)', boxShadow: '0 60px 120px -20px rgba(0, 0, 0, 1), 0 0 50px rgba(56, 189, 248, 0.15)', borderRadius: '32px', backdropFilter: 'blur(60px)' }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            cursor: 'pointer', 
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {!isSent ? (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                {isTargeted ? 'Notificação Direta' : 'Disparo de Vaga'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                Unidades NIR que receberão a solicitação de <strong>{severity}</strong>:
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>REDE PÚBLICA (SUS)</span>
                {!isTargeted && (
                  <button onClick={toggleAllPublic} style={{ fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>
                    Marcar/Desmarcar Todos
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {publicUnitsToShow.map(unit => {
                  const isHNSG = unit.includes('Nelson Gonçalves');
                  const disabled = isHNSG && !canOfferToHNSG;
                  const checked = selectedUnits.includes(unit);
                  return (
                    <label key={unit} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '10px 14px', 
                      background: checked ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      border: `1px solid ${checked ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                      transition: 'all 0.2s',
                      opacity: disabled ? 0.4 : 1
                    }}>
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        onChange={() => !disabled && toggleUnit(unit)}
                        disabled={disabled}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#38bdf8' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: checked ? '#38bdf8' : '#f1f5f9' }}>{unit}</span>
                        {isHNSG && !canOfferToHNSG && (
                          <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase' }}>⚠️ Restrito (Apenas Clínica)</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {privateUnitsToShow.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>REDE PRIVADA</span>
                  {!isTargeted && (
                    <button onClick={toggleAllPrivate} style={{ fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>
                      Marcar/Desmarcar Todos
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {privateUnitsToShow.map(unit => {
                    const checked = selectedUnits.includes(unit);
                    return (
                      <label key={unit} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px 14px', 
                        background: checked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: `1px solid ${checked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                        transition: 'all 0.2s'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={checked} 
                          onChange={() => toggleUnit(unit)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f59e0b' }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: checked ? '#f59e0b' : '#f1f5f9' }}>{unit}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button 
              disabled={loading || selectedUnits.length === 0}
              onClick={handleSend}
              style={{ 
                width: '100%', 
                height: '48px',
                background: selectedUnits.length > 0 ? 'linear-gradient(135deg, #38bdf8, #0284c7)' : 'rgba(255,255,255,0.05)', 
                color: selectedUnits.length > 0 ? '#ffffff' : '#475569', 
                borderRadius: '14px', 
                fontSize: '0.85rem', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center', 
                gap: '10px',
                fontWeight: '800', 
                cursor: selectedUnits.length > 0 ? 'pointer' : 'not-allowed',
                border: 'none',
                boxShadow: selectedUnits.length > 0 ? '0 20px 40px -10px rgba(56, 189, 248, 0.4)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span>PROCESSANDO...</span>
                </>
              ) : (
                <>
                  <Send size={18} strokeWidth={2.5} /> 
                  <span>DISPARAR PARA {selectedUnits.length} UNIDADES</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'rgba(16, 185, 129, 0.1)', 
              borderRadius: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Sucesso!</h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.5' }}>
              As solicitações foram enviadas para as unidades NIR selecionadas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.05)', maxHeight: '240px', overflowY: 'auto', marginBottom: '2rem' }}>
              {selectedUnits.map(hosp => (
                <div key={hosp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>{hosp.replace('Hospital ', '').split(' (')[0]}</span>
                  <button 
                    onClick={() => handleZap(hosp)}
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}
                  >
                    <MessageCircle size={14} /> Zap
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={onClose}
              style={{ 
                width: '100%', 
                padding: '0.85rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: '#94a3b8', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px', 
                fontWeight: 700, 
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              Concluir e Voltar
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
