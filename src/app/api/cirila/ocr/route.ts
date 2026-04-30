import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.type === 'application/pdf') {
      const data = await pdf(buffer);
      text = data.text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.type.startsWith('image/')) {
      // Para imagens, o ideal é processar no cliente com tesseract.js 
      // ou enviar para uma API de OCR externa. 
      // Como tesseract.js é pesado para o servidor sem as libs de sistema, 
      // vamos retornar um aviso para processar no cliente.
      return NextResponse.json({ error: 'Imagens devem ser processadas via OCR no cliente' }, { status: 400 });
    } else {
      text = buffer.toString('utf-8');
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Erro no processamento de arquivo:', error);
    return NextResponse.json({ error: 'Erro ao processar arquivo: ' + error.message }, { status: 500 });
  }
}
