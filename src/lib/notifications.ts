'use server'

import { prisma } from '@/lib/db'

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'

/**
 * Cria uma nova notificação no sistema
 */
export async function createNotification(data: {
  title: string;
  message: string;
  type?: NotificationType;
  hospitalId?: string;
  patientId?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        hospital_id: data.hospitalId,
        patient_id: data.patientId,
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

/**
 * Busca notificações não lidas
 */
export async function getUnreadNotifications() {
  try {
    return await prisma.notification.findMany({
      where: { is_read: false },
      orderBy: { created_at: 'desc' },
      include: {
        hospital: true,
        patient: true
      }
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
}

/**
 * Marca uma notificação como lida
 */
export async function markAsRead(id: string) {
  try {
    return await prisma.notification.update({
      where: { id },
      data: { is_read: true }
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return null;
  }
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllAsRead() {
  try {
    return await prisma.notification.updateMany({
      where: { is_read: false },
      data: { is_read: true }
    });
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
    return null;
  }
}
