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
  Header,
  Footer,
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
  top:              { style: BD.SINGLE, size: 4, color: '1e3a5f' },
  bottom:           { style: BD.SINGLE, size: 4, color: '1e3a5f' },
  left:             { style: BD.SINGLE, size: 4, color: '1e3a5f' },
  right:            { style: BD.SINGLE, size: 4, color: '1e3a5f' },
  insideHorizontal: { style: BD.SINGLE, size: 1, color: 'b0bec5' },
  insideVertical:   { style: BD.SINGLE, size: 1, color: 'b0bec5' },
};

const NO_BORDERS = {
  top:              { style: BD.NONE, size: 0, color: 'FFFFFF' },
  bottom:           { style: BD.NONE, size: 0, color: 'FFFFFF' },
  left:             { style: BD.NONE, size: 0, color: 'FFFFFF' },
  right:            { style: BD.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BD.NONE, size: 0, color: 'FFFFFF' },
  insideVertical:   { style: BD.NONE, size: 0, color: 'FFFFFF' },
};

// ─── Colunas (DXA total ~10800) ───────────────────────────────────────────────

const COLS = [
  { label: 'DATA / CHAVE',              dxa: 1200 },
  { label: 'CLIENTE (PACIENTE)',         dxa: 2000 },
  { label: 'DIAGNÓSTICO',               dxa: 1500 },
  { label: 'HOSPITAL ORIGEM',           dxa: 1400 },
  { label: 'PROCEDIMENTO',              dxa: 1800 },
  { label: 'PRESTADOR: REDE / PRIVADO', dxa: 1400 },
  { label: 'CNS',                       dxa: 900  },
  { label: 'AUDITOR',                   dxa: 600  },
];

// ─── Cabeçalho de página ─────────────────────────────────────────────────────

function buildHeader(dateStr: string): Header {
  const row = new TableRow({
    children: [
      // Esquerda: identidade
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        verticalAlign: VerticalAlign.BOTTOM,
        children: [
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'CIRILA', bold: true, size: 28, color: '1e3a5f', font: 'Arial' }),
              new TextRun({ text: '  |  REGULAÇÃO MUNICIPAL', size: 18, color: '546e7a', font: 'Arial' }),
            ],
          }),
        ],
      }),
      // Centro: título
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        verticalAlign: VerticalAlign.BOTTOM,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: 'MAPA DE SUPERVISÃO', bold: true, size: 20, color: '1e3a5f', font: 'Arial', allCaps: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'SOBREAVISO NOTURNO', bold: true, size: 16, color: '37474f', font: 'Arial', allCaps: true }),
            ],
          }),
        ],
      }),
      // Direita: data de emissão
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        verticalAlign: VerticalAlign.BOTTOM,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'DATA DE EMISSÃO: ', size: 16, color: '546e7a', font: 'Arial' }),
              new TextRun({ text: dateStr, bold: true, size: 18, color: '1e3a5f', font: 'Arial' }),
            ],
          }),
        ],
      }),
    ],
  });

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      ...NO_BORDERS,
      bottom: { style: BD.SINGLE, size: 4, color: '1e3a5f' },
    },
    rows: [row],
  });

  return new Header({ children: [headerTable, new Paragraph({ spacing: { after: 160 }, children: [] })] });
}

// ─── Rodapé de página ─────────────────────────────────────────────────────────

function buildFooter(dateStr: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: `Emitido em ${dateStr}   |   Documento gerado pelo Sistema Cirila — CIR-A / SMSVR`,
            size: 14,
            color: '90a4ae',
            font: 'Arial',
            italics: true,
          }),
        ],
      }),
    ],
  });
}

// ─── Linha de cabeçalho da tabela ────────────────────────────────────────────

function buildTableHeader(): TableRow {
  return new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: COLS.map((col) =>
      new TableCell({
        width: { size: col.dxa, type: WidthType.DXA },
        shading: { fill: '1e3a5f', color: '1e3a5f', type: 'solid' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: col.label, bold: true, size: 16, color: 'FFFFFF', font: 'Arial' }),
            ],
          }),
        ],
      })
    ),
  });
}

// ─── Linha de dados ───────────────────────────────────────────────────────────

function buildDataRow(index: number, dateStr: string, nextKey: () => string, rowHeight = 780): TableRow {
  const key = nextKey();
  const fill = index % 2 === 0 ? 'EEF2F7' : 'FFFFFF';

  const emptyCell = (colIndex: number) =>
    new TableCell({
      width: { size: COLS[colIndex].dxa, type: WidthType.DXA },
      shading: { fill, color: fill, type: 'solid' },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({ children: [] })],
    });

  return new TableRow({
    height: { value: rowHeight, rule: HeightRule.ATLEAST },
    children: [
      // DATA / CHAVE
      new TableCell({
        width: { size: COLS[0].dxa, type: WidthType.DXA },
        shading: { fill, color: fill, type: 'solid' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [new TextRun({ text: dateStr, size: 14, color: '546e7a', font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: key, bold: true, size: 20, color: '1565c0', font: 'Courier New' })],
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

// ─── Assinaturas ──────────────────────────────────────────────────────────────

function buildSignatures(): Table {
  const signCell = (label: string) =>
    new TableCell({
      borders: NO_BORDERS,
      children: [
        new Paragraph({ spacing: { before: 1200 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '____________________________________________', color: '78909c', font: 'Arial', size: 18 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80 },
          children: [new TextRun({ text: label, bold: true, size: 16, color: '37474f', font: 'Arial', allCaps: true })],
        }),
      ],
    });

  const spacerCell = new TableCell({
    borders: NO_BORDERS,
    width: { size: 20, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [] })],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [signCell('Médico Regulador de Plantão'), spacerCell, signCell('Supervisor de Regulação')],
      }),
    ],
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const count = Math.max(1, Math.min(300, parseInt(searchParams.get('count') || '15')));

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const dateFileStr = now.toISOString().slice(0, 10).replace(/-/g, '');

  const nextKey = makeKeyGenerator();
  const totalDxa = COLS.reduce((s, c) => s + c.dxa, 0);

  // ── Calcula altura das linhas para preencher a folha inteira ──────────────
  // A4 landscape ≈ 11906 twip; margens 0.6+0.6 in = 1728 twip; header ≈ 900 twip
  const AVAILABLE_HEIGHT = 11906 - 1728 - 900;
  const rowsPerPage = count <= 50 ? count : Math.ceil(count / Math.ceil(count / 30));
  const rowHeight = Math.max(400, Math.floor(AVAILABLE_HEIGHT / Math.min(rowsPerPage, count)));

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
              top:    convertInchesToTwip(0.6),
              right:  convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.6),
              left:   convertInchesToTwip(0.5),
              header: convertInchesToTwip(0.3),
              footer: convertInchesToTwip(0.3),
            },
          },
        },
        headers: { default: buildHeader(dateStr) },
        footers: { default: buildFooter(dateStr) },
        children: [
          mainTable,
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          buildSignatures(),
        ],
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
