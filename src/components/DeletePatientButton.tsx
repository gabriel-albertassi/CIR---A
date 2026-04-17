'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deletePatientAction } from '@/app/pacientes/actions'

interface DeletePatientButtonProps {
  patientId: string
  patientName: string
}

export default function DeletePatientButton({ patientId, patientName }: DeletePatientButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja DELETAR PERMANENTEMENTE o cadastro de "${patientName}"?\n\nEsta ação não poderá ser desfeita.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deletePatientAction(patientId)
      if (!result.success) {
        alert(`Erro ao deletar: ${result.error}`)
      }
    } catch (error) {
      alert('Ocorreu um erro inesperado ao tentar deletar o registro.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#f87171',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: 0.8
      }}
      title="Deletar Cadastro (Apenas Admin)"
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
        e.currentTarget.style.opacity = '1'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'
        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
        e.currentTarget.style.opacity = '0.8'
      }}
    >
      {isDeleting ? (
        <Loader2 size={16} className="animate-spin text-red-400" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  )
}
