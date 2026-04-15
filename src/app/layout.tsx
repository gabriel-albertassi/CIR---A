import Link from 'next/link'
import './globals.css'
import { LayoutDashboard, Users, HeartPulse, CheckSquare, ListTodo, Activity, Info, FileBarChart2 } from 'lucide-react'
import CirilaBotWidget from '@/components/CirilaBotWidget'
import CallCirilaButton from '@/components/CallCirilaButton'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body style={{ margin: 0, overflowX: 'hidden' }}>

        <div style={{ display: 'flex', minHeight: '100vh' }}>

          {/* MENU LATERAL PREMIUM DARK */}
          <aside style={{
            width: '280px',
            background: 'rgba(8, 20, 35, 0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRight: '1px solid rgba(0, 180, 216, 0.18)',
            boxShadow: '4px 0 32px rgba(0,0,0,0.4), inset -1px 0 0 rgba(0,180,216,0.08)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            position: 'relative',
            zIndex: 10
          }}>

            {/* LOGO & BRANDING */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
              <img
                src="/logo.png"
                alt="Logo CIR-A"
                style={{
                  width: '100%',
                  maxWidth: '160px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 28px rgba(0,216,255,0.75)) drop-shadow(0 0 8px rgba(0,216,255,0.4))'
                }}
              />
              <div style={{ width: '100%', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,180,216,0.3), transparent)', marginTop: '0.5rem' }} />
            </div>

            {/* LINKS */}
            <Link href="/" className="sidebar-link">
              <LayoutDashboard size={20} color="#00b4d8" />
              <span>Painel de Controle</span>
            </Link>

            <Link href="/patients" className="sidebar-link">
              <ListTodo size={20} color="#00b4d8" />
              <span>Fila de Pacientes</span>
            </Link>

            <Link href="/vagas" className="sidebar-link">
              <Activity size={20} color="#00b4d8" />
              <span>Censo de Leitos</span>
            </Link>

            <Link href="/transferidos" className="sidebar-link">
              <CheckSquare size={20} color="#00b4d8" />
              <span>Transferidos</span>
            </Link>

            <Link href="/relatorio-privados" className="sidebar-link">
              <FileBarChart2 size={20} color="#f59e0b" />
              <span>Contratos Privados</span>
            </Link>

            <div style={{ margin: '1rem 0', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,180,216,0.25), transparent)' }} />

            <Link href="/pacientes" className="sidebar-link">
              <Users size={20} color="#00b4d8" />
              <span>Pacientes (Geral)</span>
            </Link>

            <Link href="/sobre" className="sidebar-link">
              <Info size={20} color="#00b4d8" />
              <span>Sobre o Sistema</span>
            </Link>

            {/* CRÉDITOS DO DESENVOLVEDOR */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '1.5rem',
              textAlign: 'center',
            }}>
              {/* Badge SMSVR */}
              <a
                href="https://www.instagram.com/secretariadesaudevr/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0,180,216,0.15), rgba(0,150,200,0.1))',
                  color: '#00d8ff',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  boxShadow: '0 0 16px rgba(0,180,216,0.2)',
                  border: '1px solid rgba(0,180,216,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <HeartPulse size={18} color="#00d8ff" />
                  SMSVR
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#94a3b8' }}>Secretaria Municipal de Saúde</span>
              </a>

              {/* Bloco de créditos destacado */}
              <div style={{
                background: 'rgba(0,216,255,0.05)',
                border: '1px solid rgba(0,216,255,0.18)',
                borderRadius: '12px',
                padding: '0.9rem 1rem',
                lineHeight: '1.7',
              }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Desenvolvido por
                </div>
                <a
                  href="https://www.instagram.com/gabriel.albertassi?igsh=OXFmaXZkY254Nnk4&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#f1f5f9', textDecoration: 'none', fontWeight: 800, fontSize: '0.95rem', display: 'block', marginBottom: '0.3rem' }}
                >
                  Gabriel Albertassi
                </a>
                <span style={{ fontSize: '0.78rem', color: '#00b4d8', fontWeight: 600 }}>
                  Volta Redonda • Versão 1.0
                </span>
              </div>
            </div>

          </aside>

          {/* CONTEÚDO PRINCIPAL */}
          <main style={{
            flex: 1,
            padding: '2.5rem',
            maxWidth: '1600px', // Restrict width on ultrawides for premium feel
            margin: '0 auto',
            width: '100%',
            position: 'relative'
          }}>
            {children}
          </main>

          {/* Persistent Floating Chat & Button */}
          <CirilaBotWidget />
          <CallCirilaButton />
        </div>

      </body>
    </html>
  )
}