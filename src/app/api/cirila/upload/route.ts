import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = crypto.randomUUID();
    const fileName = `${fileId}_${file.name}`;
    
    // Garantir que o diretório de uploads existe
    const uploadDir = '/tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    console.log(`[CIRILA_UPLOAD] Arquivo salvo em: ${filePath}`);

    return NextResponse.json({
      success: true,
      fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'ATTACHED',
      url: `/api/cirila/download/${fileId}`
    });
  } catch (err: any) {
    console.error('[CIRILA_UPLOAD_ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
