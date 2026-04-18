'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, ShieldCheck, Brain, Zap, HeartPulse, ArrowRight, UserPlus, LogIn, Mail, Lock, User } from 'lucide-react'
import { login, signup } from '../auth/actions'
import CirilaAvatar from '@/components/CirilaAvatar'
import Image from 'next/image'
import styles from './login.module.css'

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'confirmed') {
      setMsg('E-mail confirmado com sucesso! Agora você pode acessar o sistema.')
    }
    const err = searchParams.get('error')
    if (err) {
      setError('Houve um problema na autenticação. Tente novamente.')
    }
  }, [searchParams])

  // --- LÓGICA DE "VIDA" DA CIRILA ---
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [expression, setExpression] = useState<'neutral' | 'smiling' | 'thinking' | 'alert'>('neutral')
  const [isTyping, setIsTyping] = useState(false)

  const phrases = useMemo(() => [
    "Olá! Sou a Cirila, sua assistente Jarvis para saúde.",
    "Bom trabalho, Gabriel! Vamos regular o sistema hoje?",
    "Monitorando a rede municipal... Tudo pronto para começar!",
    "Desejo a você um excelente turno de trabalho!",
    "A tecnologia a serviço da vida. Conte sempre comigo.",
    "Foco total na eficiência! Pronto para processar dados."
  ], [])

  // Efeito para rotacionar frases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length)
    }, 9000)
    return () => clearInterval(interval)
  }, [phrases.length])

  // Efeito de Typewriter
  useEffect(() => {
    let charIndex = 0
    setIsTyping(true)
    setDisplayedText('')

    const typeInterval = setInterval(() => {
      if (charIndex < phrases[phraseIndex].length) {
        setDisplayedText(phrases[phraseIndex].substring(0, charIndex + 1))
        charIndex++
      } else {
        setIsTyping(false)
        clearInterval(typeInterval)
      }
    }, 40)

    return () => clearInterval(typeInterval)
  }, [phraseIndex, phrases])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMsg(null)
    setExpression('thinking')

    const formData = new FormData(e.currentTarget)
    
    if (isLogin) {
      const res = await login(formData)
      if (res?.error) {
        setError(res.error)
        setExpression('alert')
        setLoading(false)
        setTimeout(() => setExpression('neutral'), 5000)
      }
    } else {
      const res = await signup(formData)
      if (res?.error) {
        setError(res.error)
        setExpression('alert')
      } else {
        setMsg('Conta criada com sucesso! Seja bem-vindo ao CIR-A.')
        setExpression('smiling')
      }
      setLoading(false)
      setTimeout(() => setExpression('neutral'), 5000)
    }
  }

  return (
    <div className={styles.loginRoot}>
      {/* ── CAMADA DE FUNDO OTIMIZADA ── */}
      <div className={styles.loginBgLayer}>
        <div className={styles.loginBgPhoto} />
        <div className={styles.loginBgOverlay} />
        <div className={styles.loginBgNetwork} />
        <div className={styles.loginBgHex} />
      </div>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div className={styles.loginContent}>

        {/* === COLUNA ESQUERDA — BRANDING === */}
        <div className={styles.loginLeft}>
          <div className={styles.loginLeftInner}>
            
            {/* Bloco de Marca (Logo + Frase unidos, com espaçamento harmônico) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div className={`logo-container-glow ${styles.loginLogoWrapper}`} style={{ marginBottom: '-0.75rem' }}>
                <Image
                  src="/logo.png"
                  alt="CIR-A Logo"
                  width={220}
                  height={70}
                  priority
                  style={{ width: '100%', maxWidth: '220px', height: 'auto', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))' }}
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h1 className={styles.loginTitle} style={{ marginBottom: '1rem' }}> {/* Aumentado o espaço abaixo do nome */}
                  Central Inteligente de<br />
                  <span className={styles.loginTitleAccent}>Regulação Automatizada</span>
                </h1>
                <p className={styles.loginSubtitle} style={{ maxWidth: '240px', margin: '0 auto', opacity: 0.85, lineHeight: '1.5' }}>
                  Tecnologia de última geração a serviço da saúde pública de Volta Redonda.
                </p>
              </div>
            </div>

            {/* FORMULÁRIO DE ACESSO */}
            <div className={styles.loginFormContainer}>
              <div className={styles.formToggleTabs}>
                <button 
                  className={`${styles.tabBtn} ${isLogin ? styles.tabBtnActive : ''}`} 
                  onClick={() => { setIsLogin(true); setError(null); setMsg(null); }}
                >
                  <LogIn size={18} /> Entrar
                </button>
                <button 
                  className={`${styles.tabBtn} ${!isLogin ? styles.tabBtnActive : ''}`} 
                  onClick={() => { setIsLogin(false); setError(null); setMsg(null); }}
                >
                  <UserPlus size={18} /> Criar Conta
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.loginActualForm}>
                {!isLogin && (
                  <div className={styles.inputGroup}>
                    <label><User size={16} /> Nome Completo</label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="Ex: Dr. João Silva" 
                      required 
                      onFocus={() => setExpression('thinking')}
                      onBlur={() => setExpression('neutral')}
                    />
                  </div>
                )}
                <div className={styles.inputGroup}>
                  <label>
                    <Mail size={16} /> E-mail Institucional
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="nome@voltaredonda.rj.gov.br" 
                    required 
                    onFocus={() => setExpression('thinking')}
                    onBlur={() => setExpression('neutral')}
                  />
                </div>

                {!isLogin && (
                  <div className={styles.inputGroup}>
                    <label>
                      <Mail size={16} /> Confirmar E-mail
                    </label>
                    <input 
                      type="email" 
                      name="confirmEmail" 
                      placeholder="Confirme seu e-mail institucional" 
                      required 
                      onFocus={() => setExpression('thinking')}
                      onBlur={() => setExpression('neutral')}
                    />
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>
                    <Lock size={16} /> Senha
                  </label>
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    onFocus={() => setExpression('thinking')}
                    onBlur={() => setExpression('neutral')}
                  />
                </div>

                {!isLogin && (
                  <div className={styles.inputGroup}>
                    <label>
                      <Lock size={16} /> Confirmar Senha
                    </label>
                    <input 
                      type="password" 
                      name="confirmPassword" 
                      placeholder="Confirme sua senha" 
                      required 
                      onFocus={() => setExpression('thinking')}
                      onBlur={() => setExpression('neutral')}
                    />
                  </div>
                )}

                {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
                {msg && <div style={{ color: '#10b981', fontSize: '0.85rem', textAlign: 'center' }}>{msg}</div>}

                <button 
                  type="submit" 
                  className={styles.loginSubmitBtn} 
                  disabled={loading}
                >
                  {loading ? 'Processando...' : (isLogin ? 'Acessar o Sistema' : 'Confirmar Acesso')}
                  <ArrowRight size={18} />
                </button>
              </form>

              <p className={styles.formHelpText}>
                {isLogin 
                  ? 'Utilize suas credenciais institucionais para acessar o painel.' 
                  : 'Preencha os dados acima para criar sua conta de operador.'}
              </p>
            </div>

            {/* Rodapé — Com Badge SMSVR integrada */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', opacity: 0.9 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', color: '#94a3b8' }}>
                  SMSVR • Volta Redonda • Versão 1.5 Premium
                </span>
                <a 
                  href="https://www.instagram.com/gabriel.albertassi" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.loginFooterText}
                  style={{ textDecoration: 'none', color: '#00d8ff', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  Desenvolvido por Gabriel Albertassi
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* === COLUNA DIREITA — CIRILA HERO === */}
        <div className={styles.loginRight}>
          <div className={styles.loginRightContainer}>
            <div className={`${styles.loginHolo} ${styles.holo3}`}>
              <span className={`${styles.holoDot} ${styles.holoDotGreen}`} />
              <span>I.A Online</span>
            </div>
            <div className={`${styles.loginHolo} ${styles.holo4}`}><Brain size={14} /><span>Cirila Ativa</span></div>
            <div className={`${styles.loginHolo} ${styles.holo5}`}><Sparkles size={14} /><span>Conte sempre comigo</span></div>
            <div className={`${styles.loginHolo} ${styles.holo6}`}><HeartPulse size={14} /><span>Sempre pronta para te ajudar</span></div>

            <CirilaAvatar 
              expression={expression} 
              size="35%" 
              className={expression} 
            />

            <div 
              className={`${styles.loginCirilaSpeech} ${isTyping ? styles.typingIcon : ''}`}
              style={{ bottom: '31%' }}
            >
              <Image 
                src="/cirila_3D_icon.png" 
                alt="ícone Cirila" 
                width={36} 
                height={36} 
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,216,255,0.4)' }} 
              />
              <div>
                <strong>Olá! Sou a Cirila.</strong>
                <span>{displayedText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
