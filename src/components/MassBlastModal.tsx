'use client';

import React, { useState } from 'react';
import { sendMassBedRequest } from '../app/patients/communicationActions';
import { X, Send } from 'lucide-react';

export default function MassBlastModal({ patientId, severity, onClose }: { patientId: string, severity: string, onClose: () => void }) {
  const [profile, setProfile] = useState<'PUBLIC_ONLY' | 'PUBLIC_AND_PRIVATE' | 'PRIVATE_ONLY'>('PUBLIC_ONLY');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    const res = await sendMassBedRequest(patientId, profile, severity);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      alert('Disparo de Solicitação em Massa concluído com sucesso e e-mails ocultos gerados!');
      
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('NIR_WEBHOOK_REPLY', { detail: `Temos retornos/respostas às vagas disparadas por e-mail há pouco!` }));
        }
      }, 15000);

      onClose();
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '420px', padding: '2rem', position: 'relative', animation: 'fadeInSlideUp 0.3s ease' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <X size={20} />
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Disparo de Vaga</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
          O sistema disparará um pedido oficial de <strong>{severity}</strong> para os NIRs. Defina o perfil da grade de distribuição:
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
            <option value="PUBLIC_AND_PRIVATE">Rede Pública e Privada (BCC)</option>
            <option value="PRIVATE_ONLY">Apenas Rede Privada (BCC)</option>
          </select>
        </div>

        <button 
          className="btn" 
          disabled={loading}
          onClick={handleSend}
          style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white', borderRadius: '12px', fontSize: '1rem', justifyContent: 'center' }}
        >
          <Send size={18} /> {loading ? 'Disparando...' : 'Efetuar Disparo em Massa'}
        </button>
      </div>
    </div>
  );
}
