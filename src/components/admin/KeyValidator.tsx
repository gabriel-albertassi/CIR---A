'use client';

import { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, Loader2, User, FileText, Hospital, Target } from 'lucide-react';

export function KeyValidator() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/keys/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      const data = await res.json();
      
      if (data.valid) {
        setResult(data.data);
      } else {
        setError(data.message || 'Chave inválida');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 space-y-6 border-t-4 border-t-blue-500">
      <div className="space-y-1">
        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <ShieldCheck size={20} className="text-blue-500" />
          Validação Instantânea
        </h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Verifique a autenticidade de qualquer chave na base</p>
      </div>

      <form onSubmit={handleValidate} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="INSIRA A CHAVE (EX: TC-2024-XXXXX)"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-black text-sm uppercase tracking-widest focus:outline-none focus:border-blue-500/50 transition-all"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !key}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-900/20"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Validar'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <ShieldAlert size={20} />
          <span className="text-xs font-black uppercase tracking-widest">{error}</span>
        </div>
      )}

      {result && (
        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4 animate-in zoom-in-95">
          <div className="flex justify-between items-center pb-4 border-b border-emerald-500/10">
            <div className="flex items-center gap-2 text-emerald-500">
              <ShieldCheck size={20} />
              <span className="text-sm font-black uppercase tracking-widest">Chave Autêntica</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black tracking-widest uppercase">
              {result.type}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <User size={10} /> Paciente
              </div>
              <div className="text-sm font-black text-white uppercase">{result.patient}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <FileText size={10} /> Exame
              </div>
              <div className="text-sm font-black text-white uppercase">{result.exam}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <Hospital size={10} /> Origem
              </div>
              <div className="text-sm font-black text-slate-400 uppercase">{result.origin}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <Target size={10} /> Destino
              </div>
              <div className="text-sm font-black text-slate-400 uppercase">{result.destination}</div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-emerald-500/10 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            <span>Emitido em: {new Date(result.created_at).toLocaleString('pt-BR')}</span>
            <span>Auditor: {result.professional}</span>
          </div>
        </div>
      )}
    </div>
  );
}
