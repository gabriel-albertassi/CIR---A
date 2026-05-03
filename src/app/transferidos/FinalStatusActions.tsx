'use client';

import React, { useState } from 'react';
import { updateFinalStatus, returnToQueue } from './actions';
import { RotateCcw, Check, Skull } from 'lucide-react';

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

  async function handleReturnToQueue() {
    if (!window.confirm('Deseja realmente retornar este paciente para a fila de regulação? a data de transferência será removida.')) return;

    setLoading(true);
    try {
      const res = await returnToQueue(patientId);
      if (res.error) {
        alert(res.error);
      }
    } catch (e) {
      alert('Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  const returnButton = (
    <button 
      className="btn" 
      disabled={loading}
      onClick={handleReturnToQueue}
      style={{ 
        padding: '0.5rem 1rem', 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        color: '#60a5fa', 
        border: '1.5px solid rgba(59, 130, 246, 0.3)', 
        fontSize: '0.72rem', 
        borderRadius: '10px', 
        fontWeight: 800, 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
      title="Retornar para a Fila de Regulação"
    >
      <RotateCcw size={14} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} /> VOLTAR PARA FILA
    </button>
  );

  if (currentStatus === 'ALTA') {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ padding: '0.3rem 0.6rem', background: '#dcfce7', color: '#16a34a', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Alta Médica</span>
        {returnButton}
      </div>
    );
  }
  if (currentStatus === 'FALECIMENTO') {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ padding: '0.3rem 0.6rem', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Falecimento</span>
        {returnButton}
      </div>
    );
  }
  if (currentStatus === 'CANCELLED') {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ padding: '0.3rem 0.6rem', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Cancelado</span>
        {returnButton}
      </div>
    );
  }

  // Se estiver só TRANSFERIDO, mostra opções:
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button 
        className="btn" 
        disabled={loading}
        onClick={() => handleFinalAction('ALTA')}
        style={{ padding: '0.35rem 0.6rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '0.75rem', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <Check size={14} /> Alta
      </button>
      <button 
        className="btn" 
        disabled={loading}
        onClick={() => handleFinalAction('FALECIMENTO')}
        style={{ padding: '0.35rem 0.6rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.75rem', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <Skull size={14} /> Óbito
      </button>
      {returnButton}
    </div>
  );
}
