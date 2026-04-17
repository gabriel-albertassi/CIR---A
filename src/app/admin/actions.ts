'use server'

import { prisma } from '../../lib/db'
import { createClient } from '../../lib/supabase/sb-server'
import { revalidatePath } from 'next/cache'

export async function updateUserPermissions(userId: string, data: {
  role?: 'ADMIN' | 'ADMINISTRATIVO' | 'ENFERMEIRO_AUDITOR' | 'REGULADOR',
  canCancelPatient?: boolean,
  canPrintReports?: boolean
}) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) return { error: 'Não autenticado.' }

  const admin = await prisma.user.findUnique({
    where: { id: currentUser.id }
  })

  if (admin?.role !== 'ADMIN') return { error: 'Acesso negado. Apenas administradores podem gerenciar usuários.' }

  try {
    await prisma.user.update({
      where: { id: userId },
      data
    })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getAllUsers() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) return []

  const admin = await prisma.user.findUnique({
    where: { id: currentUser.id }
  })

  if (admin?.role !== 'ADMIN') return []

  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function deleteUserAction(userId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) return { error: 'Não autenticado.' }

  // 1. Verificar se quem executa é ADMIN
  const admin = await prisma.user.findUnique({
    where: { id: currentUser.id }
  })

  if (admin?.role !== 'ADMIN') {
    return { error: 'Acesso negado. Apenas administradores podem excluir usuários.' }
  }

  // 2. Impedir que o admin se exclua
  if (userId === currentUser.id) {
    return { error: 'Você não pode excluir sua própria conta administrativa.' }
  }

  try {
    // 3. Remover do Prisma (o Auth do Supabase precisará ser removido no painel se não houver service key)
    await prisma.user.delete({
      where: { id: userId }
    })
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    return { error: `Erro ao remover usuário: ${error.message}` }
  }
}
