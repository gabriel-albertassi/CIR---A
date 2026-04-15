import { prisma } from '@/lib/prisma'
import { Clock, Ambulance, AlertCircle, CheckCircle2, Bot, Sparkles, Zap, Brain, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import DashboardCharts from './DashboardCharts'
import PrintButton from '@/components/PrintButton'
import PrivateHospitalsChart from '@/components/PrivateHospitalsChart'
import InteractiveCirilaPanel from '@/components/InteractiveCirilaPanel'
import { PRIVATE_HOSPITALS } from '@/lib/constants'
import DashboardQueue from '@/components/DashboardQueue'
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [
    totalWaiting,
    totalOffered,
    totalTransferred,
    patients,
    availabilities,
    transferredLogs,
  ] = await Promise.all([
    prisma.patient.count({ where: { status: 'WAITING' } }),
    prisma.patient.count({ where: { status: 'OFFERED' } }),
    prisma.patient.count({ where: { status: 'TRANSFERRED' } }),
    prisma.patient.findMany({
      where: { status: { in: ['WAITING', 'OFFERED'] } },
      select: { id: true, name: true, created_at: true, severity: true, status: true, origin_hospital: true }
    }),
    prisma.bedAvailability.findMany(),
    prisma.log.findMany({
      where: { action: 'TRANSFER' },
      select: { details: true, timestamp: true }
    })
  ])

  const now = new Date()
  let totalWaitHours = 0
  let criticalCount = 0

  let ctiCount = 0;
  let clinicaCount = 0;

  patients.forEach(p => {
    const hours = (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60)
    totalWaitHours += hours

    if (p.severity === 'SALA_VERMELHA') {
      criticalCount++
    }

    if (p.severity === 'CTI') ctiCount++;
    if (p.severity === 'CLINICA_MEDICA') clinicaCount++;
  })

  // Chart 1: Transferred Hospitals
  const destMap: Record<string, number> = {};
  transferredLogs.forEach(l => {
    if (l.details) {
      destMap[l.details] = (destMap[l.details] || 0) + 1;
    }
  });
  const transferredData = Object.entries(destMap).map(([name, value]) => ({ name, value }));

  // Chart 2: Severity Bar Chart
  const severityData = [
    { name: 'S. Vermelha', qtd: criticalCount, fill: '#ef4444' },
    { name: 'CTI', qtd: ctiCount, fill: '#f97316' },
    { name: 'Clín. Médica', qtd: clinicaCount, fill: '#3b82f6' }
  ];

  // Chart 3: Transferências para Hospitais Privados (por dia, todos os privados)
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

  // Totais por hospital privado (Solicitados + Transferidos)
  const privateTotals: Record<string, number> = {};
  PRIVATE_HOSPITALS.forEach(h => { privateTotals[h] = 0; });

  // 1. Contar transferidos (histórico)
  transferredLogs.forEach(l => {
    if (l.details && PRIVATE_HOSPITALS.includes(l.details)) {
      privateTotals[l.details]++;
    }
  });

  // 2. Contar solicitações ativas (quem está na fila com hospital privado vinculado e NÃO foi recusado por ele por último)
  const activeIds = patients.map(p => p.id);
  const relevantLogs = await prisma.log.findMany({
    where: {
      patient_id: { in: activeIds },
      action: { in: ['REQUEST', 'REFUSAL'] }
    },
    orderBy: { timestamp: 'desc' }
  });

  const processedPatients = new Set();
  relevantLogs.forEach(l => {
    if (!processedPatients.has(l.patient_id)) {
      processedPatients.add(l.patient_id);
      // Verificamos se o log começa com o nome de um dos hospitais privados
      // (Isso lida com logs que têm notas extras, como "Hospital X — Motivo: ...")
      const matchedHospital = PRIVATE_HOSPITALS.find(h => l.details?.startsWith(h));

      if (l.action === 'REQUEST' && matchedHospital) {
        privateTotals[matchedHospital]++;
      }
    }
  });

  const avgWaitHours = patients.length > 0
    ? (totalWaitHours / patients.length).toFixed(1)
    : 0

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* HEADER DA PÁGINA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.2rem', color: '#f1f5f9' }}>
            Painel Operacional
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Visão centralizada da regulação e monitoramento inteligente.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: 'auto' }}>
          <Link href="/patients/new" className="btn btn-primary no-print" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}>
            + Nova Regulação
          </Link>
          <PrintButton />
        </div>
      </div>

      <div style={{
        background: 'rgba(8, 20, 40, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '2rem 2.5rem',
        color: '#f1f5f9',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid rgba(0, 180, 216, 0.25)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,180,216,0.08)'
      }}>
        <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', background: 'linear-gradient(90deg, #e2e8f0, #00d8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CIR - A Central Inteligente de Regulação Automatizada
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* SMALL IA WIDGET */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.07)', padding: '0.6rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(0,180,216,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <Bot size={16} /> A.I Status:
            </div>
            <span style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 600 }}>
              {criticalCount > 2
                ? <span style={{ color: '#fca5a5' }}>{criticalCount} Vagas Zero Prioritárias.</span>
                : `Operação Normal (${avgWaitHours}h).`}
            </span>
          </div>
        </div>
      </div>

      {/* DASHBOARD SPLIT VIEW */}
      <div className="dashboard-grid">

        {/* LEFT COLUMN: Main KPIs and Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* CARDS */}
          <div className="kpi-grid">
            {/* AGUARDANDO */}
            <Link href="/patients" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.09)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aguardando</div>
                  <Clock size={16} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>{totalWaiting}</div>
              </div>
            </Link>

            {/* EM OFERTA */}
            <Link href="/patients" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.09)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Solicitados</div>
                  <Ambulance size={16} color="#a78bfa" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>{totalOffered}</div>
              </div>
            </Link>

            {/* CRÍTICOS */}
            <Link href="/patients" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.09)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Críticos</div>
                  <AlertCircle size={16} color="#f87171" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: criticalCount > 0 ? '#fca5a5' : '#f1f5f9' }}>{criticalCount}</div>
              </div>
            </Link>

            {/* TRANSFERIDOS */}
            <Link href="/transferidos" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.09)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transferidos</div>
                  <CheckCircle2 size={16} color="#4ade80" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>{totalTransferred}</div>
              </div>
            </Link>
          </div>

          <DashboardCharts transferredData={transferredData} severityData={severityData} />

          <PrivateHospitalsChart data={privateData} totals={privateTotals} />

        </div>

        {/* RIGHT COLUMN: Minimalist Bed Map & Cirila */}
        <div className="no-print right-sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* INTERACTIVE CIRILA PANEL */}
          <InteractiveCirilaPanel />

          <div className="card" style={{ padding: '1.5rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mapa de Leitos Abertos
              </h2>
              <Link href="/vagas" style={{ fontSize: '0.75rem', color: '#00b4d8', textDecoration: 'underline' }}>Atualizar</Link>
            </div>

            {availabilities.length === 0 ? (
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', padding: '1rem 0' }}>
                Nenhuma vaga informada pelo Censo no momento.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {availabilities.map(h => {
                  const totalVagas = h.cti_masc + h.cti_fem + h.clinica_masc + h.clinica_fem;

                  if (h.sem_vagas || totalVagas === 0) {
                    return (
                      <div key={h.id} style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', textDecoration: 'line-through' }}>
                          🏥 {h.hospital_name.replace('Hospital', '').trim()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 700, background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>LOTAÇÃO MÁXIMA (Sem Vagas)</div>
                      </div>
                    )
                  }

                  return (
                    <div key={h.id} style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                        🏥 {h.hospital_name.replace('Hospital', '').trim()}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        {h.cti_masc > 0 && <span style={{ background: 'rgba(249,115,22,0.2)', color: '#fdba74', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>CTI M:{h.cti_masc}</span>}
                        {h.cti_fem > 0 && <span style={{ background: 'rgba(249,115,22,0.2)', color: '#fdba74', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>CTI F:{h.cti_fem}</span>}
                        {h.clinica_masc > 0 && <span style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Cli M:{h.clinica_masc}</span>}
                        {h.clinica_fem > 0 && <span style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Cli F:{h.clinica_fem}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* DASHBOARD QUEUE: Fila em Tempo Real */}
      <DashboardQueue patients={patients} />

      {/* ABOUT SECTION: Conheça a Cirila */}
      <div className="about-cirila-section" style={{ padding: '3rem 2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '3rem', background: 'rgba(8,20,40,0.7)', border: '1px solid rgba(0,180,216,0.2)', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>

        <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', margin: 0 }}>
              Conheça a <span style={{ color: '#00d8ff' }}>Cirila</span>:<br />
              A Face Humana da Inovação na Saúde
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
              A <strong style={{ color: '#e2e8f0' }}>Cirila</strong> não é apenas uma assistente virtual; ela é a personificação da nossa Central Inteligente de Regulação Automatizada (CIR-A).
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <img className="cirila-img-hover" src="/cirila_1.png" alt="Cirila em ação" style={{ width: '100%', maxWidth: '320px', objectFit: 'contain', zIndex: 1, filter: 'drop-shadow(0 20px 30px rgba(37,99,235,0.15))', transition: 'transform 0.4s ease', cursor: 'grab' }} />
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', textAlign: 'center', margin: 0, letterSpacing: '-0.5px' }}>O que a Cirila faz por você?</h3>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

            <div className="feature-card-hover" style={{ background: 'rgba(255,255,255,0.06)', padding: '2rem 1.5rem', borderRadius: '20px', border: '1px solid rgba(0,180,216,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(37,99,235,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: '#60a5fa' }}>
                <Zap size={32} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem' }}>Agilidade</h4>
              <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>Monitora em tempo real as filas e disponibilidades.</p>
            </div>

            <div className="feature-card-hover" style={{ background: 'rgba(255,255,255,0.06)', padding: '2rem 1.5rem', borderRadius: '20px', border: '1px solid rgba(0,180,216,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(192,38,211,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: '#e879f9' }}>
                <Brain size={32} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem' }}>Inteligência</h4>
              <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>Analisa dados de saúde complexos para priorizar casos.</p>
            </div>

            <div className="feature-card-hover" style={{ background: 'rgba(255,255,255,0.06)', padding: '2rem 1.5rem', borderRadius: '20px', border: '1px solid rgba(0,180,216,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(5,150,105,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: '#34d399' }}>
                <ShieldCheck size={32} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem' }}>Transparência</h4>
              <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>Mantém você informado sobre cada etapa.</p>
            </div>

          </div>

          <div style={{
            background: 'rgba(4, 12, 28, 0.85)',
            padding: '2rem',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            justifyContent: 'center',
            marginTop: '1rem',
            flexWrap: 'wrap',
            border: '1px solid rgba(0, 216, 255, 0.35)',
            boxShadow: '0 0 60px rgba(0, 216, 255, 0.1)'
          }}>
            <div style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,216,255,0.06)', borderRadius: '50%', padding: '12px', border: '1.5px solid rgba(0,216,255,0.3)', flexShrink: 0 }}>
              <img src="/cirila_icone.png" alt="Cirila Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
              <p style={{ fontSize: '1.1rem', margin: 0, color: '#f1f5f9', lineHeight: 1.6 }}>
                Tecnologia dedicada ao servir: <strong style={{ color: '#ffffff', fontWeight: 800 }}>você</strong>.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid rgba(0,216,255,0.2)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
                  CIR-A: A inteligência que regula.
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00e5ff', lineHeight: 1.2 }}>
                  Cirila: A inteligência que cuida.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


const gridCardsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '1rem',
}