'use client';

import React, { useState } from 'react';
import { updateFinalStatus } from './actions';

export default function FinalStatusActions({ patientId, currentStatus }: { patientId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  async function handleFinalAction(action: 'ALTA' | 'FALECIMENTO') {
    const confirmMsg = action === 'ALTA' ? 'Confirmar Alta Médica do sistema?' : 'Confirmar Óbito no sistema?';
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await updateFinalStatus(patientId, action);
      if (res.error) {
        alert(res.error);
      }
    } catch (e) {
      alert('Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === 'ALTA') {
    return <span style={{ padding: '0.3rem 0.6rem', background: '#dcfce7', color: '#16a34a', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Alta Médica</span>;
  }
  if (currentStatus === 'FALECIMENTO') {
    return <span style={{ padding: '0.3rem 0.6rem', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Falecimento</span>;
  }
  if (currentStatus === 'CANCELLED') {
    return <span style={{ padding: '0.3rem 0.6rem', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Cancelado</span>;
  }

  // Se estiver só TRANSFERIDO, mostra opções:
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button 
        className="btn" 
        disabled={loading}
        onClick={() => handleFinalAction('ALTA')}
        style={{ padding: '0.3rem 0.5rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '0.75rem', borderRadius: '6px' }}
      >
        Alta
      </button>
      <button 
        className="btn" 
        disabled={loading}
        onClick={() => handleFinalAction('FALECIMENTO')}
        style={{ padding: '0.3rem 0.5rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.75rem', borderRadius: '6px' }}
      >
        Óbito
      </button>
    </div>
  );
}
