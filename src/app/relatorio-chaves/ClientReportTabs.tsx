'use client';

import React, { useState, useTransition } from 'react';
import { Trash2, Printer } from 'lucide-react';
import { deleteAuthorizationKey } from './actions';

type AuthKey = {
  id: string;
  key: string;
  patient: string;
  exam: string;
  origin: string;
  destination: string;
  professional: string;
  type: string;
  created_at: Date;
  month: number;
  year: number;
};

type Props = {
  tcKeys: AuthKey[];
  rnmKeys: AuthKey[];
  avulsaKeys: AuthKey[];
  isAdmin?: boolean;
};

export default function ClientReportTabs({ tcKeys, rnmKeys, avulsaKeys, isAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<'TC' | 'RNM' | 'AVULSA'>('TC');
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (window.confirm("ATENÇÃO: Tem certeza que deseja apagar esta chave permanentemente?")) {
      startTransition(async () => {
        const result = await deleteAuthorizationKey(id);
        if (result && !result.success) {
          alert(result.error);
        }
      });
    }
  };

  const renderTabContent = (data: AuthKey[], title: string, subtitle: string) => {
    // Agrupar por Mês/Ano (Assumindo que os dados já vêm ordenados)
    const grouped = data.reduce((acc, curr) => {
      // Como curr.created_at é Date (vindo do Prisma), podemos formatar
      const dateObj = new Date(curr.created_at);
      const monthYear = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalized = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      
      if (!acc[capitalized]) acc[capitalized] = [];
      acc[capitalized].push(curr);
      return acc;
    }, {} as Record<string, AuthKey[]>);

    return (
      <div className="flex flex-col h-full bg-[#071426] p-6 rounded-2xl border border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-white">{title}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors print:hidden border border-white/10"
              >
                <Printer size={16} />
                Imprimir
              </button>
            )}
            <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg">
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest">
                Total Gerado: {data.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 print:overflow-visible print:pr-0">
          {Object.entries(grouped).map(([monthYear, keysGroup]) => (
            <div key={monthYear} className="space-y-4">
              {/* Header do Mês */}
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                  {monthYear}
                </h3>
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {keysGroup.length} chaves
                </span>
              </div>

              {/* Tabela de Chaves */}
              <div className="bg-[#030914] rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-white/5">
                      <th className="p-3 pl-4">Data / Hora</th>
                      <th className="p-3">Chave</th>
                      <th className="p-3">Paciente / Categoria</th>
                      <th className="p-3">Exame</th>
                      <th className="p-3">Origem</th>
                      <th className="p-3 pr-4 text-right">Destino</th>
                      {isAdmin && <th className="p-3 w-10 print:hidden"></th>}
                    </tr>
                  </thead>
                  <tbody className="text-xs font-medium text-slate-300">
                    {keysGroup.map((k) => {
                      const dateObj = new Date(k.created_at);
                      const formattedDate = dateObj.toLocaleDateString('pt-BR');
                      const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <tr key={k.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 pl-4 whitespace-nowrap text-slate-400">
                            {formattedDate} <span className="text-slate-500 ml-1">{formattedTime}</span>
                          </td>
                          <td className="p-3">
                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs font-mono font-bold tracking-widest">
                              {k.key}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-white truncate max-w-[200px]" title={k.patient}>
                            {k.patient}
                          </td>
                          <td className="p-3 text-[11px] font-bold text-slate-400">
                            {k.exam}
                          </td>
                          <td className="p-3 text-slate-400">
                            {k.origin}
                          </td>
                          <td className="p-3 pr-4 text-right text-emerald-400 font-bold">
                            {k.destination}
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-right print:hidden">
                              <button 
                                onClick={() => handleDelete(k.id)}
                                disabled={isPending}
                                className="text-slate-500 hover:text-red-500 transition-colors p-1"
                                title="Apagar Chave"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 opacity-50">
              <div className="w-16 h-16 mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                ?
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">Nenhuma chave gerada ainda</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-8 gap-6 max-w-7xl mx-auto w-full print:p-0 print:m-0">
      {/* Abas */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl self-start print:hidden overflow-x-auto max-w-full custom-scrollbar">
        <button
          onClick={() => setActiveTab('TC')}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'TC' 
              ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Relatório de TC
        </button>
        <button
          onClick={() => setActiveTab('RNM')}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'RNM' 
              ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Relatório de RNM
        </button>
        <button
          onClick={() => setActiveTab('AVULSA')}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'AVULSA' 
              ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Sobreaviso (Avulsas)
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="flex-1 min-h-0 print:min-h-auto print:overflow-visible">
        {activeTab === 'TC' && renderTabContent(tcKeys, 'Tomografia Computadorizada (TC)', 'Controle de chaves direcionadas para TC')}
        {activeTab === 'RNM' && renderTabContent(rnmKeys, 'Ressonância Magnética (RNM)', 'Controle de chaves direcionadas para RNM')}
        {activeTab === 'AVULSA' && renderTabContent(avulsaKeys, 'Planilha de Sobreaviso', 'Lotes de chaves avulsas geradas pelo bot')}
      </div>
    </div>
  );
}
