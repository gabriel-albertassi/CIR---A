'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, ListTodo, Layers, CheckCircle, Building2, Users, Info, HeartPulse, LogOut, User as UserIcon, ShieldAlert, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import NotificationBell from '@/components/NotificationBell'
import SimulatorPanel from '@/components/SimulatorPanel'
import CallCirilaButton from '@/components/CallCirilaButton'
import dynamic from 'next/dynamic'

const CirilaBotWidget = dynamic(() => import('@/components/CirilaBotWidget'), {
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (isLoginPage) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      
      {/* BOTÃO HAMBÚRGUER FLUTUANTE PARA MOBILE */}
      {!isLoginPage && (
        <button 
          className="mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Abrir Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      <div style={{ display: 'flex', flex: 1, paddingTop: '0' }}>
        {/* SIDEBAR */}
        <aside className={`sidebar-main ${isMobileMenuOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          {/* LOGO & BRANDING */}
          <div className="logo-container-glow" style={{ marginBottom: '1.5rem', marginTop: '1.5rem', position: 'relative', height: '120px', width: '100%' }}>
            <Image
              src="/logo.png"
              alt="Logo CIR-A"
              fill
              priority
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 12px rgba(0,216,255,0.3))'
              }}
            />
          </div>

          <div style={{ margin: '1rem 0 1.5rem 0', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,216,255,0.15), transparent)' }} />

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <Link href="/" className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={20} color="#00b4d8" />
              <span>Painel Geral</span>
            </Link>
            <Link href="/patients" className={`sidebar-link ${pathname.startsWith('/patients') ? 'active' : ''}`}>
              <ListTodo size={20} color="#00b4d8" />
              <span>Fila de Pacientes</span>
            </Link>
            <Link href="/vagas" className={`sidebar-link ${pathname === '/vagas' ? 'active' : ''}`}>
              <Layers size={20} color="#00b4d8" />
              <span>Censo de Leitos</span>
            </Link>
            <Link href="/transferidos" className={`sidebar-link ${pathname === '/transferidos' ? 'active' : ''}`}>
              <CheckCircle size={20} color="#00b4d8" />
              <span>Transferidos</span>
            </Link>
            <Link href="/relatorio-privados" className={`sidebar-link ${pathname === '/relatorio-privados' ? 'active' : ''}`}>
              <Building2 size={20} color="#00b4d8" />
              <span>Hosp. Privados</span>
            </Link>

            <Link href="/pacientes" className={`sidebar-link ${pathname === '/pacientes' ? 'active' : ''}`}>
              <Users size={20} color="#00b4d8" />
              <span>Prontuário Geral</span>
            </Link>
          </nav>

          {/* USER PROFILE & LOGOUT */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            {/* Bloco do Usuário */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: '16px', 
              padding: '0.65rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '10px', 
                  background: user?.role === 'ADMIN' ? 'rgba(99,102,241,0.15)' : 'rgba(0,180,216,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: user?.role === 'ADMIN' ? '#818cf8' : '#00d8ff',
                  opacity: 0.8
                }}>
                  <UserIcon size={18} />
                </div>
                {!isSidebarCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontFamily: 'Outfit, sans-serif' }}>
                      {user?.name || user?.email?.split('@')[0] || 'Acesso'}
                    </span>
                    <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif' }}>
                      {user?.role || 'Acesso Automatizado'}
                    </span>
                  </div>
                )}
              </div>

              {user?.role === 'ADMIN' ? (
                <Link href="/admin/users" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  gap: '0.6rem', 
                  padding: '0.5rem', 
                  borderRadius: '8px', 
                  background: 'rgba(129,140,248,0.08)', 
                  color: '#a5b4fc', 
                  fontSize: '0.7rem', 
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid rgba(129,140,248,0.15)',
                  transition: 'all 0.2s',
                  opacity: 0.8
                }}>
                  <Settings size={12} /> {!isSidebarCollapsed && 'Gestão Admin'}
                </Link>
              ) : (
                user && !user.canCancelPatient && !isSidebarCollapsed && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.58rem', 
                    color: '#94a3b8', 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '4px 8px', 
                    borderRadius: '6px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    OPERADOR PADRÃO
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
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  color: '#fca5a5',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: 0.7
                }}
                className="logout-btn"
              >
                <LogOut size={12} /> {!isSidebarCollapsed && 'Sair'}
              </button>
            </div>

            {/* Link Sobre o Sistema */}
            <div style={{ display: 'flex', width: '100%', padding: '0 0.5rem' }}>
              <Link 
                href="/sobre" 
                className={`sidebar-link ${pathname === '/sobre' ? 'active' : ''}`}
                style={{ 
                  flex: 1,
                  background: 'rgba(0,216,255,0.04)', 
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  gap: '1rem',
                  color: isSidebarCollapsed ? '#00b4d8' : '#e2e8f0',
                  fontSize: '0.88rem',
                  border: '1px solid rgba(0, 216, 255, 0.1)',
                  transition: 'all 0.2s',
                  width: '100%',
                  fontWeight: 600,
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                <Info size={20} color="#00b4d8" style={{ opacity: 0.9 }} />
                {!isSidebarCollapsed && <span>Sobre o Sistema</span>}
              </Link>
            </div>
            
            <div style={{ margin: '0.25rem 0 0.5rem 0', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,216,255,0.1), transparent)' }} />

            {/* Créditos Atualizados 1.5 Premium Final */}
            <div style={{
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, opacity: 0.6, letterSpacing: '0.5px' }}>
                SMSVR • CIR-A • v1.5 Premium
              </div>
              <a 
                href="https://www.instagram.com/gabriel.albertassi" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  textDecoration: 'none',
                  fontSize: '0.65rem', 
                  color: '#00d8ff', 
                  fontWeight: 800, 
                  letterSpacing: '0.5px', 
                  opacity: 0.8
                }}
              >
                Desenvolvido por Gabriel Albertassi
              </a>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-viewport" style={{ position: 'relative' }}>
          {/* TOP BAR PARA NOTIFICAÇÕES */}
          <header style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            padding: '1rem 2rem', 
            background: 'linear-gradient(to bottom, rgba(8, 20, 35, 0.4), transparent)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(8px)'
          }}>
            <NotificationBell />
          </header>

          <div style={{ padding: '0 2rem 2rem 2rem' }}>
            {children}
          </div>

          {/* FOOTER INSTITUCIONAL GLOBAL */}
          <footer style={{
            marginTop: 'auto',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'rgba(8, 20, 35, 0.2)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div className="logo-container-glow" style={{ position: 'relative', width: '200px', height: '60px' }}>
              <Image src="/logo.png" alt="Logo CIR-A" fill style={{ objectFit: 'contain', opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.6 }}>
              SMSVR • SECRETARIA MUNICIPAL DE SAÚDE • VOLTA REDONDA
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
