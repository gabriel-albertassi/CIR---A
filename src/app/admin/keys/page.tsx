'use client';

export const dynamic = 'force-dynamic';


import { 
  ShieldAlert, 
  ArrowUpRight,
  Zap,
  Fingerprint,
  Database,
  ShieldCheck,
  FileBarChart,
  LayoutDashboard,
  History,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { KeyDashboardStats } from '@/components/admin/KeyDashboardStats';
import { KeyValidator } from '@/components/admin/KeyValidator';
import { useEffect, useState } from 'react';

export default function AdminKeysOverviewPage() {
  const [recentKeys, setRecentKeys] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/keys/stats')
      .then(res => res.json())
      .then(data => setRecentKeys(data.recent))
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Premium */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={12} className="text-blue-500" />
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">Central de Inteligência</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Comando de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Auditoria</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Monitoramento de Chaves Institucionais SMSVR</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/api/admin/reports/monthly"
            target="_blank"
            className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20 active:scale-95 group shadow-lg shadow-blue-900/10"
          >
            <FileBarChart size={14} className="group-hover:rotate-3 transition-transform" />
            Relatórios Gerais
          </Link>
        </div>
      </div>

      {/* Real-time Statistics */}
      <KeyDashboardStats />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Navigation & Validator */}
        <div className="xl:col-span-2 space-y-8">
          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/keys/tc" className="premium-card p-8 group relative overflow-hidden h-64 flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap size={140} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit group-hover:scale-110 transition-transform">
                  <Zap size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Tomografias</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Audit Trail • Base TC</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                Visualizar Registros <ArrowUpRight size={14} />
              </div>
            </Link>

            <Link href="/admin/keys/rnm" className="premium-card p-8 group relative overflow-hidden h-64 flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Fingerprint size={140} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                  <Fingerprint size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Ressonâncias</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Audit Trail • Base RNM</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                Visualizar Registros <ArrowUpRight size={14} />
              </div>
            </Link>
          </div>

          {/* Validator Tool */}
          <KeyValidator />
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="glass-panel p-8 flex flex-col h-full border-l-4 border-l-blue-500/30">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <History size={18} className="text-blue-500" />
                Atividade Recente
              </h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logs de geração global</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Ao Vivo</span>
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {recentKeys.length > 0 ? (
              recentKeys.map((item, idx) => (
                <div key={item.id} className="group relative pl-6 pb-6 border-l border-white/10 last:border-0 last:pb-0">
                  <div className={`absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full border-2 border-slate-900 ${
                    item.type === 'TC' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  }`} />
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                        {item.key}
                      </span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">
                        {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black text-slate-300 uppercase truncate">{item.patient}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate">{item.origin}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600 space-y-3">
                <Database size={40} className="opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhum registro hoje</span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-8 border-t border-white/5">
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
              <ShieldAlert size={16} className="text-amber-500 shrink-0" />
              <p className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest leading-relaxed">
                Ambiente de auditoria monitorado. Acesso restrito a usuários com nível ADMINISTRATIVO ou superior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
