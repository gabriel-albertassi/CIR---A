'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, ListTodo, Layers, CheckCircle, Building2, Users, Info, HeartPulse, LogOut, User as UserIcon, ShieldAlert, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import CallCirilaButton from './CallCirilaButton'
import { logout } from '../app/auth/actions'

const CirilaBotWidget = dynamic(() => import('./CirilaBotWidget'), {
  ssr: false,
  loading: () => null
})

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'ADMINISTRATIVO' | 'ENFERMEIRO_AUDITOR' | 'REGULADOR'
  canCancelPatient: boolean
  canPrintReports: boolean
}

export default function LayoutClientWrapper({ children, user }: { children: React.ReactNode, user: User | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  const isLoginPage = pathname === '/login'

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (isLoginPage) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', flex: 1, paddingTop: '0' }}>
        {/* SIDEBAR */}
        <aside className={`sidebar-main ${isMobileMenuOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          {/* LOGO & BRANDING */}
          <div className="logo-container-glow" style={{ marginBottom: '2rem', marginTop: '1.5rem', position: 'relative', height: '100px', width: '100%' }}>
            <Image
              src="/logo.png"
              alt="Logo CIR-A"
              fill
              priority
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 12px rgba(0,216,255,0.3))'
              }}
              className="logo-hover"
            />
          </div>

          <div style={{ margin: '1rem 0 1.5rem 0', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,216,255,0.15), transparent)' }} />

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <Link href="/" className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={22} color="#00b4d8" />
              <span>Painel Geral</span>
            </Link>
            <Link href="/patients" className={`sidebar-link ${pathname.startsWith('/patients') ? 'active' : ''}`}>
              <ListTodo size={22} color="#00b4d8" />
              <span>Fila de Pacientes</span>
            </Link>
            <Link href="/vagas" className={`sidebar-link ${pathname === '/vagas' ? 'active' : ''}`}>
              <Layers size={22} color="#00b4d8" />
              <span>Censo de Leitos</span>
            </Link>
            <Link href="/transferidos" className={`sidebar-link ${pathname === '/transferidos' ? 'active' : ''}`}>
              <CheckCircle size={22} color="#00b4d8" />
              <span>Transferidos</span>
            </Link>
            <Link href="/relatorio-privados" className={`sidebar-link ${pathname === '/relatorio-privados' ? 'active' : ''}`}>
              <Building2 size={22} color="#00b4d8" />
              <span>Hosp. Privados</span>
            </Link>

            <Link href="/pacientes" className={`sidebar-link ${pathname === '/pacientes' ? 'active' : ''}`}>
              <Users size={22} color="#00b4d8" />
              <span>Prontuário Geral</span>
            </Link>
          </nav>

          {/* USER PROFILE & LOGOUT */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Bloco do Usuário */}
            <div style={{ 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '16px', 
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '10px', 
                  background: user?.role === 'ADMIN' ? 'rgba(99,102,241,0.2)' : 'rgba(0,180,216,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: user?.role === 'ADMIN' ? '#818cf8' : '#00d8ff'
                }}>
                  <UserIcon size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user?.name || 'Carregando...'}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {user?.role || 'Acessando'}
                  </span>
                </div>
              </div>

              {/* Status de Acesso / Gestão Admin */}
              {user?.role === 'ADMIN' ? (
                <Link href="/admin/users" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem', 
                  padding: '0.6rem', 
                  borderRadius: '10px', 
                  background: 'rgba(129,140,248,0.1)', 
                  color: '#a5b4fc', 
                  fontSize: '0.75rem', 
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid rgba(129,140,248,0.2)',
                  transition: 'all 0.2s',
                  marginTop: '0.2rem'
                }}>
                  <Settings size={14} /> Gestão Admin
                </Link>
              ) : (
                user && !user.canCancelPatient && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.62rem', 
                    color: '#fbbf24', 
                    background: 'rgba(251,191,36,0.1)', 
                    padding: '4px 8px', 
                    borderRadius: '6px',
                    fontWeight: 600
                  }}>
                    <ShieldAlert size={12} /> ACESSO RESTRITO
                  </div>
                )
              )}

              <button 
                onClick={() => logout()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '0.2rem',
                  marginBottom: '0.5rem'
                }}
                className="logout-btn"
              >
                <LogOut size={14} /> Sair do Sistema
              </button>
            </div>

            {/* Link Sobre o Sistema no Rodapé da Sidebar */}
            <div style={{
              background: 'rgba(0,216,255,0.03)',
              border: '1px solid rgba(0,216,255,0.1)',
              borderRadius: '12px',
              padding: '0.4rem',
              marginBottom: '0.5rem',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Link 
                href="/sobre" 
                className={`sidebar-link ${pathname === '/sobre' ? 'active' : ''}`}
                style={{ 
                  background: 'transparent', 
                  border: 'none',
                  padding: '0.6rem 0.8rem'
                }}
              >
                <Info size={22} color="#00b4d8" />
                <span>Sobre o Sistema</span>
              </Link>
            </div>
            
            <div style={{ margin: '0.5rem 0 0.8rem 0', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,216,255,0.15), transparent)' }} />

            {/* Créditos Originais */}
            <div style={{
              background: 'rgba(0,216,255,0.03)',
              border: '1px solid rgba(0,216,255,0.1)',
              borderRadius: '12px',
              padding: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.68rem', color: '#00d8ff', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '4px' }}>
                Desenvolvido por Gabriel Albertassi
              </div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>SMSVR • Volta Redonda</div>
              <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem', opacity: 0.6 }}>v1.0.0</div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-viewport">
          {children}

          {/* MOBILE ONLY FOOTER - Limpo e com destaque */}
          <footer className="mobile-only" style={{
            marginTop: '3rem',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            background: 'rgba(8, 20, 35, 0.4)',
            borderTop: '1px solid rgba(0, 180, 216, 0.15)',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div className="logo-container-glow" style={{ position: 'relative', width: '240px', height: '70px' }}>
              <Image src="/logo.png" alt="Logo CIR-A" fill style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#00d8ff', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>
              SMSVR • SECRETARIA MUNICIPAL DE SAÚDE
            </div>
          </footer>
        </main>
      </div>

      {/* OVERLAY PARA MOBILE */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* OVERLAYS GLOBAIS */}
      {!isLoginPage && (
        <>
          <CirilaBotWidget />
          <CallCirilaButton />
        </>
      )}
    </div>
  )
}
