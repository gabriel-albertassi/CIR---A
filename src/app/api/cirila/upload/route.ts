import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = '/tmp/uploads';

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── POST: recebe e salva o arquivo ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    ensureDir();

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = crypto.randomUUID();
    const ext = path.extname(file.name) || '.bin';
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, buffer);
    console.log(`[CIRILA_UPLOAD] Arquivo salvo: ${filePath} (${file.size} bytes)`);

    // A URL aponta para GET desta mesma rota, passando fileId como query param
    return NextResponse.json({
      success: true,
      fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'ATTACHED',
      url: `/api/cirila/upload?fileId=${fileId}&ext=${encodeURIComponent(ext)}`,
    });
  } catch (err: any) {
    console.error('[CIRILA_UPLOAD_ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── GET: serve o arquivo salvo para a rota de etiqueta ──────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    const ext = searchParams.get('ext') || '.bin';

    if (!fileId) {
      return new NextResponse('fileId ausente', { status: 400 });
    }

    ensureDir();

    const fileName = `${fileId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const mimeMap: Record<string, string> = {
      '.pdf':  'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc':  'application/msword',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
    };
    const contentType = mimeMap[ext.toLowerCase()] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="upload${ext}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[CIRILA_UPLOAD_GET_ERROR]', err);
    return new NextResponse('Erro interno', { status: 500 });
  }
}
