'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ShieldCheck,
  Zap,
  Fingerprint,
  Database,
  SearchX
} from 'lucide-react';
import Link from 'next/link';

interface AuthKey {
  id: string;
  created_at: string;
  date: string;
  key: string;
  patient: string;
  exam: string;
  procedure: string;
  origin: string;
  destination: string;
  professional: string;
  type: string;
  status: string;
  cns?: string;
}

interface KeyTableManagerProps {
  fixedType?: string;
  title: string;
  subtitle: string;
  icon: any;
}

export default function KeyTableManager({ fixedType, title, subtitle, icon: Icon }: KeyTableManagerProps) {
  const [keys, setKeys] = useState<AuthKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        type: fixedType || '',
        month: selectedMonth,
        year: selectedYear,
        limit: '15'
      });
      const response = await fetch(`/api/admin/keys?${params.toString()}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setKeys(data.keys || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar chaves');
    } finally {
      setLoading(false);
    }
  }, [page, search, fixedType, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchKeys();
  };

  const formatLogString = (item: AuthKey) => {
    const date = new Date(item.date).toLocaleDateString('pt-BR');
    return `${date} : ${item.key} - ${item.patient} ${item.cns ? `(CNS: ${item.cns}) ` : ''}– ${item.origin} - ${item.exam} ${item.procedure ? `(${item.procedure}) ` : ''}AUTORIZADO PARA ${item.destination}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - i).toString());

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Icon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Link
            href={`/api/admin/reports/monthly?month=${selectedMonth}&year=${selectedYear}${fixedType ? `&type=${fixedType}` : ''}`}
            target="_blank"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 active:scale-95"
          >
            <Download size={14} />
            Relatório
          </Link>
          <button 
            onClick={() => fetchKeys()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg active:scale-95"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row gap-4 items-stretch">
        <form onSubmit={handleSearch} className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Pesquisar por paciente ou chave..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex gap-2">
          <select 
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer min-w-[140px]"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
          >
            {months.map(m => <option key={m.value} value={m.value} className="bg-[#071826]">{m.label}</option>)}
          </select>

          <select 
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer min-w-[100px]"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
          >
            {years.map(y => <option key={y} value={y} className="bg-[#071826]">{y}</option>)}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-[#071826]/60 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Sincronizando...</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Chave / Data</th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Paciente</th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Fluxo (Origem → Destino)</th>
                {!fixedType && <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>}
                <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {keys.length === 0 && !loading ? (
                <tr>
                  <td colSpan={fixedType ? 4 : 5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <SearchX size={40} className="text-slate-400" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum registro encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                keys.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-black text-[11px] tracking-widest inline-block w-fit">
                          {item.key}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">
                          {item.patient}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-500">{item.cns || 'SEM CNS'}</span>
                          <div className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="text-[9px] font-mono text-slate-600">#{item.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                          <span className="truncate max-w-[120px]">{item.origin}</span>
                          <ChevronRight size={12} className="text-blue-500" />
                          <span className="truncate max-w-[120px]">{item.destination}</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[250px]">
                          {item.exam} {item.procedure && `• ${item.procedure}`}
                        </p>
                      </div>
                    </td>
                    {!fixedType && (
                      <td className="px-6 py-5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          item.type === 'TC' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => copyToClipboard(formatLogString(item))}
                        className="p-2.5 rounded-lg bg-white/5 text-slate-400 hover:bg-blue-600 hover:text-white transition-all group/btn"
                        title="Copiar Log de Auditoria"
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {pages > 1 && (
          <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>Página {page} de {pages}</span>
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <span className="text-slate-600">{total} registros</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 rounded-lg bg-blue-600 text-white disabled:opacity-20 transition-all shadow-lg shadow-blue-600/20"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
        <ShieldCheck size={20} className="text-emerald-500" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Base de dados auditada pela CIR-A. Todas as ações de visualização e cópia são registradas para conformidade LGPD.
        </p>
      </div>
    </div>
  );
}
