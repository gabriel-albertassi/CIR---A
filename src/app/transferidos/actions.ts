'use server'

import { prisma } from '../../lib/db'
import { revalidatePath } from 'next/cache'

export async function updateFinalStatus(patientId: string, newStatus: string) {
  try {
    const validStatuses = ['ALTA', 'FALECIMENTO'];
    if (!validStatuses.includes(newStatus)) {
      return { error: 'Status inválido' };
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return { error: 'Paciente não encontrado' };
    }

    await prisma.patient.update({
      where: { id: patientId },
      data: { 
        status: newStatus,
        outcome_date: new Date()
      }
    });

    const statusMap: Record<string, string> = {
      'ALTA': 'Alta Médica',
      'FALECIMENTO': 'Falecimento'
    };

    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'FINAL_STATUS',
        details: `Ocorrência registrada: ${statusMap[newStatus]} em ${new Date().toLocaleDateString('pt-BR')}`
      }
    });

    revalidatePath('/transferidos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function returnToQueue(patientId: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { error: 'Paciente não encontrado' };

    await prisma.patient.update({
      where: { id: patientId },
      data: { 
        status: 'WAITING',
        transfer_date: null,
        outcome_date: null
      }
    });

    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'STATUS_UPDATE',
        details: 'Paciente retornou para a fila de regulação (estorno de transferência).'
      }
    });

    revalidatePath('/transferidos');
    revalidatePath('/patients');
    revalidatePath('/pacientes');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
