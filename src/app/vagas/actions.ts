'use server'

import { prisma } from '../../lib/db'
import { revalidatePath } from 'next/cache'

export async function saveBedAvailability(hospital_name: string, data: {
    cti_masc: number
    cti_fem: number
    clinica_masc: number
    clinica_fem: number
    sem_vagas: boolean
}) {
    try {
        await prisma.bedAvailability.upsert({
            where: { hospital_name },
            update: data,
            create: {
                hospital_name,
                ...data
            }
        });

        revalidatePath('/vagas')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error('[SAVE_BED_AVAILABILITY_ERROR]', error)
        return { success: false, error: error.message || 'Erro ao salvar disponibilidade de vagas' }
    }
}
