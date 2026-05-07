import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ error: 'Chave não fornecida' }, { status: 400 });
    }

    const authKey = await prisma.authorizationKey.findUnique({
      where: { key: key.toUpperCase() }
    });

    if (!authKey) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Chave não encontrada na base institucional.' 
      });
    }

    return NextResponse.json({
      valid: true,
      data: authKey
    });
  } catch (error) {
    console.error('Validation Error:', error);
    return NextResponse.json({ error: 'Erro interno ao validar chave' }, { status: 500 });
  }
}
