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
    <div className="min-h-screen p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Link href="/admin" className="hover:text-cyan-300 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-sm font-medium tracking-wider uppercase opacity-70">Administração</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="text-cyan-500" size={32} />
            Controle de Chaves
          </h1>
          <p className="text-slate-400">Auditoria e rastreamento de autorizações TC/RNM em tempo real.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchKeys()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            title="Atualizar"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/api/admin/reports/monthly"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all shadow-lg shadow-cyan-900/20"
          >
            <Download size={20} />
            Relatório Mensal
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <form onSubmit={handleSearch} className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Buscar por paciente, chave ou hospital..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 appearance-none transition-all"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os Tipos</option>
            <option value="TC">Tomografia (TC)</option>
            <option value="RNM">Ressonância (RNM)</option>
          </select>
        </div>

        <div className="flex items-center justify-center px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
          {total} registros encontrados
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Registro de Auditoria (Formato Log)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-4 bg-white/10 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                keys.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-200 font-mono text-sm leading-relaxed break-all md:break-normal">
                          {formatLogString(item)}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(item.created_at).toLocaleString('pt-BR')}</span>
                          <span className="flex items-center gap-1 text-emerald-500/70"><CheckCircle2 size={10} /> Sincronizado</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => copyToClipboard(formatLogString(item))}
                        className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all group/btn"
                        title="Copiar Registro"
                      >
                        <FileText size={18} className="group-hover/btn:scale-110 transition-transform" />
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
