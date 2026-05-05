import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  BorderStyle,
  Header,
  Footer,
  ImageRun
} from 'docx';

export async function GET() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const keys = await prisma.authorizationKey.findMany({
      where: {
        month: month,
        year: year
      },
      orderBy: { created_at: 'asc' }
    });

    const totalTC = keys.filter(k => k.type === 'TC').length;
    const totalRNM = keys.filter(k => k.type === 'RNM').length;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch (720 dxa)
              right: 720,
              bottom: 720,
              left: 720,
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "CIRILA - SISTEMA DE REGULAÇÃO DE SAÚDE",
                    bold: true,
                    size: 24,
                    color: "000000"
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `RELATÓRIO MENSAL DE AUTORIZAÇÕES - ${monthNames[month-1].toUpperCase()} / ${year}`,
                    bold: true,
                    size: 20,
                    color: "333333"
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({ spacing: { before: 400, after: 200 } }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "RESUMO DO PERÍODO", bold: true, underline: {} }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total de Autorizações: ${keys.length}`, size: 22 }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Tomografias (TC): ${totalTC}`, size: 22 }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Ressonâncias (RNM): ${totalRNM}`, size: 22 }),
            ]
          }),

          new Paragraph({ spacing: { before: 400, after: 200 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DATA", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CHAVE", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PACIENTE", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "EXAME", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DESTINO", bold: true })] })] }),
                ]
              }),
              ...keys.map(key => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: new Date(key.date).toLocaleDateString('pt-BR') })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: key.key, bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: key.patient })] }),
                  new TableCell({ children: [new Paragraph({ text: key.exam })] }),
                  new TableCell({ children: [new Paragraph({ text: key.destination })] }),
                ]
              }))
            ]
          }),

          new Paragraph({ spacing: { before: 800 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "_______________________________________________", color: "999999" }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "COORDENAÇÃO DE REGULAÇÃO - CIR-A", bold: true, size: 18 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, size: 14, color: "666666" }),
            ]
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=relatorio_cirila_${month}_${year}.docx`,
      },
    });
  } catch (error) {
    console.error('[REPORT_API_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
