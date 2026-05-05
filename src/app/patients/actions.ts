'use server'

import { prisma } from '../../lib/db'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/sb-server'

export async function requestBed(patientId: string, targetHospital: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new Error("Paciente não encontrado");

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      status: 'OFFERED',
      last_offer_date: new Date()
    }
  });

  await prisma.log.create({
    data: {
      patient_id: patientId,
      action: 'REQUEST',
      details: targetHospital
    }
  });

  revalidatePath('/patients')
  revalidatePath('/')
}

export async function registerRefusal(patientId: string, refusingHospital: string, refusalNote?: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new Error("Paciente não encontrado");

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      attempts_count: { increment: 1 }
    }
  });

  let details = refusingHospital;
  if (refusalNote && refusalNote.trim() !== '') {
    details = `${refusingHospital} — Motivo: ${refusalNote.trim()}`;
  }

  await prisma.log.create({
    data: {
      patient_id: patientId,
      action: 'REFUSAL',
      details
    }
  });

  revalidatePath('/patients')
  revalidatePath('/')
}

export async function transferPatient(patientId: string, destination_hospital: string) {
  await prisma.patient.update({
    where: { id: patientId },
    data: { 
      status: 'TRANSFERRED',
      transfer_date: new Date()
    }
  });

  await prisma.log.create({
    data: {
      patient_id: patientId,
      action: 'TRANSFER',
      details: destination_hospital
    }
  });

  revalidatePath('/patients')
  revalidatePath('/')
}

export async function cancelPatient(patientId: string, reason: string, exitType: 'ALTA_MEDICA' | 'OBITO' | 'OUTRO' = 'OUTRO') {
  if (!reason || reason.trim() === "") throw new Error("Motivo é obrigatório.");

  const now = new Date();
  const dateStr = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  await prisma.patient.update({
    where: { id: patientId },
    data: { 
      status: 'CANCELLED',
      outcome_date: now,
    }
  });

  const exitLabel = exitType === 'ALTA_MEDICA' ? '✅ Alta Médica' : exitType === 'OBITO' ? '☠️ Óbito' : 'Outro';

  await prisma.log.create({
    data: {
      patient_id: patientId,
      action: 'CANCEL',
      details: `${exitLabel} em ${dateStr}. Motivo: ${reason.trim()}`
    }
  });

  revalidatePath('/patients')
  revalidatePath('/')
}

// registerPatient foi movido para API Route /api/patients/register para maior robustez com anexos.


export async function evolvePatient(patientId: string, newSeverity: string, newDiagnosis?: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) return { error: 'Paciente não encontrado' }

    const oldSeverity = patient.severity
    const updateData: any = { severity: newSeverity }
    
    if (newDiagnosis && newDiagnosis.trim() !== '') {
      updateData.diagnosis = newDiagnosis.trim()
    }

    await prisma.patient.update({
      where: { id: patientId },
      data: updateData
    })

    let details = `Gravidade alterada de ${oldSeverity} para ${newSeverity}.`;
    if (newDiagnosis && newDiagnosis.trim() !== '') {
      details += ` Diagnóstico atualizado: ${newDiagnosis.trim()}.`;
    }

    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'EVOLVE',
        details
      }
    });

    revalidatePath('/patients')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function attachMedicalEvolution(formData: FormData) {
  const patientId = formData.get('patientId') as string;
  const file = formData.get('file') as File;

  if (!patientId || !file) {
    return { error: 'Dados incompletos para o anexo.' };
  }

  // Validação de tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'O arquivo excede o limite de 5MB.' };
  }

  try {
    const supabase = await createClient();
    
    // 1. Gerar nome e caminho único para a evolução
    const fileExt = file.name.split('.').pop();
    const fileName = `evolution_${patientId}_${Date.now()}.${fileExt}`;
    const filePath = `evolucoes/${fileName}`;

    console.log(`[ATTACH_EVOLUTION] Iniciando upload: ${fileName} (${file.size} bytes)`);

    const { error: uploadError } = await supabase.storage
      .from('malotes-pacientes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[ATTACH_EVOLUTION] Erro no Supabase Storage:', uploadError);
      throw new Error(`Falha no upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('malotes-pacientes')
      .getPublicUrl(filePath);

    // 2. Atualizar o paciente com o novo anexo de evolução
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        evolution_url: publicUrl,
        evolution_name: file.name
      }
    });

    // 3. Registrar no histórico do paciente
    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'STATUS_UPDATE',
        details: `📄 Nova evolução médica anexada: ${file.name}`
      }
    });

    console.log(`[ATTACH_EVOLUTION] Sucesso para o paciente ${patientId}: ${publicUrl}`);

    revalidatePath('/patients');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('[ATTACH_EVOLUTION] Erro crítico:', err);
    return { error: err.message || 'Erro interno ao processar anexo.' };
  }
}

export async function togglePatientPrivateProfile(patientId: string, currentStatus: boolean) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { is_private: !currentStatus }
    });

    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'STATUS_UPDATE',
        details: `Perfil de atendimento alterado para: ${!currentStatus ? '💎 PRIVADO/CONVÊNIO' : '🏥 REDE PÚBLICA (SUS)'}`
      }
    });

    revalidatePath('/patients');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
