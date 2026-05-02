import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  VerticalAlign,
  PageOrientation,
  TextRun,
  BorderStyle,
  TableLayoutType,
  HeightRule,
  convertInchesToTwip,
} from 'docx';

// ─── Chave única ─────────────────────────────────────────────────────────────

function makeKeyGenerator() {
  const used = new Set<string>();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return function (): string {
    let k: string;
    do {
      k = Array.from({ length: 5 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');
    } while (used.has(k));
    used.add(k);
    return k;
  };
}

// ─── Bordas ───────────────────────────────────────────────────────────────────

const BD = BorderStyle;

const TABLE_BORDERS = {
  top:              { style: BD.SINGLE, size: 8,  color: '000000' },
  bottom:           { style: BD.SINGLE, size: 8,  color: '000000' },
  left:             { style: BD.SINGLE, size: 8,  color: '000000' },
  right:            { style: BD.SINGLE, size: 8,  color: '000000' },
  insideHorizontal: { style: BD.SINGLE, size: 4,  color: '000000' },
  insideVertical:   { style: BD.SINGLE, size: 4,  color: '000000' },
};

// ─── Colunas ─────────────────────────────────────────────────────────────────
const COLS = [
  { label: 'DATA / CHAVE',              dxa: 1800 },
  { label: 'PACIENTE',                  dxa: 2800 },
  { label: 'DIAGNÓSTICO',               dxa: 2000 },
  { label: 'HOSPITAL ORIGEM',           dxa: 1800 },
  { label: 'PROCEDIMENTO',              dxa: 2400 },
  { label: 'PRESTADOR: REDE / PRIVADO', dxa: 2200 },
  { label: 'CNS',                       dxa: 1000 },
  { label: 'AUDITOR',                   dxa: 688  },
];

// ─── Cabeçalho da tabela ─────────────────────────────────────────────────────
const HEADER_HEIGHT = 800; // twip

function buildTableHeader(): TableRow {
  return new TableRow({
    tableHeader: true,
    cantSplit: true,
    height: { value: HEADER_HEIGHT, rule: HeightRule.EXACT },
    children: COLS.map((col) =>
      new TableCell({
        width: { size: col.dxa, type: WidthType.DXA },
        shading: { fill: '000000', color: '000000', type: 'solid' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: col.label,
                bold: true,
                size: 16,
                color: 'FFFFFF',
                font: 'Arial',
              }),
            ],
          }),
        ],
      })
    ),
  });
}

// ─── Linha de dados ───────────────────────────────────────────────────────────
function buildDataRow(index: number, dateStr: string, nextKey: () => string, rowHeight: number): TableRow {
  const key  = nextKey();
  const fill = index % 2 === 0 ? 'F2F2F2' : 'FFFFFF';

  const emptyCell = (colIndex: number) =>
    new TableCell({
      width: { size: COLS[colIndex].dxa, type: WidthType.DXA },
      shading: { fill, color: fill, type: 'solid' },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [] })],
    });

  return new TableRow({
    height: { value: rowHeight, rule: HeightRule.EXACT },
    children: [
      new TableCell({
        width: { size: COLS[0].dxa, type: WidthType.DXA },
        shading: { fill, color: fill, type: 'solid' },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `${dateStr} ${key}`, bold: true, size: 18, color: '000000', font: 'Arial' })],
          }),
        ],
      }),
      emptyCell(1),
      emptyCell(2),
      emptyCell(3),
      emptyCell(4),
      emptyCell(5),
      emptyCell(6),
      emptyCell(7),
    ],
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const count = Math.max(1, Math.min(300, parseInt(searchParams.get('count') || '15')));

  const now         = new Date();
  const dateStr     = now.toLocaleDateString('pt-BR');
  const dateFileStr = now.toISOString().slice(0, 10).replace(/-/g, '');

  const PAGE_H     = 11906; // Twips para A4 Paisagem (altura da folha deitada)
  const MARGIN_TB  = 400;   // Margens superior/inferior
  const USABLE_H   = PAGE_H - MARGIN_TB * 2;
  
  // Título (600) + Cabeçalho (800) + margem de segurança (400) = 1800
  // Para preencher a folha com pelo menos 12-14 linhas:
  const displayCount = Math.max(count, 13);
  const rowHeight    = Math.floor((USABLE_H - 1800) / displayCount);

  const nextKey    = makeKeyGenerator();

  const titleRow = new TableRow({
    height: { value: 600, rule: HeightRule.EXACT },
    children: [
      new TableCell({
        columnSpan: 8,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "MAPA DE SUPERVISÃO - SOBREAVISO NOTURNO - SMSVR", bold: true, size: 28, font: "Arial", color: "000000" })]
          })
        ]
      })
    ]
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: COLS.map((c) => c.dxa),
    borders: TABLE_BORDERS,
    rows: [
      titleRow,
      buildTableHeader(),
      ...Array.from({ length: displayCount }, (_, i) => buildDataRow(i, dateStr, nextKey, rowHeight)),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: {
              top:    MARGIN_TB,
              bottom: MARGIN_TB,
              left:   convertInchesToTwip(0.4),
              right:  convertInchesToTwip(0.4),
            },
          },
        },
        children: [mainTable],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Mapa_Sobreaviso_${dateFileStr}.docx"`,
    },
  });
}
