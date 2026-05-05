'use client'

import { useState } from 'react'
import { ALL_HOSPITALS, SEVERITY_LEVELS } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function PatientForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // Log para depuração no frontend
    console.log('Enviando dados para o servidor via API Route...');

    try {
      const response = await fetch('/api/patients/register', {
        method: 'POST',
        body: formData,
      })

      // Tentar converter para JSON independentemente do status
      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.error('Resposta não-JSON recebida:', await response.text());
        throw new Error('O servidor retornou uma resposta inesperada (não-JSON).');
      }
      
      if (response.ok && result.success) {
        console.log('Cadastro realizado com sucesso:', result);
        router.push('/patients');
        router.refresh(); // Garante que a lista seja atualizada
      } else {
        const errorMsg = result.error || 'Erro desconhecido ao cadastrar.';
        console.warn('Erro retornado pela API:', errorMsg);
        alert("Erro ao cadastrar: " + errorMsg);
      }
    } catch (err: any) {
      console.error('Erro crítico no envio do formulário:', err);
      alert("Erro crítico: " + err.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">Nome do Paciente</label>
        <input name="patient" required className="input" placeholder="Ex: João da Silva" />
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
        <select name="hospital" required className="input">
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
          name="file" 
          className="input" 
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          style={{ padding: '8px' }}
        />
        <small style={{ color: 'var(--text-secondary)' }}>
          Limite de 5MB. Este arquivo será enviado automaticamente como anexo nas solicitações de vaga.
        </small>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(234, 179, 8, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.1)' }}>
        <input 
          type="checkbox" 
          name="is_private" 
          id="is_private" 
          style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
        />
        <label htmlFor="is_private" style={{ color: '#fbbf24', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          Paciente possui Convênio / Perfil para Rede Privada
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
        {loading ? 'Salvando...' : 'Cadastrar na Regulação'}
      </button>
    </form>
  )
}
