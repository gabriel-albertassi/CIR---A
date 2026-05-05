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
    const year = parseInt(searchParams.get('year') || now.getFullYear().toString());

    const keys = await prisma.authorizationKey.findMany({
      where: {
        year: year
      },
      orderBy: { created_at: 'asc' }
    });

    // Agrupamento por mês
    const statsByMonth = Array.from({ length: 12 }, (_, i) => {
      const monthKeys = keys.filter(k => k.month === i + 1);
      return {
        month: i + 1,
        total: monthKeys.length,
        tc: monthKeys.filter(k => k.type === 'TC').length,
        rnm: monthKeys.filter(k => k.type === 'RNM').length
      };
    });

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "CIRILA - SISTEMA DE REGULAÇÃO DE SAÚDE", bold: true, size: 24, font: "Arial" }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `RELATÓRIO ANUAL DE AUTORIZAÇÕES - EXERCÍCIO ${year}`, bold: true, size: 20, color: "333333", font: "Arial" }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({ spacing: { before: 400, after: 200 } }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "RESUMO CONSOLIDADO ANUAL", bold: true, underline: {}, font: "Arial" }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total de Autorizações no Ano: ${keys.length}`, size: 22, font: "Arial" }),
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
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MÊS", bold: true, font: "Arial" })] })] }),
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TOTAL", bold: true, font: "Arial" })] })] }),
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TOMOGRAFIA (TC)", bold: true, font: "Arial" })] })] }),
                  new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "RESSONÂNCIA (RNM)", bold: true, font: "Arial" })] })] }),
                ]
              }),
              ...statsByMonth.map(stat => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: monthNames[stat.month-1], font: "Arial" })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: stat.total.toString(), bold: true, font: "Arial" })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: stat.tc.toString(), font: "Arial" })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: stat.rnm.toString(), font: "Arial" })] })] }),
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
        'Content-Disposition': `attachment; filename=relatorio_anual_${year}.docx`,
      },
    });
  } catch (error) {
    console.error('[YEARLY_REPORT_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório anual' }, { status: 500 });
  }
}
