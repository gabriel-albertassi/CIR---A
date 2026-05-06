'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/sb-server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'ADMIN') throw new Error('Acesso restrito a administradores')
  return dbUser
}

export async function getAllHospitals() {
  try {
    await checkAdmin()
    const hospitals = await prisma.hospital.findMany({
      orderBy: { name: 'asc' }
    })
    return { success: true, data: hospitals }
  } catch (error: any) {
    console.error('Error fetching hospitals:', error)
    return { success: false, error: error.message || 'Erro ao buscar hospitais' }
  }
}

export async function upsertHospitalAction(formData: FormData) {
  try {
    await checkAdmin()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const whatsapp = formData.get('whatsapp') as string
    const type = formData.get('type') as string
    const accepts_cti = formData.get('accepts_cti') === 'on'
    const accepts_clinica = formData.get('accepts_clinica') === 'on'

    const data = {
      name,
      email,
      whatsapp,
      type,
      accepts_cti,
      accepts_clinica,
    }

    if (id) {
      await prisma.hospital.update({
        where: { id },
        data,
      })
    } else {
      await prisma.hospital.create({
        data,
      })
    }

    revalidatePath('/admin/hospitals')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteHospitalAction(id: string) {
  try {
    await checkAdmin()
    await prisma.hospital.delete({ where: { id } })
    revalidatePath('/admin/hospitals')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
