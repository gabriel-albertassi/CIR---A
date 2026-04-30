import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, VerticalAlign } from 'docx';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const count = parseInt(searchParams.get('count') || '10');

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const dateStr = new Date().toLocaleDateString('pt-BR');

  // Cabeçalho da Tabela
  const headerRow = new TableRow({
    children: [
      'DATA E CHAVE', 'CLIENTE', 'DIAGNOSTICO', 'HOSPITAL DE ORIGEM', 
      'PROCEDIMENTO SOLICITADO', 'PRESTADOR DA REDE OU PRIVADO', 'CNS', 'AUDITOR'
    ].map(text => new TableCell({
      children: [new Paragraph({ text, alignment: AlignmentType.CENTER })],
      shading: { fill: 'E2E8F0' },
      verticalAlign: VerticalAlign.CENTER,
    })),
  });

  // Linhas de Dados
  const dataRows = Array.from({ length: count }, () => {
    const key = generateKey();
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ text: `Data: ${dateStr}` }),
            new Paragraph({ text: `Chave: ${key}` }),
          ],
        }),
        ...Array.from({ length: 7 }, () => new TableCell({ children: [] })),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: 'PLANILHA DE PROCEDIMENTOS AUTORIZADOS - SUPERVISÃO SOBRE AVISO',
          heading: 'Heading1',
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }), // Espaçamento
        table,
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename=sobreaviso_${Date.now()}.docx`,
    },
  });
}
