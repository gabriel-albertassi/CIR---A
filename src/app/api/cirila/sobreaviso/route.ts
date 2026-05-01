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
  top:              { style: BD.SINGLE, size: 6,  color: '1e3a5f' },
  bottom:           { style: BD.SINGLE, size: 6,  color: '1e3a5f' },
  left:             { style: BD.SINGLE, size: 6,  color: '1e3a5f' },
  right:            { style: BD.SINGLE, size: 6,  color: '1e3a5f' },
  insideHorizontal: { style: BD.SINGLE, size: 2,  color: 'b0bec5' },
  insideVertical:   { style: BD.SINGLE, size: 2,  color: 'b0bec5' },
};

// ─── Colunas ─────────────────────────────────────────────────────────────────
// A4 landscape útil ≈ 15840 twip total; margens 0.4in × 2 = 1152 → disponível ≈ 14688 twip

const COLS = [
  { label: 'DATA / CHAVE',              dxa: 1600 },
  { label: 'CLIENTE (PACIENTE)',         dxa: 2800 },
  { label: 'DIAGNÓSTICO',               dxa: 2000 },
  { label: 'HOSPITAL ORIGEM',           dxa: 1900 },
  { label: 'PROCEDIMENTO',              dxa: 2400 },
  { label: 'PRESTADOR: REDE / PRIVADO', dxa: 2000 },
  { label: 'CNS',                       dxa: 1200 },
  { label: 'AUDITOR',                   dxa: 788  },
];
// total = 14688 twip

// ─── Cabeçalho da tabela ─────────────────────────────────────────────────────

const HEADER_HEIGHT = 600; // twip

function buildTableHeader(): TableRow {
  return new TableRow({
    tableHeader: true,
    cantSplit: true,
    height: { value: HEADER_HEIGHT, rule: HeightRule.EXACT },
    children: COLS.map((col) =>
      new TableCell({
        width: { size: col.dxa, type: WidthType.DXA },
        shading: { fill: '1e3a5f', color: '1e3a5f', type: 'solid' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
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
  const fill = index % 2 === 0 ? 'EEF2F7' : 'FFFFFF';

  const emptyCell = (colIndex: number) =>
    new TableCell({
      width: { size: COLS[colIndex].dxa, type: WidthType.DXA },
      shading: { fill, color: fill, type: 'solid' },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [new Paragraph({ children: [] })],
    });

  return new TableRow({
    height: { value: rowHeight, rule: HeightRule.EXACT },
    children: [
      // DATA / CHAVE
      new TableCell({
        width: { size: COLS[0].dxa, type: WidthType.DXA },
        shading: { fill, color: fill, type: 'solid' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 16 },
            children: [new TextRun({ text: dateStr, size: 13, color: '546e7a', font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: key, bold: true, size: 18, color: '1565c0', font: 'Courier New' })],
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

  // ── Dimensões A4 landscape ────────────────────────────────────────────────
  // Largura: 16838 twip | Altura: 11906 twip
  // Margens: top/bottom = 0.4in (576 twip) | left/right = 0.4in (576 twip)
  const PAGE_H     = 11906;
  const MARGIN_TB  = convertInchesToTwip(0.4);   // ~576 twip cada
  const USABLE_H   = PAGE_H - MARGIN_TB * 2;     // ≈ 10754 twip por página

  // Linhas que cabem por página (descontando cabeçalho)
  const rowsPerPage     = Math.floor((USABLE_H - HEADER_HEIGHT) / 500); // mínimo 500 twip/linha
  const totalPages      = Math.ceil(count / rowsPerPage);
  const rowHeight       = Math.floor((USABLE_H - HEADER_HEIGHT) / Math.min(count, rowsPerPage));

  const nextKey    = makeKeyGenerator();
  const totalDxa   = COLS.reduce((s, c) => s + c.dxa, 0);

  const mainTable = new Table({
    width: { size: totalDxa, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: COLS.map((c) => c.dxa),
    borders: TABLE_BORDERS,
    rows: [
      buildTableHeader(),
      ...Array.from({ length: count }, (_, i) => buildDataRow(i, dateStr, nextKey, rowHeight)),
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
