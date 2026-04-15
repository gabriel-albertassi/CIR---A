'use client';

import { Printer } from 'lucide-react';
import React from 'react';

export default function PrintButton() {
  return (
    <button 
      className="btn btn-outline no-print"
      onClick={() => window.print()}
      style={{ padding: '0.5rem', borderRadius: '10px', color: '#64748b', borderColor: '#e2e8f0', background: 'white' }}
      title="Imprimir Relatório do Painel"
    >
      <Printer size={18} />
    </button>
  );
}
