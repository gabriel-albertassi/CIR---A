import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

/**
 * Endpoint para simular uma resposta de hospital
 * POST /api/simulate-response
 * Body: { hospitalId, patientId, status: 'ACCEPT' | 'REJECT', message? }
 */
export async function POST(request: Request) {
  try {
    const { hospitalId, patientId, status, message } = await request.json()

    if (!hospitalId || !patientId || !status) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 })
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } })
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })

    if (!hospital || !patient) {
      return NextResponse.json({ error: 'Hospital ou Paciente não encontrado' }, { status: 404 })
    }

    const isAccept = status === 'ACCEPT'
    const title = isAccept ? 'Vaga Confirmada! ✅' : 'Vaga Negada ❌'
    const notificationMessage = message || (isAccept 
      ? `O ${hospital.name} aceitou a transferência do paciente ${patient.name}. Proceder com a logística.`
      : `O ${hospital.name} informou que não possui capacidade técnica momentânea para o paciente ${patient.name}.`)

    // 1. Criar Notificação
    await createNotification({
      title,
      message: notificationMessage,
      type: isAccept ? 'SUCCESS' : 'ALERT',
      hospitalId,
      patientId
    })

    // 2. Se for aceito, atualizar status do paciente para OFFERED ou equivalente
    if (isAccept) {
      await prisma.patient.update({
        where: { id: patientId },
        data: { 
          status: 'OFFERED',
          last_offer_date: new Date()
        }
      })

      // Adicionar log
      await prisma.log.create({
        data: {
          patient_id: patientId,
          action: 'OFFER',
          details: `Vaga confirmada pelo Hospital ${hospital.name} via interação eletrônica.`
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Resposta simulada com sucesso!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
