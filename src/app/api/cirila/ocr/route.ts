import { NextRequest, NextResponse } from 'next/server';
import * as mammoth from 'mammoth';

// Polyfill para evitar o erro "DOMMatrix is not defined" no Node.js/Next.js
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Convertendo para Buffer de forma compatível com Next.js
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = '';

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Usando require dinâmico para evitar problemas de build
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      text = data.text || '';
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.name.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer: buffer });
      text = result.value || '';
    } else if (file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Imagens devem ser processadas via OCR no cliente' }, { status: 400 });
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Não foi possível extrair texto legível do arquivo' }, { status: 422 });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Erro no processamento de arquivo:', error);
    return NextResponse.json({ error: 'Erro ao processar arquivo: ' + error.message }, { status: 500 });
  }
}
