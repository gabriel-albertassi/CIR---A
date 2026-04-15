'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, ListTodo, Activity, CheckSquare, FileBarChart2, Users, Info, HeartPulse } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import CirilaBotWidget from './CirilaBotWidget'
import CallCirilaButton from './CallCirilaButton'

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 100
      }}>
        <img 
          src="/logo.png" 
          alt="Logo CIR-A" 
          style={{ 
            height: '56px', 
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 18px rgba(0,216,255,0.9)) brightness(1.2) contrast(1.1)' 
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
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
            <img
              src="/logo.png"
              alt="Logo CIR-A"
              style={{
                width: '100%',
                maxWidth: '200px',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 45px rgba(0,216,255,1)) brightness(1.25) contrast(1.15)',
                transition: 'transform 0.3s ease'
              }}
              className="logo-hover"
            />
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,180,216,0.3), transparent)', marginTop: '0.5rem' }} />
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
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
          </nav>

          {/* CREDITS */}
          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', textAlign: 'center' }}>
            <a
              href="https://www.instagram.com/secretariadesaudevr/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,180,216,0.15), rgba(0,150,200,0.1))',
                color: '#00d8ff',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.9rem',
                letterSpacing: '1px',
                border: '1px solid rgba(0,180,216,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HeartPulse size={16} color="#00d8ff" />
                  SMSVR
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Secretaria Municipal de Saúde
                </div>
              </div>
            </a>
            <div style={{
              background: 'rgba(0,216,255,0.05)',
              border: '1px solid rgba(0,216,255,0.18)',
              borderRadius: '12px',
              padding: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Desenvolvido por</div>
              <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '0.92rem' }}>Gabriel Albertassi</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px' }}>
                Volta Redonda • Versão 1.0.0
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-viewport">
          {children}

          {/* MOBILE ONLY FOOTER */}
          <footer className="mobile-only" style={{
            marginTop: '3rem',
            padding: '2rem 1rem',
            flexDirection: 'column',
            gap: '2rem',
            background: 'rgba(8, 20, 35, 0.4)',
            borderTop: '1px solid rgba(0, 180, 216, 0.15)',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {/* BRANDING: LOGO & PHRASE */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <img 
                src="/logo.png" 
                alt="Logo CIR-A" 
                style={{ 
                  height: '60px', 
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 15px rgba(0,216,255,0.6))' 
                }} 
              />
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#00d8ff', lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '1px', maxWidth: '280px' }}>
                Central Inteligente de Regulação Automatizada
              </div>
            </div>

            {/* CREDITS BLOCK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '300px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,180,216,0.15), rgba(0,150,200,0.1))',
                color: '#00d8ff',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
                border: '1px solid rgba(0,180,216,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HeartPulse size={14} color="#00d8ff" />
                  SMSVR
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>
                  Secretaria Municipal de Saúde
                </div>
              </div>

              <div style={{
                background: 'rgba(0,216,255,0.05)',
                border: '1px solid rgba(0,216,255,0.18)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Desenvolvido por</div>
                <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '0.9rem' }}>Gabriel Albertassi</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px' }}>
                  Volta Redonda • Versão 1.0.0
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* OVERLAYS */}
      <CirilaBotWidget />
      <CallCirilaButton />
    </div>
  )
}
