'use client'

import { useState } from 'react'
import { registerPatient } from '@/app/patients/actions'
import { ALL_HOSPITALS, SEVERITY_LEVELS } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function PatientForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      await registerPatient({
        name: formData.get('name') as string,
        origin_hospital: formData.get('origin_hospital') as string,
        diagnosis: formData.get('diagnosis') as string,
        severity: formData.get('severity') as string,
        observations: formData.get('observations') as string,
        attachment: formData.get('attachment') as File,
      })
      router.push('/patients')
    } catch (err: any) {
      alert("Erro ao cadastrar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">Nome do Paciente</label>
        <input name="name" required className="input" placeholder="Ex: João da Silva" />
      </div>

      <div>
        <label className="label">Nível de Gravidade</label>
        <select name="severity" required className="input">
          <option value="">Selecione...</option>
          {SEVERITY_LEVELS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <small style={{ color: 'var(--text-secondary)' }}>
          Pacientes do nível Alta ou Crítica contam com restrições de transferência (Ex: HNSG).
        </small>
      </div>

      <div>
        <label className="label">Hospital de Origem (Onde o paciente está)</label>
        <select name="origin_hospital" required className="input">
          <option value="">Selecione...</option>
          {ALL_HOSPITALS.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Diagnóstico Inicial</label>
        <input name="diagnosis" required className="input" placeholder="Ex: Pneumonia aspirativa" />
      </div>
      
      <div>
        <label className="label">Observações Clínicas / Pedido</label>
        <textarea name="observations" className="input" rows={3} placeholder="Detalhes secundários..." />
      </div>

      <div>
        <label className="label">Malote Digital (PDF, Imagens, Documentos)</label>
        <input 
          type="file" 
          name="attachment" 
          className="input" 
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          style={{ padding: '8px' }}
        />
        <small style={{ color: 'var(--text-secondary)' }}>
          Este arquivo será enviado automaticamente como anexo nas solicitações de vaga.
        </small>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
        {loading ? 'Salvando...' : 'Cadastrar na Regulação'}
      </button>
    </form>
  )
}
