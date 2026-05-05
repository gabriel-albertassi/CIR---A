import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
  Header,
  HeightRule
} from 'docx';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    
    // Parâmetros opcionais, padrão é o mês/ano atual
    const month = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || now.getFullYear().toString());

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
              top: 720,
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
                    color: "000000",
                    font: "Arial"
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
                    color: "333333",
                    font: "Arial"
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
              new TextRun({ text: "RESUMO DO PERÍODO", bold: true, underline: {}, font: "Arial" }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total de Autorizações: ${keys.length}`, size: 22, font: "Arial" }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Tomografias (TC): ${totalTC}`, size: 22, font: "Arial" }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Ressonâncias (RNM): ${totalRNM}`, size: 22, font: "Arial" }),
            ]
          }),

          new Paragraph({ spacing: { before: 400, after: 200 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                height: { value: 400, rule: HeightRule.ATLEAST },
                children: [
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DATA", bold: true, font: "Arial" })] })] }),
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CHAVE", bold: true, font: "Arial" })] })] }),
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PACIENTE", bold: true, font: "Arial" })] })] }),
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EXAME", bold: true, font: "Arial" })] })] }),
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DESTINO", bold: true, font: "Arial" })] })] }),
                ]
              }),
              ...keys.map(key => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: new Date(key.date).toLocaleDateString('pt-BR'), font: "Arial", size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: key.key, bold: true, font: "Arial", size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: key.patient.toUpperCase(), font: "Arial", size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: key.exam, font: "Arial", size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: key.destination, font: "Arial", size: 18 })] })] }),
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
              new TextRun({ text: "COORDENAÇÃO DE REGULAÇÃO - CIR-A", bold: true, size: 18, font: "Arial" }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, size: 14, color: "666666", font: "Arial" }),
            ]
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=relatorio_mensal_${month}_${year}.docx`,
      },
    });
  } catch (error) {
    console.error('[MONTHLY_REPORT_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório mensal' }, { status: 500 });
  }
}
