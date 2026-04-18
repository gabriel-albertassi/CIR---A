'use client'

import { useState } from 'react'
import { ArrowRight, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { sendPasswordResetAction } from '../actions'
import styles from '../../login/login.module.css'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const res = await sendPasswordResetAction(email)
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginRoot}>
      <div className={styles.loginBgLayer}>
        <div className={styles.loginBgPhoto} />
        <div className={styles.loginBgOverlay} />
        <div className={styles.loginBgNetwork} />
        <div className={styles.loginBgHex} />
      </div>

      <div className={styles.loginContent} style={{ gridTemplateColumns: '1fr', maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loginLeft} style={{ background: 'transparent', backdropFilter: 'none', boxShadow: 'none' }}>
          <div className={styles.loginLeftInner} style={{ maxWidth: '400px' }}>
            
            <div className={styles.loginFormContainer} style={{ width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>Recuperar Senha</h2>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Enviaremos um link de redefinição para o seu e-mail institucional.</p>
              </div>

              {!success ? (
                <form onSubmit={handleSubmit} className={styles.loginActualForm} style={{ width: '100%' }}>
                  <div className={styles.inputGroup}>
                    <label>
                      <Mail size={16} /> E-mail Institucional
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="seu-email@voltaredonda.rj.gov.br" 
                      required 
                    />
                  </div>

                  {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

                  <button 
                    type="submit" 
                    className={styles.loginSubmitBtn} 
                    disabled={loading}
                    style={{ width: '100%', maxWidth: '100%', height: '40px', fontSize: '0.75rem', letterSpacing: '1px' }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Link de Recuperação'}
                    {!loading && <ArrowRight size={18} />}
                  </button>

                  <a 
                    href="/login" 
                    style={{ 
                      marginTop: '1.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      color: '#64748b', 
                      fontSize: '0.85rem', 
                      textDecoration: 'none',
                      alignSelf: 'center'
                    }}
                  >
                    <ArrowLeft size={16} /> Voltar para o Login
                  </a>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.5rem' }}>E-mail Enviado!</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                    Se existir uma conta vinculada ao e-mail informado, você receberá um link para redefinir sua senha em instantes.
                  </p>
                  <a 
                    href="/login" 
                    className={styles.loginSubmitBtn}
                    style={{ textDecoration: 'none', width: '100%', maxWidth: '100%', height: '40px', fontSize: '0.75rem', letterSpacing: '1px' }}
                  >
                    Voltar para o Login
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
