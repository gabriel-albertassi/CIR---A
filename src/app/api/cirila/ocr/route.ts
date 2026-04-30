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

    // PDFs são processados no cliente agora
    if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.name.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      text = result.value || '';
    } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      // Se for PDF enviado por engano ou outro formato, avisamos que deve ser processado no cliente
      return NextResponse.json({ 
        error: 'Este formato deve ser processado no navegador ou não é suportado no servidor.',
        format: file.type 
      }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'O arquivo parece estar vazio ou não contém texto extraível.' }, { status: 422 });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Erro no processamento de arquivo:', error);
    return NextResponse.json({ 
        error: 'Erro ao processar arquivo: ' + error.message
    }, { status: 500 });
  }
}

