import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      where: { 
        status: { in: ['WAITING', 'OFFERED'] } 
      },
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json(patients)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
