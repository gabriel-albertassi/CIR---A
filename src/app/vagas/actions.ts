'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveBedAvailability(hospital_name: string, data: {
    cti_masc: number
    cti_fem: number
    clinica_masc: number
    clinica_fem: number
    sem_vagas: boolean
}) {
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
}
