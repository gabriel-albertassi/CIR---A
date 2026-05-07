import { prisma } from '../lib/db'
import { Clock, Ambulance, AlertCircle, CheckCircle2, Bot, Sparkles, Zap, Brain, ShieldCheck, Plus, FileBarChart, Monitor, HeartPulse } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import DashboardCharts from './DashboardCharts'
import PrintButton from '@/components/PrintButton'
import PrivateHospitalsChart from '@/components/PrivateHospitalsChart'
import InteractiveCirilaPanel from '@/components/InteractiveCirilaPanel'
import { PRIVATE_HOSPITALS } from '@/lib/constants'
import DashboardQueue from '@/components/DashboardQueue'
import CirilaAvatar from '@/components/CirilaAvatar'
import { createClient } from '../lib/supabase/sb-server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    const [
      dbUser,
      totalWaiting,
      totalOffered,
      totalTransferred,
      patientsWithLogs,
      availabilities,
      transferredLogs,
    ] = await Promise.all([
      authUser ? prisma.user.findUnique({ where: { id: authUser.id } }) : Promise.resolve(null),
      prisma.patient.count({ where: { status: 'WAITING' } }),
      prisma.patient.count({ where: { status: 'OFFERED' } }),
      prisma.patient.count({ where: { status: 'TRANSFERRED' } }),
      prisma.patient.findMany({
        where: { status: { in: ['WAITING', 'OFFERED'] } },
        select: { 
          id: true, 
          name: true, 
          created_at: true, 
          severity: true, 
          status: true, 
          origin_hospital: true,
          logs: {
            where: { action: { in: ['REQUEST', 'REFUSAL'] } },
            orderBy: { timestamp: 'desc' }
          }
        }
      }),
      prisma.bedAvailability.findMany(),
      prisma.log.findMany({
        where: { 
          action: 'TRANSFER',
          timestamp: { gte: thirtyDaysAgo }
        },
        select: { details: true, timestamp: true }
      })
    ])

    const now = new Date()
    let totalWaitHours = 0
    let criticalCount = 0
    let ctiCount = 0;
    let clinicaCount = 0;

    patientsWithLogs.forEach(p => {
      const hours = (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60)
      totalWaitHours += hours
      if (p.severity === 'SALA_VERMELHA') criticalCount++
      if (p.severity === 'CTI') ctiCount++;
      if (p.severity === 'CLINICA_MEDICA') clinicaCount++;
    })

    const destMap: Record<string, number> = {};
    transferredLogs.forEach(l => {
      if (l.details) {
        destMap[l.details] = (destMap[l.details] || 0) + 1;
      }
    });
    const transferredData = Object.entries(destMap).map(([name, value]) => ({ name, value }));

    const severityData = [
      { name: 'S. Vermelha', qtd: criticalCount, fill: '#ef4444' },
      { name: 'CTI', qtd: ctiCount, fill: '#f97316' },
      { name: 'Clín. Médica', qtd: clinicaCount, fill: '#3b82f6' }
    ];

    const privateMap: Record<string, number> = {};
    transferredLogs.forEach(l => {
      if (l.details && PRIVATE_HOSPITALS.includes(l.details)) {
        const dateStr = new Date(l.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        privateMap[dateStr] = (privateMap[dateStr] || 0) + 1;
      }
    });
    const privateData = Object.entries(privateMap)
      .map(([dateStr, count]) => ({ dateStr, count }))
      .sort((a, b) => {
        const [d1, m1] = a.dateStr.split('/');
        const [d2, m2] = b.dateStr.split('/');
        return new Date(2026, parseInt(m1) - 1, parseInt(d1)).getTime() - new Date(2026, parseInt(m2) - 1, parseInt(d2)).getTime();
      });

    const privateTotals: Record<string, number> = {};
    PRIVATE_HOSPITALS.forEach(h => { privateTotals[h] = 0; });

    transferredLogs.forEach(l => {
      if (l.details && PRIVATE_HOSPITALS.includes(l.details)) {
        privateTotals[l.details]++;
      }
    });

    patientsWithLogs.forEach(p => {
      if (p.logs && p.logs.length > 0) {
        const lastLog = p.logs[0];
        const matchedHospital = PRIVATE_HOSPITALS.find(h => lastLog.details?.startsWith(h));
        if (lastLog.action === 'REQUEST' && matchedHospital) {
          privateTotals[matchedHospital]++;
        }
      }
    });

    const avgWaitHours = patientsWithLogs.length > 0
      ? (totalWaitHours / patientsWithLogs.length).toFixed(1)
      : 0    return (
      <div className="space-y-8 pb-12 animate-in fade-in duration-700 relative">
        <div className="absolute inset-0 technical-grid pointer-events-none opacity-20 -m-8" />
        
        {/* UPPER HEADER: Actions & Status */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] font-outfit">SISTEMA CIR-A • MONITORAMENTO LIVE</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none font-outfit">
              Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">Institucional</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.25em] mt-3 flex items-center gap-2">
              <ShieldCheck size={12} className="text-blue-500/50" />
              Central de Regulação de Acesso • SMSVR / DCRAA
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto no-print">
            <Link href="/patients/new" className="group relative overflow-hidden px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
              <div className="relative z-10 flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                <Plus size={18} strokeWidth={3} />
                Nova Regulação
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
            <div className="flex gap-2">
              <Link href="/api/cirila/relatorio?type=MONTHLY" className="px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 hover:border-white/20">
                Relatório Mensal
              </Link>
              <Link href="/api/cirila/relatorio?type=ANNUAL" className="px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 hover:border-white/20">
                Anual
              </Link>
            </div>
            <PrintButton user={dbUser} />
          </div>
        </div>

        {/* HERO AI STATUS - REFINED */}
        <div className="premium-card p-6 border-l-4 border-l-blue-500 relative overflow-hidden group technical-grid bg-slate-900/40">
          <div className="scanline" />
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 group-hover:rotate-0 duration-700">
            <Bot size={120} />
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Bot size={32} />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#071826] animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-tight font-outfit">Cirila Intelligence Unit</h2>
                <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 tracking-tighter">v1.5 PREMIUM</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${criticalCount > 2 ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                  <span className={`w-2 h-2 rounded-full ${criticalCount > 2 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  {criticalCount > 2 ? 'ALERTA DE SOBRECARGA' : 'ESTADO OPERACIONAL NOMINAL'}
                </span>
                <p className="text-slate-400 text-xs font-medium max-w-2xl leading-relaxed">
                  {criticalCount > 2
                    ? `SISTEMA EM ALERTA: Detectadas ${criticalCount} vagas zero prioritárias necessitando intervenção imediata da auditoria.`
                    : `Fluxo de regulação transcorrendo dentro dos parâmetros de normalidade. Tempo médio de resposta: ${avgWaitHours}h.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN DASHBOARD CONTENT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
          
          {/* LEFT: KPIs & Charts (8 Cols) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* KPI GRID */}
            <div className="kpi-grid">
              <Link href="/patients" className="kpi-card p-6 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/5">
                    <Clock size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Pendência</span>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Auditando Agora</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Aguardando Vaga</p>
                  <h3 className="text-5xl font-black text-white tabular-nums tracking-tighter group-hover:text-blue-400 transition-colors">{totalWaiting}</h3>
                </div>
              </Link>

              <Link href="/patients" className="kpi-card p-6 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-indigo-500/5">
                    <Ambulance size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Operacional</span>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Em Fluxo</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Vagas Solicitadas</p>
                  <h3 className="text-5xl font-black text-white tabular-nums tracking-tighter group-hover:text-indigo-400 transition-colors">{totalOffered}</h3>
                </div>
              </Link>

              <Link href="/patients" className={`kpi-card p-6 group border-t-2 ${criticalCount > 0 ? 'border-t-red-500/60' : 'border-t-transparent'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-xl ${criticalCount > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-500/10 text-slate-400 border-white/10'} border group-hover:scale-110 transition-transform duration-500`}>
                    <AlertCircle size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Prioridade</span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {criticalCount > 0 ? 'INTERVENÇÃO' : 'NOMINAL'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Risco Máximo</p>
                  <h3 className={`text-5xl font-black tabular-nums tracking-tighter transition-colors ${criticalCount > 0 ? 'text-red-400 glow-text-cyan' : 'text-white'}`}>{criticalCount}</h3>
                </div>
              </Link>

              <Link href="/transferidos" className="kpi-card p-6 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Desfecho</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Concluídos</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Total Transferidos</p>
                  <h3 className="text-5xl font-black text-white tabular-nums tracking-tighter group-hover:text-emerald-400 transition-colors">{totalTransferred}</h3>
                </div>
              </Link>
            </div>

            {/* CHARTS CONTAINER */}
            <div className="premium-card p-8 technical-grid">
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                <FileBarChart className="text-blue-500" size={20} />
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter">Análise Preditiva e Fluxo</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Distribuição de gravidade e volume hospitalar</p>
                </div>
              </div>
              <DashboardCharts transferredData={transferredData} severityData={severityData} />
            </div>

            {/* PRIVATE HOSPITALS TREND */}
            <div className="premium-card p-8">
              <PrivateHospitalsChart data={privateData} totals={privateTotals} />
            </div>
          </div>

          {/* RIGHT: Status & Cirila (4 Cols) */}
          <div className="xl:col-span-4 space-y-8 no-print">
            
            {/* INTERACTIVE PANEL */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[28px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <InteractiveCirilaPanel />
            </div>

            {/* BEDS MAP */}
            <div className="premium-card p-8 technical-grid border-blue-500/10">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <HeartPulse size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest font-outfit">Censo de Leitos</h2>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Disponibilidade em Tempo Real</p>
                  </div>
                </div>
                <Link href="/vagas" className="px-3 py-1 rounded-full bg-blue-500/10 text-[9px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                  Ver Tudo
                </Link>
              </div>

              {availabilities.length === 0 ? (
                <div className="py-16 text-center space-y-4 opacity-20">
                  <div className="relative inline-block">
                    <Monitor size={48} className="mx-auto text-slate-500" />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-slate-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Aguardando sincronização...</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                  {availabilities.map(h => {
                    const totalVagas = (h.cti_masc || 0) + (h.cti_fem || 0) + (h.clinica_masc || 0) + (h.clinica_fem || 0);

                    return (
                      <div key={h.id} className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group/item">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className={`text-[11px] font-black uppercase tracking-tight ${h.sem_vagas || totalVagas === 0 ? 'text-slate-500' : 'text-slate-100'}`}>
                            {h.hospital_name.replace('Hospital', '').trim()}
                          </h4>
                          {h.sem_vagas || totalVagas === 0 ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">LOTAÇÃO</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">DISPONÍVEL</span>
                            </div>
                          )}
                        </div>

                        {!(h.sem_vagas || totalVagas === 0) && (
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'CTI M', value: h.cti_masc, color: 'orange' },
                              { label: 'CTI F', value: h.cti_fem, color: 'orange' },
                              { label: 'CLIN M', value: h.clinica_masc, color: 'blue' },
                              { label: 'CLIN F', value: h.clinica_fem, color: 'blue' },
                            ].filter(item => item.value > 0).map((item, idx) => (
                              <div key={idx} className={`flex justify-between items-center p-2.5 rounded-xl bg-${item.color}-500/5 border border-${item.color}-500/10 group-hover/item:border-${item.color}-500/30 transition-colors`}>
                                <span className={`text-[9px] font-black text-${item.color}-400/70 uppercase`}>{item.label}</span>
                                <span className="text-[13px] font-black text-white">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PATIENT QUEUE TABLE */}
        <div className="relative z-10">
          <DashboardQueue patients={patientsWithLogs} user={dbUser} />
        </div>

        {/* CIRILA BRAND SECTION - ULTRA PREMIUM */}
        <section className="premium-card p-16 relative overflow-hidden group technical-grid mt-12 bg-[#0a1628]/60">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/2" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <Sparkles size={14} className="text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Manifesto de Inovação</span>
                </div>
                <h2 className="text-7xl font-black text-white leading-none tracking-tighter font-outfit">
                  Somos a <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 glow-text-cyan">Cirila</span>
                </h2>
                <p className="text-2xl text-slate-400 font-medium leading-relaxed max-w-xl font-manrope">
                  A face humana da inteligência artificial na saúde de Volta Redonda. Compromisso inegociável com a agilidade e a vida.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  { icon: Zap, title: 'Agilidade', desc: 'SLA de resposta instantâneo', color: 'blue' },
                  { icon: Brain, title: 'IA Auditiva', desc: 'Precisão em dados clínicos', color: 'indigo' },
                  { icon: ShieldCheck, title: 'Segurança', desc: 'Conformidade NIR total', color: 'emerald' },
                ].map((feat, i) => (
                  <div key={i} className="space-y-4 group/feat">
                    <div className={`w-14 h-14 rounded-2xl bg-${feat.color}-500/10 flex items-center justify-center text-${feat.color}-400 border border-${feat.color}-500/20 shadow-xl shadow-${feat.color}-500/5 group-hover/feat:scale-110 group-hover/feat:border-${feat.color}-500/40 transition-all duration-500`}>
                      <feat.icon size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm uppercase tracking-widest">{feat.title}</h4>
                      <p className="text-slate-500 text-[11px] font-bold mt-1 uppercase tracking-tight leading-snug">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t border-white/5 flex items-center gap-8">
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white tracking-tighter font-outfit">CIR-A</p>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] opacity-80">A Inteligência que Regula</p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white tracking-tighter font-outfit">Cirila</p>
                  <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] opacity-80">O Coração que Cuida</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center group/avatar">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[120px] animate-pulse group-hover/avatar:bg-blue-500/30 transition-colors duration-1000" />
                <div className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="relative z-10 transform hover:scale-110 transition-transform duration-1000 rotate-0 group-hover/avatar:rotate-2">
                  <CirilaAvatar expression="neutral" size="400px" />
                </div>
                
                {/* Floating Tech Tags */}
                <div className="absolute top-10 right-0 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl animate-bounce delay-700">
                  <Sparkles size={16} className="text-cyan-400" />
                </div>
                <div className="absolute bottom-20 left-0 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl animate-bounce delay-1000">
                  <ShieldCheck size={16} className="text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  } catch (err) {
    console.error('Dashboard Fetch Error:', err);
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
        <div className="premium-card p-12 max-w-xl border-red-500/20 text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Erro de Conexão Crítico</h1>
            <p className="text-slate-400 text-sm">O sistema não conseguiu estabelecer comunicação com a base de dados institucional.</p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-left font-mono text-xs">
            <p className="text-blue-400 font-bold mb-2 uppercase tracking-widest">Diagnóstico:</p>
            <code className="text-red-400">{err instanceof Error ? err.message : String(err)}</code>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Ambiente de Segurança DCRAA/SMSVR</p>
        </div>
      </div>
    )
  }
}