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
  Printer
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
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        type,
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
  }, [page, search, type]);

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
    // Poderia adicionar um toast aqui, mas vamos manter simples por enquanto
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-500/80 mb-1">
            <Link href="/admin" className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-all text-cyan-400">
              <ArrowLeft size={18} />
            </Link>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">Área Administrativa</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 shadow-inner">
              <Database className="text-cyan-400" size={28} />
            </div>
            Controle de Chaves
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Rastreamento centralizado e imutável de todas as chaves de autorização geradas. 
            Utilize os filtros abaixo para auditoria específica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => fetchKeys()}
            className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-xl"
            title="Sincronizar Dados"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />

          <Link
            href="/api/admin/reports/monthly"
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-all shadow-lg shadow-cyan-950/40 border border-cyan-400/20"
          >
            <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            Relatório Mensal
          </Link>
          <Link
            href="/api/admin/reports/yearly"
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-all shadow-lg shadow-black/40 border border-white/5"
          >
            <Calendar size={18} className="group-hover:scale-110 transition-transform" />
            Consolidado Anual
          </Link>
        </div>
      </div>


      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-slate-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
        <form onSubmit={handleSearch} className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar por paciente, chave, hospital ou exame..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:bg-white/[0.06] focus:border-cyan-500/30 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <select 
              className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-300 focus:outline-none focus:border-cyan-500/30 appearance-none transition-all text-sm cursor-pointer hover:bg-white/[0.06]"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="" className="bg-slate-900">Filtrar por Modalidade</option>
              <option value="TC" className="bg-slate-900">Tomografia (TC)</option>
              <option value="RNM" className="bg-slate-900">Ressonância (RNM)</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-cyan-100 text-xs font-bold uppercase tracking-wider">{total} Registros</span>
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm shadow-2xl relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <RefreshCcw className="text-cyan-500 animate-spin" size={40} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Histórico de Autorizações</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {keys.length === 0 && !loading ? (
                <tr>
                  <td colSpan={2} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-white/5 text-slate-600">
                        <Search size={40} />
                      </div>
                      <p className="text-slate-500 font-medium">Nenhum registro encontrado para estes filtros.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                keys.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter ${item.type === 'TC' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'}`}>
                            {item.type}
                          </span>
                          <span className="text-xs font-mono text-slate-500">#{item.id.substring(0, 8)}</span>
                        </div>
                        
                        <p className="text-slate-200 font-medium text-sm leading-relaxed max-w-4xl">
                          {formatLogString(item).split(' : ').map((part, i) => (
                            <span key={i}>
                              {i === 1 ? (
                                <span className="bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded font-bold border border-cyan-500/10 mx-1">{part.split(' - ')[0]}</span>
                              ) : i === 0 ? (
                                <span className="text-slate-500 font-bold">{part} : </span>
                              ) : (
                                <span className="text-slate-300"> - {part}</span>
                              )}
                              {i === 1 && part.includes(' - ') && (
                                <span className="text-slate-300"> - {part.split(' - ').slice(1).join(' - ')}</span>
                              )}
                            </span>
                          ))}
                        </p>

                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
                            <Calendar size={12} className="text-slate-400" /> 
                            {new Date(item.created_at).toLocaleString('pt-BR')}
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-500/60">
                            <CheckCircle2 size={12} /> 
                            Sincronizado via Cloud
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => copyToClipboard(formatLogString(item))}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:bg-cyan-500 hover:text-white hover:border-cyan-400 transition-all group/btn shadow-lg"
                        title="Copiar Registro Completo"
                      >
                        <FileText size={20} className="group-hover:scale-110 transition-transform" />
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
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Página <span className="text-white font-medium">{page}</span> de <span className="text-white font-medium">{pages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
        <AlertCircle className="text-amber-500 shrink-0" size={24} />
        <div className="space-y-1">
          <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wider">Aviso de Integridade</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Este módulo registra automaticamente todas as autorizações geradas pelo bot ou pela interface manual. 
            Em conformidade com as normas do CIRILA, não é permitido excluir registros para garantir a auditabilidade do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
