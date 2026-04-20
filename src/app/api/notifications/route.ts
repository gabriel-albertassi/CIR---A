import { NextResponse } from 'next/server'
import { getUnreadNotifications } from '@/lib/notifications'

export async function GET() {
  try {
    const notifications = await getUnreadNotifications()
    return NextResponse.json(notifications)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
