'use client'

import { useState } from 'react'
import { ArrowRight, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { updatePasswordAction } from '../actions'
import styles from '../../login/login.module.css'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await updatePasswordAction(formData)
    
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>Nova Senha</h2>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Defina uma nova senha segura para sua conta.</p>
              </div>

              {!success ? (
                <form onSubmit={handleSubmit} className={styles.loginActualForm} style={{ width: '100%' }}>
                  <div className={styles.inputGroup}>
                    <label>
                      <Lock size={16} /> Nova Senha
                    </label>
                    <input 
                      type="password" 
                      name="password" 
                      placeholder="••••••••" 
                      required 
                      minLength={6}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>
                      <Lock size={16} /> Confirmar Nova Senha
                    </label>
                    <input 
                      type="password" 
                      name="confirmPassword" 
                      placeholder="••••••••" 
                      required 
                      minLength={6}
                    />
                  </div>

                  {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

                  <button 
                    type="submit" 
                    className={styles.loginSubmitBtn} 
                    disabled={loading}
                    style={{ width: '100%', maxWidth: '100%' }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Atualizar Senha'}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Senha Atualizada!</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                    Sua senha foi alterada com sucesso. Agora você já pode acessar o sistema com suas novas credenciais.
                  </p>
                  <a 
                    href="/login" 
                    className={styles.loginSubmitBtn}
                    style={{ textDecoration: 'none', width: '100%', maxWidth: '100%' }}
                  >
                    Ir para o Login
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
