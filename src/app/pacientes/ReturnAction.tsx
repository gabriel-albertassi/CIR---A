'use client';

import React, { useState } from 'react';
import { returnToQueue } from '../transferidos/actions';
import { RotateCcw } from 'lucide-react';

export default function ReturnAction({ patientId, currentStatus }: { patientId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  // Só mostra o botão se o paciente NÃO estiver na fila ativa
  const isInactive = ['TRANSFERRED', 'ALTA', 'FALECIMENTO', 'CANCELLED'].includes(currentStatus);

  if (!isInactive) return null;

  async function handleReturn() {
    if (!window.confirm('Deseja realmente retornar este paciente para a fila de regulação? Dados de desfecho serão limpos.')) return;

    setLoading(true);
    try {
      const res = await returnToQueue(patientId);
      if (res.error) {
        alert(res.error);
      } else {
        // Recarregar a página para refletir a mudança (ou confiar no revalidatePath da action)
        window.location.reload();
      }
    } catch (e) {
      alert('Erro ao processar retorno');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      className="btn" 
      disabled={loading}
      onClick={handleReturn}
      style={{ 
        padding: '0.4rem 0.8rem', 
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
        color: 'white', 
        border: 'none', 
        fontSize: '0.65rem', 
        borderRadius: '6px', 
        fontWeight: 800, 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px',
        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
        textTransform: 'uppercase',
        opacity: loading ? 0.7 : 1
      }}
      title="Retornar para a Fila de Regulação"
    >
      <RotateCcw size={12} strokeWidth={3} /> {loading ? '...' : 'REATIVAR'}
    </button>
  );
}
