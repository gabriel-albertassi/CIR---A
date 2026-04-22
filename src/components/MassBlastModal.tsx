'use client';

import React, { useState } from 'react';
import { sendMassBedRequest, getBedRequestWhatsAppUrl } from '../app/patients/communicationActions';
import { X, Send, MessageCircle, CheckCircle2 } from 'lucide-react';
import { PUBLIC_HOSPITALS, PRIVATE_HOSPITALS } from '@/lib/constants';

export default function MassBlastModal({ patientId, severity, onClose, isPrivatePatient }: { patientId: string, severity: string, onClose: () => void, isPrivatePatient?: boolean }) {
  const [profile, setProfile] = useState<'PUBLIC_ONLY' | 'PUBLIC_AND_PRIVATE' | 'PRIVATE_ONLY'>('PUBLIC_ONLY');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [hospitalsInvolved, setHospitalsInvolved] = useState<string[]>([]);

  async function handleSend() {
    setLoading(true);
    const res = await sendMassBedRequest(patientId, profile, severity);
    setLoading(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      // Determinar hospitais envolvidos para a lista de WhatsApp
      let list: string[] = [];
      if (profile === 'PUBLIC_ONLY' || profile === 'PUBLIC_AND_PRIVATE') {
        list = [...list, ...PUBLIC_HOSPITALS];
      }
      if (profile === 'PRIVATE_ONLY' || (profile === 'PUBLIC_AND_PRIVATE' && isPrivatePatient)) {
        list = [...list, ...PRIVATE_HOSPITALS];
      }
      
      setHospitalsInvolved(list);
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
      <div className="card" style={{ width: '450px', padding: '2rem', position: 'relative', animation: 'fadeInSlideUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <X size={20} />
        </button>

        {!isSent ? (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Disparo de Vaga</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
              O sistema disparará um pedido oficial de <strong>{severity}</strong> para os NIRs. Defina o perfil da busca:
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Perfil da Busca</label>
              <select 
                className="input" 
                value={profile} 
                onChange={(e) => setProfile(e.target.value as any)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', borderColor: '#cbd5e1' }}
              >
                <option value="PUBLIC_ONLY">Apenas Rede Pública</option>
                <option value="PUBLIC_AND_PRIVATE" disabled={!isPrivatePatient}>Rede Pública e Privada {!isPrivatePatient && '(Apenas pacientes particulares)'}</option>
                <option value="PRIVATE_ONLY" disabled={!isPrivatePatient}>Apenas Rede Privada {!isPrivatePatient && '(Apenas pacientes particulares)'}</option>
              </select>
            </div>

            <button 
              className="btn" 
              disabled={loading}
              onClick={handleSend}
              style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white', borderRadius: '12px', fontSize: '1rem', justifyContent: 'center', fontWeight: '700' }}
            >
              <Send size={18} /> {loading ? 'Disparando...' : 'Efetuar Disparo Oficial'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ color: '#10b981', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>E-mails Enviados!</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
              A solicitação oficial já está na caixa dos NIRs. Deseja reforçar via <strong>WhatsApp Gateway (+55 24 99961-5198)</strong>?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', maxHeight: '300px', overflowY: 'auto' }}>
              {hospitalsInvolved.map(hosp => (
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
              Concluir e Voltar para Fila
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
