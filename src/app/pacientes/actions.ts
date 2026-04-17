'use server'

import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/sb-server'
import { revalidatePath } from 'next/cache'

export async function deletePatientAction(patientId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Não autorizado: Sessão não encontrada.')
    }

    // Verificar se o usuário é ADMIN no banco de dados
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      throw new Error('Não autorizado: Apenas administradores podem deletar registros.')
    }

    // Deletar o paciente (os logs serão deletados automaticamente via Cascade no Prisma/DB)
    await prisma.patient.delete({
      where: { id: patientId }
    })

    revalidatePath('/pacientes')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao deletar paciente:', error)
    return { success: false, error: error.message }
  }
}
