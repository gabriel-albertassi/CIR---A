'use server'

import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/sb-server'
import { revalidatePath } from 'next/cache'

import { ActionResult } from '@/lib/action-types'

export async function deletePatientAction(patientId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Não autorizado: Sessão não encontrada.' }
    }

    // Verificar se o usuário é ADMIN no banco de dados
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return { success: false, error: 'Não autorizado: Apenas administradores podem deletar registros.' }
    }

    // Deletar o paciente (os logs serão deletados automaticamente via Cascade no Prisma/DB)
    await prisma.patient.delete({
      where: { id: patientId }
    })

    revalidatePath('/pacientes')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao deletar paciente:', error)
    return { success: false, error: error.message || 'Erro ao deletar paciente' }
  }
}
