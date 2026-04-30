import { NextRequest, NextResponse } from 'next/server';
import * as mammoth from 'mammoth';

// Polyfill para evitar o erro "DOMMatrix is not defined" no ambiente de servidor
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

export async function POST(req: NextRequest) {
  let file: File | null = null;
  
  try {
    const formData = await req.formData();
    file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = '';

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Require padrão que o Turbopack aceita
      const pdf = require('pdf-parse');
      
      // Opção para ignorar renderização visual que causa erros de DOM
      const data = await pdf(buffer, { pagerender: () => "" });
      text = data.text || '';
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.name.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      text = result.value || '';
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'O arquivo parece estar vazio ou não contém texto extraível.' }, { status: 422 });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Erro no processamento de arquivo:', error);
    return NextResponse.json({ 
        error: 'Erro ao processar arquivo: ' + error.message,
        details: error.stack 
    }, { status: 500 });
  }
}
