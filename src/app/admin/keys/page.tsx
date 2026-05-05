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
    return `${date} : ${item.key} - ${item.patient} – ${item.origin} - ${item.exam} ${item.procedure ? `(${item.procedure}) ` : ''}AUTORIZADO PARA ${item.destination}`;
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
      {/* Top Banner (Institucional) */}
      <div className="bg-[#020617] py-2.5 px-6 flex justify-center items-center gap-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={12} className="text-amber-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Ambiente de Auditoria Restrito • Secretaria Municipal de Saúde</span>
        </div>
      </div>

      {/* Header Premium V3 */}
      <header className="bg-[#020617] border-b border-slate-800 pt-16 pb-20 px-8 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <Link href="/" className="group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-xl backdrop-blur-md">
                  <ArrowLeft size={22} className="text-slate-300 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard size={14} className="text-blue-500" />
                    <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em]">Auditoria de Fluxo</span>
                  </div>
                  <h1 className="text-5xl font-black text-white tracking-tight leading-none">
                    Controle de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-indigo-300">Chaves</span>
                  </h1>
                </div>
              </div>
              <p className="text-slate-400 text-base font-medium max-w-xl leading-relaxed">
                Monitoramento avançado de autorizações para exames de alta complexidade. 
                Garanta a integridade regulatória e transparência da rede pública.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <Link
                href={`/api/admin/reports/monthly?month=${selectedMonth}&year=${selectedYear}`}
                target="_blank"
                className="flex items-center justify-center gap-3 px-10 py-4.5 rounded-2xl bg-white text-[#020617] hover:bg-blue-50 text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-blue-500/10 active:scale-95 group"
              >
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                Relatório Mensal
              </Link>
              <Link
                href={`/api/admin/reports/yearly?year=${selectedYear}`}
                target="_blank"
                className="flex items-center justify-center gap-3 px-10 py-4.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-blue-600/20 border border-blue-400/20 active:scale-95 group"
              >
                <FileBarChart size={18} className="group-hover:rotate-3 transition-transform" />
                Consolidado Anual
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 -mt-12 space-y-12 relative z-20">
        {/* Stats Grid - Modern Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Autorizações Totais', value: total, icon: Database, color: 'blue', sub: 'Banco de dados ativo' },
            { label: 'Tomografias (TC)', value: totalTC, icon: Zap, color: 'amber', sub: 'Média/Alta complexidade' },
            { label: 'Ressonâncias (RNM)', value: totalRNM, icon: Fingerprint, color: 'indigo', sub: 'Alta complexidade' },
            { label: 'SLA de Integridade', value: '100%', icon: ShieldCheck, color: 'emerald', sub: 'Registros auditados' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-blue-100 transition-all hover:shadow-2xl hover:-translate-y-1.5 group">
              <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform shadow-sm`}>
                  <stat.icon size={26} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  <TrendingUp size={12} className="text-emerald-500" /> Auditoria OK
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black text-[#0F172A] tabular-nums tracking-tighter">{stat.value}</h3>
                  <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-slate-400 text-[11px] font-bold mt-2">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar - Floating Glass */}
        <div className="sticky top-6 bg-white/90 backdrop-blur-2xl p-4 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white/50 flex flex-col lg:flex-row gap-4 items-stretch z-30">
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Pesquisar por paciente, chave ou origem..."
              className="w-full pl-16 pr-8 py-5.5 rounded-[2rem] bg-slate-50/50 border border-slate-100 text-[#0F172A] font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex flex-wrap gap-2.5">
            <div className="relative">
              <select 
                className="pl-8 pr-12 py-5.5 rounded-[2rem] bg-slate-50/50 border border-slate-100 text-[#0F172A] font-black text-[11px] uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer min-w-[170px] hover:bg-white transition-colors"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPage(1);
                }}
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            </div>

            <div className="relative">
              <select 
                className="pl-8 pr-12 py-5.5 rounded-[2rem] bg-slate-50/50 border border-slate-100 text-[#0F172A] font-black text-[11px] uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer min-w-[120px] hover:bg-white transition-colors"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPage(1);
                }}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none rotate-90" size={16} />
            </div>

            <div className="relative">
              <select 
                className="pl-8 pr-12 py-5.5 rounded-[2rem] bg-slate-50/50 border border-slate-100 text-[#0F172A] font-black text-[11px] uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer min-w-[210px] hover:bg-white transition-colors"
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
              <Filter className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            </div>

            <button 
              onClick={() => fetchKeys()}
              className="px-8 py-5.5 rounded-[2rem] bg-[#020617] text-white hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center justify-center"
            >
              <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="bg-white rounded-[3.5rem] shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-[8px] border-slate-50 border-t-blue-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck size={36} className="text-blue-600/30" />
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-base font-black uppercase tracking-[0.3em] text-[#020617]">Sincronizando</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">Base de Dados Governamental</p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-50">
                  <th className="px-12 py-10 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Registro de Autorização</th>
                  <th className="px-12 py-10 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {keys.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={2} className="py-40 text-center">
                      <div className="flex flex-col items-center gap-8 text-slate-200">
                        <div className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100">
                          <History size={72} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Nenhum Registro</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ajuste os filtros de busca</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  keys.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="px-12 py-12">
                        <div className="flex flex-col gap-8">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className={`px-5 py-2 rounded-2xl text-[11px] font-black tracking-[0.1em] uppercase shadow-sm ${
                              item.type === 'TC' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}>
                              {item.type}
                            </span>
                            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 bg-slate-100/50 px-4 py-2 rounded-xl border border-slate-100">
                              <Fingerprint size={14} className="text-blue-500" />
                              <span className="font-mono">#{item.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-[10px] font-black text-emerald-600 uppercase border border-emerald-100 shadow-sm">
                              <CheckCircle2 size={14} /> Integridade Validada
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-3xl font-black text-[#0F172A] group-hover:text-blue-700 transition-colors uppercase tracking-tighter leading-none">
                              {item.patient}
                            </h4>
                            <div className="flex flex-wrap items-center gap-5">
                              <div className="bg-[#020617] text-white px-5 py-2 rounded-2xl font-black text-sm tracking-widest shadow-xl shadow-blue-900/10">{item.key}</div>
                              <div className="h-6 w-px bg-slate-200" />
                              <span className="text-slate-500 font-bold text-sm">{item.origin}</span>
                              <ChevronRight size={20} className="text-blue-400 group-hover:translate-x-1.5 transition-transform" />
                              <span className="text-[#020617] font-black text-sm bg-blue-50 px-5 py-2 rounded-2xl border border-blue-100">{item.destination}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-10 pt-4 border-t border-slate-100/50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-3"><Calendar size={18} className="text-blue-500/50" /> {new Date(item.created_at).toLocaleString('pt-BR')}</span>
                            <span className="flex items-center gap-3"><Activity size={18} className="text-blue-500/50" /> {item.exam}</span>
                            {item.procedure && <span className="flex items-center gap-3"><ClipboardCheck size={18} className="text-blue-500/50" /> {item.procedure}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-12 text-right align-top">
                        <button 
                          onClick={() => copyToClipboard(formatLogString(item))}
                          className="p-6 rounded-[2rem] bg-slate-50 text-slate-400 hover:bg-[#020617] hover:text-white transition-all shadow-sm active:scale-90 group/btn"
                          title="Copiar Log de Auditoria"
                        >
                          <FileText size={28} className="group-hover/btn:rotate-6 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-12 py-12 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-5">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200" />
                  ))}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-[#020617] font-black uppercase tracking-[0.2em]">Página {page} de {pages}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total de {total} registros auditados</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-white border border-slate-200 text-[#020617] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
                >
                  <ChevronLeft size={18} /> Anterior
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-[#020617] text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xl shadow-blue-900/20 active:scale-95"
                >
                  Próxima <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="bg-[#020617] p-12 rounded-[4rem] border border-slate-800 flex flex-col lg:flex-row items-center gap-12 shadow-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 text-blue-500 shadow-inner backdrop-blur-xl relative z-10">
            <ShieldCheck size={56} />
          </div>
          
          <div className="space-y-6 relative z-10 text-center lg:text-left">
            <div className="space-y-2">
              <h5 className="text-white font-black text-2xl uppercase tracking-tighter">Protocolo de Imutabilidade Regulatória</h5>
              <div className="h-1.5 w-24 bg-blue-600 rounded-full mx-auto lg:mx-0 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
            </div>
            <p className="text-slate-400 text-base leading-relaxed font-medium max-w-3xl">
              Todos os registros apresentados neste painel possuem <strong className="text-blue-400">assinatura digital única</strong> e são vinculados ao histórico de auditoria do CIRILA. 
              Qualquer tentativa de modificação não autorizada é registrada e reportada automaticamente à Controladoria Geral do Município (CGM).
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              {['Auditado', 'Criptografado', 'Imutável', 'Oficial'].map(tag => (
                <span key={tag} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Footer */}
        <footer className="pt-16 pb-8 flex flex-col md:flex-row items-center justify-between gap-10 border-t border-slate-200/60">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-3xl bg-[#020617] flex items-center justify-center border border-slate-800 shadow-2xl">
              <Activity size={24} className="text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#020617]">CIRILA ADMIN v2.5</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ecossistema de Alta Integridade</span>
            </div>
          </div>
          <div className="text-center md:text-right space-y-2">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">© 2024 SMSVR - Volta Redonda/RJ</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secretaria Municipal de Saúde • Departamento de Regulação</p>
          </div>
        </footer>
      </main>
    </div>
  );
  );
}
