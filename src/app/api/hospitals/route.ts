import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(hospitals)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
