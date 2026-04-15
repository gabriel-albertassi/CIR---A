/**
 * Página de Login / Splash Screen — CIR-A
 * Opção 2: Hero cinematográfico com Cirila em destaque
 */
import Link from 'next/link'
import { ShieldCheck, Brain, Zap, HeartPulse, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="login-root">

      {/* ── CAMADA DE FUNDO ── */}
      <div className="login-bg-layer">
        {/* Foto de processo — hospital blurred */}
        <div className="login-bg-photo" />
        {/* Overlay gradiente escuro */}
        <div className="login-bg-overlay" />
        {/* Rede neural animada */}
        <div className="login-bg-network" />
        {/* Partículas hex */}
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

          {/* Features rápidas */}
          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon" style={{ background: 'rgba(0,180,216,0.15)', color: '#00d8ff' }}>
                <Brain size={20} />
              </div>
              <div>
                <strong>IA Integrada</strong>
                <span>Decisões clínicas inteligentes e em tempo real</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                <Zap size={20} />
              </div>
              <div>
                <strong>Alta Performance</strong>
                <span>Regulação de pacientes em segundos</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon" style={{ background: 'rgba(5,150,105,0.15)', color: '#34d399' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>Seguro e Auditável</strong>
                <span>Histórico completo e rastreável</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link href="/" className="login-cta-btn">
            Acessar o Sistema
            <ArrowRight size={20} />
          </Link>

          {/* Rodapé */}
          <p className="login-footer-text">
            Prefeitura de Volta Redonda &nbsp;•&nbsp; Versão 1.0 &nbsp;•&nbsp;
            Desenvolvido por <a href="https://www.instagram.com/gabriel.albertassi" target="_blank" rel="noopener noreferrer">Gabriel Albertassi</a>
          </p>
        </div>

        {/* === COLUNA DIREITA — CIRILA HERO === */}
        <div className="login-right">

          {/* Aura glow atrás da Cirila */}
          <div className="login-cirila-aura" />

          {/* Elementos holográficos flutuantes */}
          <div className="login-holo holo-1">
            <span className="holo-dot" />
            <span>3 Pacientes em Oferta</span>
          </div>
          <div className="login-holo holo-2">
            <HeartPulse size={14} />
            <span>2 Críticos Ativos</span>
          </div>
          <div className="login-holo holo-3">
            <span className="holo-dot green" />
            <span>IA Online</span>
          </div>
          <div className="login-holo holo-4">
            <Brain size={14} />
            <span>Cirila Ativa</span>
          </div>

          {/* Cirila */}
          <img
            src="/cirila_1.png"
            alt="Cirila — Assistente de Regulação"
            className="login-cirila-img"
          />

          {/* Fala da Cirila */}
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

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .login-feature {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          backdrop-filter: blur(8px);
          transition: background 0.25s;
        }

        .login-feature:hover {
          background: rgba(255,255,255,0.07);
        }

        .login-feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .login-feature > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .login-feature strong {
          font-size: 0.9rem;
          color: #e2e8f0;
          font-weight: 700;
        }

        .login-feature span {
          font-size: 0.8rem;
          color: #64748b;
        }

        /* CTA Button */
        .login-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, #00b4d8, #0096c7);
          color: white;
          font-weight: 700;
          font-size: 1rem;
          padding: 1rem 2rem;
          border-radius: 14px;
          text-decoration: none;
          width: fit-content;
          box-shadow: 0 8px 24px rgba(0,180,216,0.35), 0 0 0 1px rgba(0,216,255,0.2);
          transition: all 0.3s ease;
          letter-spacing: 0.02em;
        }

        .login-cta-btn:hover {
          box-shadow: 0 12px 32px rgba(0,180,216,0.5), 0 0 0 1px rgba(0,216,255,0.35);
          transform: translateY(-2px);
          background: linear-gradient(135deg, #00c4ec, #00b4d8);
        }

        .login-footer-text {
          font-size: 0.75rem;
          color: #475569;
          margin: 0;
          line-height: 1.6;
        }

        .login-footer-text a {
          color: #00b4d8;
          text-decoration: none;
        }

        /* ===== RIGHT COLUMN ===== */
        .login-right {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          overflow: hidden;
        }

        .login-cirila-aura {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(ellipse at bottom, rgba(0,180,216,0.25) 0%, rgba(0,180,216,0.08) 40%, transparent 70%);
          pointer-events: none;
        }

        .login-cirila-img {
          position: relative;
          z-index: 2;
          width: 85%;
          max-width: 480px;
          object-fit: contain;
          filter: drop-shadow(0 -10px 40px rgba(0,180,216,0.3)) drop-shadow(0 20px 40px rgba(0,0,0,0.5));
          animation: cirila-float 4s ease-in-out infinite;
        }

        @keyframes cirila-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        /* Elementos holográficos */
        .login-holo {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(8, 20, 35, 0.75);
          border: 1px solid rgba(0,180,216,0.3);
          backdrop-filter: blur(12px);
          color: #e2e8f0;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.5rem 0.9rem;
          border-radius: 10px;
          z-index: 3;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,216,255,0.1);
          animation: holo-pulse 3s ease-in-out infinite;
        }

        @keyframes holo-pulse {
          0%, 100% { opacity: 0.85; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }

        .holo-1 { top: 12%; right: 10%; animation-delay: 0s; }
        .holo-2 { top: 28%; left: 8%; animation-delay: 0.8s; }
        .holo-3 { top: 48%; right: 8%; animation-delay: 1.6s; }
        .holo-4 { top: 64%; left: 10%; animation-delay: 2.4s; }

        .holo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00d8ff;
          box-shadow: 0 0 6px #00d8ff;
          animation: dot-blink 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }

        .holo-dot.green {
          background: #34d399;
          box-shadow: 0 0 6px #34d399;
        }

        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Fala da Cirila */
        .login-cirila-speech {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(8, 20, 35, 0.85);
          border: 1px solid rgba(0,180,216,0.3);
          backdrop-filter: blur(16px);
          padding: 0.85rem 1.25rem;
          border-radius: 16px;
          width: max-content;
          max-width: 90%;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .login-cirila-speech > div {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .login-cirila-speech strong {
          font-size: 0.85rem;
          color: #00d8ff;
          font-weight: 700;
        }

        .login-cirila-speech span {
          font-size: 0.78rem;
          color: #94a3b8;
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
            padding: 3rem 2rem;
          }
        }
      `}</style>
    </div>
  )
}
