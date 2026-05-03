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

export async function registerPatient(formData: FormData) {
  try {
    console.log('--- INICIANDO CADASTRO DE PACIENTE ---')
    // Extração segura dos dados
    const name = formData.get('name') as string
    const origin_hospital = formData.get('origin_hospital') as string
    const diagnosis = formData.get('diagnosis') as string
    const severity = formData.get('severity') as string
    const observations = formData.get('observations') as string || null
    const attachment = formData.get('attachment') as File | null
    const is_private = formData.get('is_private') === 'on' || formData.get('is_private') === 'true'

    console.log(`Dados extraídos: ${name}, ${origin_hospital}, ${severity}, Private: ${is_private}`)

    if (!name || !origin_hospital || !diagnosis || !severity) {
      console.warn('Validação falhou: Campos obrigatórios ausentes.')
      throw new Error('Campos obrigatórios faltando: Nome, Hospital, Diagnóstico e Gravidade são necessários.')
    }

    let attachment_url = null
    let attachment_name = null

    // Processo de Upload do Malote (Melhorado com FormData)
    if (attachment && attachment.size > 0) {
      console.log(`Iniciando upload de anexo: ${attachment.name} (${attachment.size} bytes)`)
      try {
        const supabase = await createClient()
        const fileExt = attachment.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('malotes-pacientes')
          .upload(fileName, attachment, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Erro no upload do Supabase:', uploadError)
          throw new Error(`Falha no upload para o Supabase: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('malotes-pacientes')
          .getPublicUrl(fileName)

        attachment_url = publicUrl
        attachment_name = attachment.name
        console.log('Upload concluído com sucesso:', attachment_url)
      } catch (uploadErr: any) {
        console.error('Erro crítico no processo de upload:', uploadErr)
        throw new Error(`Erro no anexo: ${uploadErr.message}`)
      }
    }

    // Verificar duplicidade
    console.log('Verificando duplicidade no banco de dados...')
    const existing = await prisma.patient.findFirst({
      where: {
        name,
        status: { in: ['WAITING', 'OFFERED'] }
      }
    })

    if (existing) {
      console.warn(`Paciente duplicado encontrado: ${name} (ID: ${existing.id})`)
      throw new Error('ATENÇÃO: Este paciente já se encontra ativo na fila de regulação!')
    }

    // Criação no Prisma
    console.log('Gravando paciente no Prisma...')
    const patient = await prisma.patient.create({
      data: {
        name,
        origin_hospital,
        diagnosis,
        severity,
        observations,
        is_private,
        attachment_url,
        attachment_name,
        status: 'WAITING',
      }
    })

    // Log de registro
    console.log(`Registrando log de auditoria para o paciente ${patient.id}...`)
    await prisma.log.create({
      data: {
        patient_id: patient.id,
        action: 'REGISTER',
        details: 'Paciente inserido na fila de regulação via formulário.'
      }
    })

    console.log('CADASTRO CONCLUÍDO COM SUCESSO.')
    revalidatePath('/patients')
    revalidatePath('/')
    
    return { success: true, patientId: patient.id }
  } catch (error: any) {
    console.error('ERRO CRÍTICO EM registerPatient:', error)
    
    // Garantir que o erro seja serializável e amigável
    return { 
      success: false, 
      error: error.message || 'Erro interno ao processar o cadastro. Verifique a conexão com o banco de dados.' 
    }
  }
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
