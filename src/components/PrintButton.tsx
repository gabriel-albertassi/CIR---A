'use client';

import { Printer } from 'lucide-react';
import React from 'react';

export default function PrintButton({ user }: { user: any }) {
  const canPrint = user?.role === 'ADMIN' || user?.canPrintReports;

  return (
    <button 
      className="btn btn-outline no-print"
      onClick={() => {
        if (canPrint) window.print();
      }}
      style={{ 
        padding: '0.5rem', 
        borderRadius: '10px', 
        color: canPrint ? '#64748b' : '#94a3b8', 
        borderColor: canPrint ? '#e2e8f0' : 'rgba(255,255,255,0.05)', 
        background: canPrint ? 'white' : 'rgba(255,255,255,0.03)',
        cursor: canPrint ? 'pointer' : 'not-allowed',
        opacity: canPrint ? 1 : 0.5
      }}
      title={canPrint ? "Imprimir Relatório do Painel" : "Acesso Restrito: Impressão não autorizada"}
    >
      <Printer size={18} />
    </button>
  );
}
