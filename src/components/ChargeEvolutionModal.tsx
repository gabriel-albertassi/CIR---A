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

    if (!res.success) {
      alert(res.error);
    } else {
      if (method === 'WHATSAPP' && res.data?.whatsappUrl) {
        window.open(res.data.whatsappUrl, '_blank');
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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(2, 6, 23, 1)', backdropFilter: 'blur(40px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483647 }}>
      <div className="card" style={{ width: '420px', padding: '2.5rem', position: 'relative', animation: 'fadeInSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', border: '1px solid rgba(56, 189, 248, 0.5)', borderRadius: '32px', background: 'rgba(15, 23, 42, 1)', boxShadow: '0 60px 120px -20px rgba(0, 0, 0, 1), 0 0 80px rgba(56, 189, 248, 0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <X size={18} strokeWidth={2.5} />
        </button>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>Cobrar Evolução Médica</h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.5' }}>
          A <strong>Cirila</strong> abrirá o canal oficial da regulação
          <span style={{ color: '#38bdf8', fontWeight: 800 }}> (+55 24 99961-5198) </span>
          para exigir a atualização clínica do paciente no NIR do <strong>{originHospital}</strong>.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button
            className="btn"
            disabled={loading}
            onClick={() => handleSend('WHATSAPP')}
            style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 800, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase' }}
          >
            <MessageCircle size={18} strokeWidth={2.5} /> Disparar WhatsApp
          </button>
          <button
            className="btn"
            disabled={loading}
            onClick={() => handleSend('EMAIL')}
            style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 800, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase' }}
          >
            <Mail size={18} strokeWidth={2.5} /> Disparar E-mail
          </button>
        </div>
      </div>
    </div>
  );
}
