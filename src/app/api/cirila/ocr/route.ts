import { NextRequest, NextResponse } from 'next/server';
import * as mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = '';

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Import dinâmico e opções para evitar erro de renderização no servidor
      const pdf = require('pdf-parse/lib/pdf-parse.js');
      
      const options = {
        // Desativa a renderização de páginas para evitar erros de DOM/Canvas no Node
        pagerender: () => ""
      };

      const data = await pdf(buffer, options);
      text = data.text || '';
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.name.toLowerCase().endsWith('.docx')
    ) {
      // Para Word, o ArrayBuffer direto costuma ser mais confiável
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      text = result.value || '';
    } else if (file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Imagens devem ser processadas via OCR no cliente' }, { status: 400 });
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'O arquivo parece estar vazio ou não contém texto extraível.' }, { status: 422 });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Erro no processamento de arquivo:', error);
    // Se o pdf-parse/lib falhar, tentamos o require padrão como fallback
    try {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            const pdfBasic = require('pdf-parse');
            const data = await pdfBasic(Buffer.from(await file.arrayBuffer()));
            return NextResponse.json({ text: data.text.trim() });
        }
    } catch (innerError) {}
    
    return NextResponse.json({ error: 'Erro ao processar arquivo: ' + error.message }, { status: 500 });
  }
}
