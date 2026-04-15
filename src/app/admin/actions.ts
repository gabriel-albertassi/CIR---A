'use server'

import { prisma } from '../../lib/prisma'
import { createClient } from '../../lib/supabase/server'
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
