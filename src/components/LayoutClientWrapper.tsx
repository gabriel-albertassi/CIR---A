'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, ListTodo, Activity, CheckSquare, FileBarChart2, Users, Info, HeartPulse, LogOut, User as UserIcon, ShieldAlert, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import CirilaBotWidget from './CirilaBotWidget'
import CallCirilaButton from './CallCirilaButton'
import { logout } from '../app/auth/actions'

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
  const pathname = usePathname()

  const isLoginPage = pathname === '/login'

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  if (isLoginPage) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* MOBILE TOP BAR */}
      <header className="mobile-only" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'rgba(8, 20, 35, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 180, 216, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 100
      }}>
        <img 
          src="/logo.png" 
          alt="Logo CIR-A" 
          style={{ 
            height: '48px', 
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 12px rgba(0,216,255,0.8))' 
          }} 
        />
        <button 
          onClick={toggleMobileMenu}
          style={{ background: 'none', border: 'none', color: '#00b4d8', cursor: 'pointer', padding: '5px' }}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* OVERLAY FOR MOBILE */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 140
            }} 
          />
        )}

        {/* SIDEBAR */}
        <aside className={`sidebar-main ${isMobileMenuOpen ? 'open' : ''}`}>
          {/* LOGO & BRANDING */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.4rem' }}>
            <img
              src="/logo.png"
              alt="Logo CIR-A"
              style={{
                width: '100%',
                maxWidth: '160px',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 35px rgba(0,216,255,0.7)) brightness(1.1)',
                transition: 'transform 0.3s ease'
              }}
              className="logo-hover"
            />
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <Link href="/" className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={18} color="#00b4d8" />
              <span>Painel Geral</span>
            </Link>
            <Link href="/patients" className={`sidebar-link ${pathname.startsWith('/patients') ? 'active' : ''}`}>
              <ListTodo size={18} color="#00b4d8" />
              <span>Fila de Pacientes</span>
            </Link>
            <Link href="/vagas" className={`sidebar-link ${pathname === '/vagas' ? 'active' : ''}`}>
              <Activity size={18} color="#00b4d8" />
              <span>Censo de Leitos</span>
            </Link>
            <Link href="/transferidos" className={`sidebar-link ${pathname === '/transferidos' ? 'active' : ''}`}>
              <CheckSquare size={18} color="#00b4d8" />
              <span>Transferidos</span>
            </Link>
            <Link href="/relatorio-privados" className={`sidebar-link ${pathname === '/relatorio-privados' ? 'active' : ''}`}>
              <FileBarChart2 size={18} color="#f59e0b" />
              <span>Hosp. Privados</span>
            </Link>

            <div style={{ margin: '0.75rem 0', height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' }} />

            {user?.role === 'ADMIN' && (
              <Link href="/admin/users" className={`sidebar-link ${pathname.startsWith('/admin') ? 'active' : ''}`} style={{ color: '#818cf8', fontWeight: 600 }}>
                <Settings size={18} color="#818cf8" />
                <span>Gestão Admin</span>
              </Link>
            )}

            <Link href="/pacientes" className="sidebar-link">
              <Users size={18} color="#00b4d8" />
              <span>Prontuário Geral</span>
            </Link>
            <Link href="/sobre" className="sidebar-link">
              <Info size={18} color="#00b4d8" />
              <span>Sobre o Sistema</span>
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

              {/* Status de Acesso */}
              {user && !user.canCancelPatient && user.role !== 'ADMIN' && (
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
                  transition: 'all 0.2s'
                }}
                className="logout-btn"
              >
                <LogOut size={14} /> Sair do Sistema
              </button>
            </div>

            {/* Créditos Originais */}
            <div style={{
              background: 'rgba(0,216,255,0.03)',
              border: '1px solid rgba(0,216,255,0.1)',
              borderRadius: '12px',
              padding: '0.7rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase' }}>SMSVR • Volta Redonda</div>
              <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem' }}>v1.0.0</div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-viewport">
          {children}

          {/* MOBILE ONLY FOOTER */}
          <footer className="mobile-only" style={{
            marginTop: '3rem',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            background: 'rgba(8, 20, 35, 0.4)',
            borderTop: '1px solid rgba(0, 180, 216, 0.15)',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/logo.png" alt="Logo CIR-A" style={{ height: '60px', filter: 'drop-shadow(0 0 15px rgba(0,216,255,0.5))' }} />
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Central de Regulação Automatizada
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* OVERLAYS */}
      {!isLoginPage && (
        <>
          <CirilaBotWidget />
          <CallCirilaButton />
        </>
      )}
    </div>
  )
}
