'use server'

import { prisma } from '../../lib/db'
import { HOSPITAL_CONTACTS, PRIVATE_HOSPITALS } from '@/lib/constants'
import { revalidatePath } from 'next/cache'

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

    // SIMULATING ACTUAL NODEMAILER DISPATCH
    console.log('--- STARTING EMAIL DISPATCH ---');
    console.log(`TO: ${toEmails.join(', ')}`);
    console.log(`BCC (Hidden Privates): ${bccEmails.join(', ')}`);
    console.log(`SUBJECT: Solicitação de Vaga - ${patient.name}`);
    console.log(`BODY: Segue solicitação de vaga para leito ${severity}. Att, Central de Regulação`);
    console.log('--- EMAIL DISPATCH SUCCESSFUL ---');

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
