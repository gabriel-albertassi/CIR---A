'use client';

import { useEffect, useState } from 'react';
import { 
  Activity, 
  Target, 
  Calendar, 
  ArrowUp, 
  Zap, 
  Fingerprint,
  TrendingUp
} from 'lucide-react';

interface StatsData {
  summary: {
    today: number;
    month: number;
    tc_month: number;
    rnm_month: number;
  };
  origins: Array<{ origin: string; _count: { id: number } }>;
}

export function KeyDashboardStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/keys/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/5 border border-white/10" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Today's Velocity */}
      <div className="premium-card p-6 flex flex-col justify-between group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
          <Activity size={100} />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <Activity size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produção Hoje</span>
        </div>
        <div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">
            {stats.summary.today}
          </div>
          <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase">
            <ArrowUp size={10} /> Chaves Ativas
          </div>
        </div>
      </div>

      {/* Monthly Total */}
      <div className="premium-card p-6 flex flex-col justify-between group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
          <Calendar size={100} />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Calendar size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Mensal</span>
        </div>
        <div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">
            {stats.summary.month}
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Registradas em {new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
        </div>
      </div>

      {/* TC Split */}
      <div className="premium-card p-6 flex flex-col justify-between group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
          <Zap size={100} />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <Zap size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês / TC</span>
        </div>
        <div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">
            {stats.summary.tc_month}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full" 
              style={{ width: `${(stats.summary.tc_month / (stats.summary.month || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* RNM Split */}
      <div className="premium-card p-6 flex flex-col justify-between group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors">
          <Fingerprint size={100} />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
            <Fingerprint size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês / RNM</span>
        </div>
        <div>
          <div className="text-4xl font-black text-white tracking-tighter mb-1">
            {stats.summary.rnm_month}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-cyan-500 h-full rounded-full" 
              style={{ width: `${(stats.summary.rnm_month / (stats.summary.month || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
