'use client'

import { useState } from 'react'
import { ShieldCheck, Brain, Zap, HeartPulse, ArrowRight, UserPlus, LogIn, Mail, Lock, User } from 'lucide-react'
import { login, signup } from '@/app/auth/actions'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMsg(null)

    const formData = new FormData(e.currentTarget)
    
    if (isLogin) {
      const res = await login(formData)
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      }
    } else {
      const res = await signup(formData)
      setLoading(false)
      if (res.error) {
        setError(res.error)
      } else {
        setMsg('Conta criada com sucesso! Faça login para acessar.')
        setIsLogin(true)
      }
    }
  }

  return (
    <div className="login-root">

      {/* ── CAMADA DE FUNDO ── */}
      <div className="login-bg-layer">
        <div className="login-bg-photo" />
        <div className="login-bg-overlay" />
        <div className="login-bg-network" />
        <div className="login-bg-hex" />
      </div>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div className="login-content">

        {/* === COLUNA ESQUERDA — BRANDING === */}
        <div className="login-left">

          {/* Badge SMSVR */}
          <div className="login-smsvr-badge">
            <HeartPulse size={18} />
            <span>SMSVR • Secretaria Municipal de Saúde</span>
          </div>

          {/* Logo CIR-A */}
          <div className="login-logo-wrapper">
            <img
              src="/logo.png"
              alt="CIR-A Logo"
              className="login-logo"
            />
            <div className="login-logo-glow" />
          </div>

          {/* Títulos */}
          <div className="login-titles">
            <h1 className="login-title">
              Central Inteligente de<br />
              <span className="login-title-accent">Regulação Automatizada</span>
            </h1>
            <p className="login-subtitle">
              Tecnologia de última geração a serviço da saúde pública de Volta Redonda.
            </p>
          </div>

          {/* FORMULÁRIO DE ACESSO */}
          <div className="login-form-container">
            <div className="form-toggle-tabs">
              <button 
                className={`tab-btn ${isLogin ? 'active' : ''}`} 
                onClick={() => { setIsLogin(true); setError(null); setMsg(null); }}
              >
                <LogIn size={18} /> Entrar
              </button>
              <button 
                className={`tab-btn ${!isLogin ? 'active' : ''}`} 
                onClick={() => { setIsLogin(false); setError(null); setMsg(null); }}
              >
                <UserPlus size={18} /> Criar Conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-actual-form">
              {!isLogin && (
                <div className="input-group">
                  <label><User size={16} /> Nome Completo</label>
                  <input type="text" name="name" placeholder="Ex: Dr. João Silva" required />
                </div>
              )}
              <div className="input-group">
                <label><Mail size={16} /> E-mail Institucional</label>
                <input type="email" name="email" placeholder="nome@voltaredonda.rj.gov.br" required />
              </div>
              <div className="input-group">
                <label><Lock size={16} /> Senha</label>
                <input type="password" name="password" placeholder="••••••••" required />
              </div>

              {error && <div className="login-error-msg">{error}</div>}
              {msg && <div className="login-success-msg">{msg}</div>}

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? 'Processando...' : (isLogin ? 'Acessar o Sistema' : 'Solicitar Acesso')}
                <ArrowRight size={20} />
              </button>
            </form>

            <p className="form-help-text">
              {isLogin 
                ? 'Novos operadores devem realizar o cadastro para acesso restrito.' 
                : 'Seu acesso inicial será limitado até a aprovação de um administrador.'}
            </p>
          </div>

          {/* Rodapé */}
          <p className="login-footer-text">
            Prefeitura de Volta Redonda &nbsp;•&nbsp; Versão 1.0 &nbsp;•&nbsp;
            Desenvolvido por <a href="https://www.instagram.com/gabriel.albertassi" target="_blank" rel="noopener noreferrer">Gabriel Albertassi</a>
          </p>
        </div>

        {/* === COLUNA DIREITA — CIRILA HERO === */}
        <div className="login-right">
          <div className="login-cirila-aura" />
          <div className="login-holo holo-1"><span className="holo-dot" /><span>3 Pacientes em Oferta</span></div>
          <div className="login-holo holo-2"><HeartPulse size={14} /><span>2 Críticos Ativos</span></div>
          <div className="login-holo holo-3"><span className="holo-dot green" /><span>IA Online</span></div>
          <div className="login-holo holo-4"><Brain size={14} /><span>Cirila Ativa</span></div>

          <img src="/cirila_1.png" alt="Cirila" className="login-cirila-img" />

          <div className="login-cirila-speech">
            <img src="/cirila_icone.png" alt="ícone Cirila" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,216,255,0.4)' }} />
            <div>
              <strong>Olá! Sou a Cirila.</strong>
              <span>Pronta para otimizar a regulação de saúde municipal.</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── ESTILOS INLINE (scoped) ── */}
      <style>{`
        /* ===== ROOT ===== */
        .login-root {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: stretch;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          z-index: 9999;
        }

        /* ===== BG LAYERS ===== */
        .login-bg-layer {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .login-bg-photo {
          position: absolute;
          inset: 0;
          background-image: 
            url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1920&q=80&auto=format&fit=crop'),
            url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&q=80&auto=format&fit=crop');
          background-position: center;
          background-size: cover;
          filter: blur(8px) brightness(0.3) saturate(0.6);
          transform: scale(1.05);
        }

        .login-bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(8, 14, 26, 0.97) 0%,
            rgba(11, 43, 54, 0.92) 40%,
            rgba(13, 51, 71, 0.85) 70%,
            rgba(8, 20, 35, 0.95) 100%
          );
        }

        .login-bg-network {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 20% 50%, rgba(0,180,216,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0,216,255,0.06) 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, rgba(99,102,241,0.05) 0%, transparent 40%);
        }

        .login-bg-hex {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 2 L56 16 L56 44 L30 58 L4 44 L4 16 Z' fill='none' stroke='%2300b4d8' stroke-width='0.3' opacity='0.15'/%3E%3C/svg%3E");
          background-size: 60px 60px;
          opacity: 0.4;
        }

        /* ===== CONTENT ===== */
        .login-content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          height: 100%;
        }

        /* ===== LEFT COLUMN ===== */
        .login-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4rem 3.5rem 3rem;
          gap: 1.75rem;
          border-right: 1px solid rgba(0,180,216,0.15);
        }

        .login-smsvr-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0,180,216,0.1);
          border: 1px solid rgba(0,180,216,0.25);
          color: #00d8ff;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          width: fit-content;
          backdrop-filter: blur(8px);
        }

        .login-logo-wrapper {
          position: relative;
          width: fit-content;
        }

        .login-logo {
          width: 160px;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(0,180,216,0.4));
          transition: filter 0.3s ease;
        }

        .login-logo:hover {
          filter: drop-shadow(0 0 35px rgba(0,216,255,0.6));
        }

        .login-logo-glow {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle, rgba(0,180,216,0.15) 0%, transparent 70%);
          z-index: -1;
        }

        .login-titles {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .login-title {
          font-size: 2.2rem;
          font-weight: 900;
          color: #f8fafc;
          line-height: 1.25;
          letter-spacing: -0.5px;
          margin: 0;
        }

        .login-title-accent {
          background: linear-gradient(90deg, #00d8ff, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-subtitle {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
          max-width: 440px;
        }

        /* ===== FORM CONTAINER ===== */
        .login-form-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2rem;
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          max-width: 440px;
          animation: form-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes form-entry {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .form-toggle-tabs {
          display: flex;
          background: rgba(0,0,0,0.2);
          padding: 0.35rem;
          border-radius: 12px;
          gap: 0.25rem;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: rgba(0, 180, 216, 0.15);
          color: #00d8ff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .login-actual-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          margin-left: 0.25rem;
        }

        .input-group input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.85rem 1rem;
          color: white;
          font-size: 0.9rem;
          transition: all 0.2s;
          outline: none;
        }

        .input-group input:focus {
          border-color: rgba(0, 216, 255, 0.5);
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(0, 216, 255, 0.1);
        }

        .login-submit-btn {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, #00b4d8, #0096c7);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 20px rgba(0, 180, 216, 0.3);
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(0, 180, 216, 0.4);
          filter: brightness(1.1);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-error-msg {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.8rem;
          text-align: center;
        }

        .login-success-msg {
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.2);
          color: #6ee7b7;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.8rem;
          text-align: center;
        }

        .form-help-text {
          font-size: 0.75rem;
          color: #64748b;
          text-align: center;
          line-height: 1.5;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .login-content {
            grid-template-columns: 1fr;
          }
          .login-right {
            display: none;
          }
          .login-left {
            border-right: none;
            padding: 2.5rem 1.5rem;
            align-items: center;
            text-align: center;
          }
          .login-titles {
            align-items: center;
          }
          .login-form-container {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
