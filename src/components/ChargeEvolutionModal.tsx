'use client';

import React, { useState } from 'react';
import { sendEvolutionCharge } from '../app/patients/communicationActions';
import { X, MessageCircle, Mail } from 'lucide-react';

export default function ChargeEvolutionModal({ patientId, originHospital, onClose }: { patientId: string, originHospital: string, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSend(method: 'WHATSAPP' | 'EMAIL') {
    setLoading(true);
    const res = await sendEvolutionCharge(patientId, originHospital, method);
    setLoading(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      if (method === 'WHATSAPP' && (res as any).whatsappUrl) {
        window.open((res as any).whatsappUrl, '_blank');
      }
      
      alert(`Cobrança registrada com sucesso via ${method}!\n(O log foi gerado no prontuário do paciente)`);
      
      // Simula uma resposta do NIR chegando daqui a 12 segundos!
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('NIR_WEBHOOK_REPLY', { detail: `O NIR do ${originHospital} respondeu à sua cobrança pelo ${method}.` }));
        }
      }, 12000);

      onClose();
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '400px', padding: '2rem', position: 'relative', animation: 'fadeInSlideUp 0.3s ease' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <X size={20} />
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Cobrar Evolução Médica</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
          A <strong>Cirila</strong> abrirá o canal oficial da regulação 
          <span style={{ color: '#00d8ff', fontWeight: 800 }}> (+55 24 99961-5198) </span> 
          para exigir a atualização clínica do paciente no NIR do <strong>{originHospital}</strong>.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button 
            className="btn" 
            disabled={loading}
            onClick={() => handleSend('WHATSAPP')}
            style={{ padding: '0.8rem', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '12px', fontSize: '0.95rem', justifyContent: 'center' }}
          >
            <MessageCircle size={18} /> Disparar WhatsApp
          </button>
          <button 
            className="btn" 
            disabled={loading}
            onClick={() => handleSend('EMAIL')}
            style={{ padding: '0.8rem', background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', justifyContent: 'center' }}
          >
            <Mail size={18} /> Disparar E-mail
          </button>
        </div>
      </div>
    </div>
  );
}
