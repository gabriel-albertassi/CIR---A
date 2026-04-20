'use server'

import { prisma } from '../../lib/db'
import { revalidatePath } from 'next/cache'

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

import { createClient } from '@/lib/supabase/sb-server'

export async function registerPatient(data: {
  name: string;
  origin_hospital: string;
  diagnosis: string;
  severity: string;
  observations?: string;
  attachment?: File;
}) {
  const supabase = await createClient()
  let attachment_url = null
  let attachment_name = null

  // Processo de Upload do Malote
  if (data.attachment && data.attachment.size > 0) {
    const file = data.attachment
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('malotes-pacientes')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Erro no upload do Supabase:', uploadError)
      throw new Error('Falha ao salvar o malote no servidor. Verifique se o bucket "malotes-pacientes" foi criado.')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('malotes-pacientes')
      .getPublicUrl(fileName)

    attachment_url = publicUrl
    attachment_name = file.name
  }

  const existing = await prisma.patient.findFirst({
    where: {
      name: data.name,
      status: { in: ['WAITING', 'OFFERED'] }
    }
  });

  if (existing) {
    throw new Error('ATENÇÃO: Paciente já se encontra ativo na fila de regulação!');
  }

  const { attachment, ...rest } = data;

  const patient = await prisma.patient.create({
    data: {
      ...rest,
      attachment_url,
      attachment_name,
      status: 'WAITING',
    }
  });

  await prisma.log.create({
    data: {
      patient_id: patient.id,
      action: 'REGISTER',
      details: 'Paciente inserido na fila de regulação.'
    }
  });

  revalidatePath('/patients')
  revalidatePath('/')
  
  return patient;
}

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

export async function attachMedicalEvolution(patientId: string, file: File) {
  try {
    const supabase = await createClient();
    
    // 1. Gerar nome e caminho único para a evolução
    const fileExt = file.name.split('.').pop();
    const fileName = `evolution_${patientId}_${Date.now()}.${fileExt}`;
    const filePath = `evolucoes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('malotes-pacientes')
      .upload(filePath, file);

    if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);

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

    revalidatePath('/patients');
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao anexar evolução:', err);
    return { error: err.message };
  }
}
