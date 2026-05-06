'use server'

import { prisma } from '../../lib/db'
import { createClient } from '../../lib/supabase/sb-server'
import { revalidatePath } from 'next/cache'

export async function updateUserPermissions(userId: string, data: {
  role?: 'ADMIN' | 'ADMINISTRATIVO' | 'ENFERMEIRO_AUDITOR' | 'REGULADOR',
  canCancelPatient?: boolean,
  canPrintReports?: boolean
}) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { success: false, error: 'Não autenticado.' }

    const admin = await prisma.user.findUnique({
      where: { id: currentUser.id }
    })

    if (admin?.role !== 'ADMIN') return { success: false, error: 'Acesso negado. Apenas administradores podem gerenciar usuários.' }

    await prisma.user.update({
      where: { id: userId },
      data
    })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('[UPDATE_PERMISSIONS_ERROR]', error)
    return { success: false, error: error.message || 'Erro ao atualizar permissões' }
  }
}

export async function getAllUsers() {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { success: false, error: 'Não autenticado.' }

    const admin = await prisma.user.findUnique({
      where: { id: currentUser.id }
    })

    if (admin?.role !== 'ADMIN') return { success: false, error: 'Acesso negado.' }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return { success: true, data: users }
  } catch (error: any) {
    console.error('[GET_ALL_USERS_ERROR]', error)
    return { success: false, error: error.message || 'Erro ao buscar usuários' }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { success: false, error: 'Não autenticado.' }

    // 1. Verificar se quem executa é ADMIN
    const admin = await prisma.user.findUnique({
      where: { id: currentUser.id }
    })

    if (admin?.role !== 'ADMIN') {
      return { success: false, error: 'Acesso negado. Apenas administradores podem excluir usuários.' }
    }

    // 2. Impedir que o admin se exclua
    if (userId === currentUser.id) {
      return { success: false, error: 'Você não pode excluir sua própria conta administrativa.' }
    }

    // 3. Remover do Prisma (o Auth do Supabase precisará ser removido no painel se não houver service key)
    await prisma.user.delete({
      where: { id: userId }
    })
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('[DELETE_USER_ERROR]', error)
    return { success: false, error: `Erro ao remover usuário: ${error.message || 'Erro interno'}` }
  }
}
