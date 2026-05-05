'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  FileText, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Activity,
  ClipboardCheck,
  TrendingUp,
  History,
  ShieldCheck,
  Fingerprint,
  FileBarChart,
  LayoutDashboard,
  ShieldAlert,
  Zap,
  ArrowUpRight
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

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<AuthKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  
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
        type,
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
  }, [page, search, type, selectedMonth, selectedYear]);

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

  const totalTC = keys.filter(k => k.type === 'TC').length;
  const totalRNM = keys.filter(k => k.type === 'RNM').length;

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-500/10 font-sans antialiased">
      {/* Top Banner (Institucional) - Reduzido */}
      <div className="bg-[#020617] py-1.5 px-6 flex justify-center items-center gap-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={10} className="text-amber-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Ambiente de Auditoria Restrito • Secretaria Municipal de Saúde</span>
        </div>
      </div>

      {/* Header Premium V3 - Compacto para caber mais dados */}
      <header className="bg-[#020617] border-b border-slate-800 pt-8 pb-10 px-8 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <Link href="/" className="group p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-xl backdrop-blur-md">
                <ArrowLeft size={18} className="text-slate-300 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={12} className="text-blue-500" />
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">Auditoria de Fluxo</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                  Controle de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-indigo-300">Chaves</span>
                </h1>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/api/admin/reports/monthly?month=${selectedMonth}&year=${selectedYear}`}
                target="_blank"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#020617] hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group"
              >
                <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                Mensal
              </Link>
              <Link
                href={`/api/admin/reports/yearly?year=${selectedYear}`}
                target="_blank"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl border border-blue-400/20 active:scale-95 group"
              >
                <FileBarChart size={14} className="group-hover:rotate-3 transition-transform" />
                Anual
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 -mt-6 space-y-8 relative z-20">
        {/* Stats Grid - Compacted */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Autorizações Totais', value: total, icon: Database, color: 'blue' },
            { label: 'Tomografias (TC)', value: totalTC, icon: Zap, color: 'amber' },
            { label: 'Ressonâncias (RNM)', value: totalRNM, icon: Fingerprint, color: 'indigo' },
            { label: 'SLA Integridade', value: '100%', icon: ShieldCheck, color: 'emerald' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:border-blue-100 transition-all hover:shadow-xl group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-lg bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={18} />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                  Auditoria OK
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.1em]">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-[#0F172A] tabular-nums tracking-tighter">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar - Floating Glass */}
        <div className="sticky top-6 bg-white/90 backdrop-blur-2xl p-3 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-white/50 flex flex-col lg:flex-row gap-3 items-stretch z-30">
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 text-[#0F172A] font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex flex-wrap gap-2">
            <select 
              className="pl-6 pr-10 py-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 text-[#0F172A] font-black text-[9px] uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer min-w-[140px] hover:bg-white transition-colors"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            <select 
              className="pl-6 pr-10 py-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 text-[#0F172A] font-black text-[9px] uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer min-w-[100px] hover:bg-white transition-colors"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select 
              className="pl-6 pr-10 py-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 text-[#0F172A] font-black text-[9px] uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer min-w-[180px] hover:bg-white transition-colors"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas Modalidades</option>
              <option value="TC">Tomografia (TC)</option>
              <option value="RNM">Ressonância (RNM)</option>
            </select>

            <button 
              onClick={() => fetchKeys()}
              className="px-6 py-4 rounded-[1.5rem] bg-[#020617] text-white hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center justify-center"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_10px_50px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-[4px] border-slate-50 border-t-blue-600 animate-spin" />
                <p className="text-[9px] text-[#020617] font-black uppercase tracking-widest">Sincronizando Base</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-50">
                  <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] w-[15%]">Data / Chave</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] w-[35%]">Paciente / Origem</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] w-[10%]">Modalidade</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] w-[40%]">CNS / Identificação</th>
                  <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {keys.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Nenhum Registro Encontrado</p>
                    </td>
                  </tr>
                ) : (
                  keys.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <div className="bg-[#020617] text-white px-3 py-1 rounded-lg font-black text-xs tracking-widest inline-block">{item.key}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <h4 className="text-lg font-black text-[#0F172A] uppercase tracking-tight leading-none">
                            {item.patient}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            {item.origin} <ChevronRight size={10} className="text-blue-400" /> {item.destination}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-block text-center ${
                            item.type === 'TC' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          {item.cns ? (
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 group-hover:bg-white transition-all">
                              <ShieldCheck size={14} className="text-emerald-500" />
                              <span className="font-mono text-sm font-black text-[#0F172A] tracking-wider">{item.cns}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 italic">Não Informado</span>
                          )}
                          <span className="font-mono text-[8px] text-slate-400 uppercase">ID: {item.id.substring(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right align-middle">
                        <button 
                          onClick={() => copyToClipboard(formatLogString(item))}
                          className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-[#020617] hover:text-white transition-all shadow-sm active:scale-90 group/btn"
                          title="Copiar Log"
                        >
                          <FileText size={18} className="group-hover/btn:rotate-6 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Compact */}
          {pages > 1 && (
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[9px] text-[#020617] font-black uppercase tracking-[0.2em]">Pág {page}/{pages} <span className="text-slate-400 ml-2 font-bold">• {total} registros</span></p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-[#020617] disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="p-3 rounded-xl bg-[#020617] text-white disabled:opacity-30 transition-all shadow-xl"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer - Compact */}
        <div className="bg-[#020617] p-8 rounded-[2.5rem] border border-slate-800 flex items-center gap-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2" />
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-blue-500 relative z-10">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-2 relative z-10">
            <h5 className="text-white font-black text-sm uppercase tracking-tighter">Imutabilidade Regulatória</h5>
            <p className="text-slate-500 text-[10px] font-medium max-w-2xl leading-relaxed">
              Registros com assinatura digital CIRILA. Tentativas de modificação são reportadas à CGM.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
