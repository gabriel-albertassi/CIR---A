import { prisma } from '../lib/db'
import { Clock, Ambulance, AlertCircle, CheckCircle2, Bot, Sparkles, Zap, Brain, ShieldCheck } from 'lucide-react'
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
import styles from './dashboard.module.css'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // 1. Pegamos o usuário do Supabase primeiro (necessário para o ID)
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  try {
    // 2. Disparamos TODAS as outras consultas em paralelo
    const [
      dbUser,
      totalWaiting,
      totalOffered,
      totalTransferred,
      patientsWithLogs,
      availabilities,
      transferredLogs,
    ] = await Promise.all([
      // Usuário do DB (se existir auth)
      authUser ? prisma.user.findUnique({ where: { id: authUser.id } }) : Promise.resolve(null),
      
      // Contagens
      prisma.patient.count({ where: { status: 'WAITING' } }),
      prisma.patient.count({ where: { status: 'OFFERED' } }),
      prisma.patient.count({ where: { status: 'TRANSFERRED' } }),
      
      // Pacientes ATIVOS + Logs de Solicitação (Includo para evitar N+1 e Waterfall)
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
      
      // Censo
      prisma.bedAvailability.findMany(),
      
      // Histórico de Transferências (Limitado aos últimos 30 dias para performance)
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

    // Processamento em memória (rápido)
    patientsWithLogs.forEach(p => {
      const hours = (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60)
      totalWaitHours += hours

      if (p.severity === 'SALA_VERMELHA') criticalCount++
      if (p.severity === 'CTI') ctiCount++;
      if (p.severity === 'CLINICA_MEDICA') clinicaCount++;
    })

    // Chart 1: Transferred Hospitals (Últimos 30 dias)
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

    // Chart 3: Hospitais Privados (Trend)
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

    // Totais Consolidados (Histórico 30d + Solicitações Ativas)
    const privateTotals: Record<string, number> = {};
    PRIVATE_HOSPITALS.forEach(h => { privateTotals[h] = 0; });

    // 1. Transferidos recentes
    transferredLogs.forEach(l => {
      if (l.details && PRIVATE_HOSPITALS.includes(l.details)) {
        privateTotals[l.details]++;
      }
    });

    // 2. Solicitações ativas
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
      : 0

    return (
      <div className={styles.dashboardContainer}>

        {/* HEADER DA PÁGINA */}
        <div className={styles.headerSection}>
          <div className={styles.titleArea}>
            <h1>Painel Operacional</h1>
            <p>Visão centralizada da regulação e monitoramento inteligente.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/patients/new" className="btn btn-primary no-print" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', borderRadius: '8px' }}>
              + Nova Regulação
            </Link>
            <PrintButton user={dbUser} />
          </div>
        </div>

        <div className={styles.mainHero}>
          <h2 className={styles.heroTitle}>
            CIR - A Central Inteligente de Regulação Automatizada
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.07)', padding: '0.6rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(0,180,216,0.2)' }}>
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
            <div className={styles.statsGrid}>
              <Link href="/patients" style={{ textDecoration: 'none' }}>
                <div className={styles.statCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Aguardando</div>
                    <Clock size={16} color="#60a5fa" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>{totalWaiting}</div>
                </div>
              </Link>

              <Link href="/patients" style={{ textDecoration: 'none' }}>
                <div className={styles.statCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Solicitados</div>
                    <Ambulance size={16} color="#a78bfa" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>{totalOffered}</div>
                </div>
              </Link>

              <Link href="/patients" style={{ textDecoration: 'none' }}>
                <div className={styles.statCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Críticos</div>
                    <AlertCircle size={16} color="#f87171" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: criticalCount > 0 ? '#fca5a5' : '#f1f5f9' }}>{criticalCount}</div>
                </div>
              </Link>

              <Link href="/transferidos" style={{ textDecoration: 'none' }}>
                <div className={styles.statCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Transferidos</div>
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
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                    const totalVagas = (h.cti_masc || 0) + (h.cti_fem || 0) + (h.clinica_masc || 0) + (h.clinica_fem || 0);

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

        <DashboardQueue patients={patientsWithLogs} user={dbUser} />

        <div className={styles.avatarSection}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
                Conheça a <span style={{ color: '#00d8ff' }}>Cirila</span>:<br />
                A Face Humana da Inovação na Saúde
              </h2>
              <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.7 }}>
                A <strong>Cirila</strong> não é apenas uma assistente virtual; ela é a personificação da nossa Central Inteligente de Regulação Automatizada (CIR-A).
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '350px' }}>
              <CirilaAvatar expression="neutral" size="100%" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', textAlign: 'center' }}>O que a Cirila faz por você?</h3>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(37,99,235,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#60a5fa' }}>
                  <Zap size={30} />
                </div>
                <h4>Agilidade</h4>
                <p>Monitora em tempo real as filas e disponibilidades.</p>
              </div>
              <div className={styles.featureCard}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(192,38,211,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#e879f9' }}>
                  <Brain size={30} />
                </div>
                <h4>Inteligência</h4>
                <p>Analisa dados de saúde complexos para priorizar casos.</p>
              </div>
              <div className={styles.featureCard}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(5,150,105,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#34d399' }}>
                  <ShieldCheck size={30} />
                </div>
                <h4>Transparência</h4>
                <p>Mantém você informado sobre cada etapa.</p>
              </div>
            </div>

            <div style={{
              background: 'rgba(4, 12, 28, 0.6)',
              padding: '2rem',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              justifyContent: 'center',
              marginTop: '1rem',
              flexWrap: 'wrap',
              border: '1px solid rgba(0, 216, 255, 0.2)'
            }}>
              <div style={{ width: '120px', height: '120px', position: 'relative', flexShrink: 0 }}>
                <Image 
                  src="/cirila_3D_neutral.png" 
                  alt="Cirila Avatar" 
                  fill
                  style={{ objectFit: 'contain', borderRadius: '50%' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxWidth: '600px' }}>
                <p style={{ fontSize: '1.1rem', margin: 0, color: '#f1f5f9', lineHeight: 1.6 }}>
                  Tecnologia dedicada ao servir: <strong style={{ color: '#ffffff', fontWeight: 800 }}>você</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid rgba(0,216,255,0.15)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
                    CIR-A: A inteligência que regula.
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00e5ff', lineHeight: 1.2 }}>
                    Cirila: A inteligência que cuida.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('Dashboard Fetch Error:', err);
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: '#080e1a' }}>
        <div className="card" style={{ maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
          <h1 style={{ color: '#f1f5f9', fontSize: '1.5rem', marginBottom: '1rem' }}>Configuração do Banco de Dados Pendente</h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
            O sistema não conseguiu conectar às tabelas do banco de dados. 
            Isso é normal no primeiro deploy.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'left', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#00d8ff', marginBottom: '0.5rem', fontWeight: 700 }}>COMO RESOLVER:</p>
            <code style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>npx prisma db push</code>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Certifique-se de que a variável DATABASE_URL nas configurações da Vercel está correta.
          </p>
        </div>
      </div>
    )
  }
}
}