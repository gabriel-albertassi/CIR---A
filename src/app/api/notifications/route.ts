import { NextResponse } from 'next/server'
import { getUnreadNotifications, syncCentralEmails } from '@/lib/notifications'

export async function GET() {
  try {
    // Tenta sincronizar novos e-mails da central antes de retornar a lista
    await syncCentralEmails()
    
    const notifications = await getUnreadNotifications()
    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('[API Notifications] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

