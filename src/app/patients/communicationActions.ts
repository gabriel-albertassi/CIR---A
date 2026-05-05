'use server'

import { prisma } from '../../lib/db'
import { HOSPITAL_CONTACTS, PRIVATE_HOSPITALS } from '@/lib/constants'
import { revalidatePath } from 'next/cache'
import { sendHospitalNotification } from '@/lib/mail'

export async function sendEvolutionCharge(patientId: string, originHospital: string, method: 'WHATSAPP' | 'EMAIL') {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { name: true } });
    if (!patient) return { error: 'Paciente não encontrado.' };

    const contact = HOSPITAL_CONTACTS[originHospital];
    if (!contact) return { error: 'Contato do hospital não cadastrado.' };

    await new Promise(resolve => setTimeout(resolve, 500)); // Sim delay

    let whatsappUrl = '';
    const destination = method === 'WHATSAPP' ? contact.phone : contact.email;

    if (method === 'WHATSAPP') {
      const message = encodeURIComponent(`Olá, aqui é a Cirila do Gateway da Regulação CIR-A (+55 24 99961-5198). Solicitamos por favor a atualização da evolução médica e prontuário do paciente: ${patient.name}.`);
      whatsappUrl = `https://wa.me/${contact.phone}?text=${message}`;
    }

    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'STATUS_UPDATE',
        details: `Cobrança automática de evolução iniciada via ${method} para o NIR (${destination})`
      }
    });

    revalidatePath('/');
    revalidatePath('/patients');
    return { success: true, whatsappUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function sendMassBedRequest(
  patientId: string, 
  profile: 'PUBLIC_ONLY' | 'PUBLIC_AND_PRIVATE' | 'PRIVATE_ONLY', 
  severity: string,
  targetHospitals?: string[]
) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { error: 'Paciente não encontrado.' };

    const toEmails: string[] = [];
    const bccEmails: string[] = [];

    // Se houver unidades específicas selecionadas, enviamos apenas para elas
    if (targetHospitals && targetHospitals.length > 0) {
      targetHospitals.forEach(hospitalName => {
        const contact = HOSPITAL_CONTACTS[hospitalName];
        if (contact && contact.email) {
          toEmails.push(contact.email);
        }
      });
    } else {
      // Fallback para lógica de perfil (blast total)
      Object.entries(HOSPITAL_CONTACTS).forEach(([hospitalName, contact]) => {
        if (!contact.email) return; // Pula se não houver e-mail
        
        const isPrivate = PRIVATE_HOSPITALS.includes(hospitalName);
        
        // TRAVA: Só envia para privado se o paciente tiver perfil privado
        if (isPrivate && !patient.is_private) return;

        if (!isPrivate) {
          if (profile !== 'PRIVATE_ONLY') {
            toEmails.push(contact.email);
          }
        } else {
          if (profile === 'PUBLIC_AND_PRIVATE' || profile === 'PRIVATE_ONLY') {
            bccEmails.push(contact.email);
          }
        }
      });
    }

    // Preparar Anexos (Malote + Evolução)
    const attachments = [];
    if (patient.attachment_url) {
      attachments.push({
        filename: patient.attachment_name || 'MALOTE_PACIENTE.pdf',
        path: patient.attachment_url
      });
    }
    if (patient.evolution_url) {
      attachments.push({
        filename: patient.evolution_name || 'EVOLUCAO_MEDICA.pdf',
        path: patient.evolution_url
      });
    }

    // DISPARO REAL PELO SERVIDOR SMTP
    await sendHospitalNotification({
      to: toEmails,
      patientName: patient.name,
      patientId: patient.id,
      severity: patient.severity,
      originHospital: patient.origin_hospital,
      diagnosis: patient.diagnosis,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    await new Promise(resolve => setTimeout(resolve, 1500)); // API delay

    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'REQUEST',
        details: `Disparo automático de solicitação de vaga (${profile}). TO: ${toEmails.length} unids | BCC: ${bccEmails.length} unids.`
      }
    });

    revalidatePath('/');
    revalidatePath('/patients');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getBedRequestWhatsAppUrl(patientId: string, hospitalName: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { name: true, severity: true } });
    if (!patient) return null;

    const contact = HOSPITAL_CONTACTS[hospitalName];
    if (!contact) return null;

    const message = encodeURIComponent(`Olá, aqui é a Cirila do Gateway da Regulação CIR-A (+55 24 99961-5198). Solicitamos vaga para o paciente: ${patient.name} (${patient.severity}). Os dados clínicos oficiais e malote já foram enviados para o NIR por e-mail institucional. Poderiam conferir?`);
    
    return `https://wa.me/${contact.phone}?text=${message}`;
  } catch (error) {
    return null;
  }
}
