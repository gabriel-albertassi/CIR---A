import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('p');
  const hospitalName = searchParams.get('h') || 'Hospital';

  if (!patientId) {
    console.warn('[CONFIRMATION] Parâmetros inválidos ou ausentes.');
    return new NextResponse('Parâmetros inválidos.', { status: 400 });
  }

  try {
    // Registrar o log de confirmação
    await prisma.log.create({
      data: {
        patient_id: patientId,
        action: 'OFFER',
        details: `✅ Recebimento confirmado por: ${hospitalName}`
      }
    });

    // Retorna uma página HTML de sucesso premium
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmado - CIRA</title>
        <style>
          body { font-family: 'Inter', sans-serif; background: #020617; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: rgba(255,255,255,0.05); padding: 3rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); max-width: 400px; }
          h1 { color: #00d8ff; margin-bottom: 1rem; }
          p { color: #94a3b8; line-height: 1.6; }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Recebimento Confirmado!</h1>
          <p>Obrigado! A Central Inteligente de Regulação Automatizada (CIRA) já registrou que sua unidade recebeu o malote do paciente.</p>
          <p style="font-size: 0.8rem; margin-top: 2rem; opacity: 0.5;">Equipe de Regulação SMSVR</p>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (err) {
    return new NextResponse('Erro ao registrar confirmação.', { status: 500 });
  }
}
