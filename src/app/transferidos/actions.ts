'use server'

import { prisma } from '../../lib/db'
import { revalidatePath } from 'next/cache'

export async function updateFinalStatus(patientId: string, newStatus: string) {
  try {
    const validStatuses = ['ALTA', 'FALECIMENTO'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: 'Status inválido' };
    }

    return await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw new Error('Paciente não encontrado');

      await tx.patient.update({
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

      await tx.log.create({
        data: {
          patient_id: patientId,
          action: 'FINAL_STATUS',
          details: `Ocorrência registrada: ${statusMap[newStatus]} em ${new Date().toLocaleDateString('pt-BR')}`
        }
      });

      revalidatePath('/transferidos');
      revalidatePath('/');
      return { success: true };
    });
  } catch (error: any) {
    console.error('[UPDATE_FINAL_STATUS_ERROR]', error)
    return { success: false, error: error.message || 'Erro ao atualizar status final' };
  }
}

export async function returnToQueue(patientId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw new Error('Paciente não encontrado');

      await tx.patient.update({
        where: { id: patientId },
        data: { 
          status: 'WAITING',
          transfer_date: null,
          outcome_date: null
        }
      });

      await tx.log.create({
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
    });
  } catch (error: any) {
    console.error('[RETURN_TO_QUEUE_ERROR]', error)
    return { success: false, error: error.message || 'Erro ao retornar para a fila' };
  }
}
