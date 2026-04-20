'use server'

import { prisma } from '../../lib/db'
import { HOSPITAL_CONTACTS, PRIVATE_HOSPITALS } from '@/lib/constants'
import { revalidatePath } from 'next/cache'
import { sendHospitalNotification } from '@/lib/mail'

export async function sendEvolutionCharge(patientId: string, originHospital: string, method: 'WHATSAPP' | 'EMAIL') {
  try {
    const contact = HOSPITAL_CONTACTS[originHospital];
    if (!contact) return { error: 'Contato do hospital não cadastrado.' };

    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

    const destination = method === 'WHATSAPP' ? contact.phone : contact.email;

    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'STATUS_UPDATE',
        details: `Cobrança automática de evolução enviada via ${method} para o NIR (${destination})`
      }
    });

    revalidatePath('/');
    revalidatePath('/patients');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function sendMassBedRequest(patientId: string, profile: 'PUBLIC_ONLY' | 'PUBLIC_AND_PRIVATE' | 'PRIVATE_ONLY', severity: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { error: 'Paciente não encontrado.' };

    const toEmails: string[] = [];
    const bccEmails: string[] = [];

    // Separate contacts based on hospital type
    Object.entries(HOSPITAL_CONTACTS).forEach(([hospitalName, contact]) => {
      const isPrivate = PRIVATE_HOSPITALS.includes(hospitalName);
      
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

    // Preparar Anexos (Malote + Evolução)
    const attachments = [];
    if (patient.attachment_url) {
      attachments.push({
        filename: patient.attachment_name || 'malote-paciente.pdf',
        path: patient.attachment_url
      });
    }
    if ((patient as any).evolution_url) {
      attachments.push({
        filename: (patient as any).evolution_name || 'evolucao-medica.pdf',
        path: (patient as any).evolution_url
      });
    }

    // DISPARO REAL PELO SERVIDOR SMTP
    await sendHospitalNotification({
      to: toEmails,
      subject: `[CIRA] Disparo em Massa: ${patient.name}`,
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
