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
} from 'docx';

// ─── Gerador de chaves únicas ────────────────────────────────────────────────

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

// ─── Constantes de layout ─────────────────────────────────────────────────────
// A4 Paisagem: largura total 16838 twips — margens L+R = 400 twips → útil = 16438
const PAGE_W = 16438;

// Proporções das colunas (devem somar 100)
const COL_PCTS = [10, 30, 16, 14, 15, 12, 6, 10]; // ← ajuste de 7% para 10% no AUDITOR (total=113, normalizado abaixo)
const COL_LABELS = [
  'DATA / CHAVE',
  'CLIENTE (PACIENTE)',
  'DIAGNÓSTICO',
  'HOSPITAL ORIGEM',
  'PROCEDIMENTO',
  'PRESTADOR: REDE / PRIVADO',
  'CNS',
  'AUDITOR',
];

// Normalizar para que a soma seja PAGE_W exato
const pctSum = COL_PCTS.reduce((a, b) => a + b, 0);
const COL_WIDTHS = COL_PCTS.map((p, i) => {
  if (i === COL_PCTS.length - 1) {
    // Última coluna recebe o restante para evitar arredondamento
    const usedSoFar = COL_PCTS.slice(0, -1).reduce((acc, pp) => acc + Math.round((pp / pctSum) * PAGE_W), 0);
    return PAGE_W - usedSoFar;
  }
  return Math.round((p / pctSum) * PAGE_W);
});

// Bordas
const BD = BorderStyle.SINGLE;
const BORDERS = {
  top:              { style: BD, size: 4, color: '000000' },
  bottom:           { style: BD, size: 4, color: '000000' },
  left:             { style: BD, size: 4, color: '000000' },
  right:            { style: BD, size: 4, color: '000000' },
  insideHorizontal: { style: BD, size: 4, color: '000000' },
  insideVertical:   { style: BD, size: 4, color: '000000' },
};

// Altura FIXA das linhas de dados — nunca muda
// ~960 twips = ~1,7 cm por linha → ≈ 9 linhas por página A4 paisagem
const ROW_HEIGHT = 960;

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = Math.max(1, Math.min(300, parseInt(searchParams.get('count') || '30')));

    const now         = new Date();
    const dateStr     = now.toLocaleDateString('pt-BR');
    const dateFileStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    const nextKey = makeKeyGenerator();

    // ── Linha de cabeçalho ─────────────────────────────────────────────────────
    const headerRow = new TableRow({
      tableHeader: true,
      cantSplit:   true,
      height: { value: 700, rule: HeightRule.ATLEAST },
      children: COL_LABELS.map((label, i) =>
        new TableCell({
          width: { size: COL_WIDTHS[i], type: WidthType.DXA },
          shading: { fill: '000000', color: '000000', type: 'solid' },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: label, bold: true, size: 18, color: 'FFFFFF', font: 'Arial' }),
              ],
            }),
          ],
        })
      ),
    });

    // ── Linhas de dados ────────────────────────────────────────────────────────
    const dataRows = Array.from({ length: count }, (_, i) => {
      const key  = nextKey();
      const fill = i % 2 === 0 ? 'FFFFFF' : 'EBF5FF';

      const emptyCell = (colIndex: number) =>
        new TableCell({
          width: { size: COL_WIDTHS[colIndex], type: WidthType.DXA },
          shading: { fill, color: fill, type: 'solid' },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
        });

      return new TableRow({
        cantSplit: true,
        height: { value: ROW_HEIGHT, rule: HeightRule.ATLEAST },
        children: [
          // DATA / CHAVE — data cinza em cima, chave azul em baixo
          new TableCell({
            width: { size: COL_WIDTHS[0], type: WidthType.DXA },
            shading: { fill, color: fill, type: 'solid' },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: dateStr, size: 16, color: '555555', font: 'Arial' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: key, bold: true, size: 18, color: '1A56DB', font: 'Arial' })],
              }),
            ],
          }),
          emptyCell(1), // CLIENTE (PACIENTE)
          emptyCell(2), // DIAGNÓSTICO
          emptyCell(3), // HOSPITAL ORIGEM
          emptyCell(4), // PROCEDIMENTO
          emptyCell(5), // PRESTADOR / REDE
          emptyCell(6), // CNS
          emptyCell(7), // AUDITOR
        ],
      });
    });

    // ── Tabela principal ───────────────────────────────────────────────────────
    const table = new Table({
      width: { size: PAGE_W, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: COL_WIDTHS,
      borders: BORDERS,
      rows: [headerRow, ...dataRows],
    });

    // ── Cabeçalho do documento ────────────────────────────────────────────────
    const docTitle = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({ text: 'CIR-A / REGULAÇÃO SMSVR', bold: true, size: 20, font: 'Arial', color: '000000' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({ text: 'MAPA DE SUPERVISÃO - SOBREAVISO', bold: true, size: 26, font: 'Arial', color: '000000' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({ text: `DATA: ${dateStr}`, size: 18, font: 'Arial', color: '000000' }),
        ],
      }),
    ];

    // ── Documento final (seção única) ─────────────────────────────────────────
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { orientation: PageOrientation.LANDSCAPE },
              margin: { top: 1000, bottom: 800, left: 200, right: 200 },
            },
          },
          children: [...docTitle, table],
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

  } catch (err: any) {
    console.error('[SOBREAVISO_ERROR]', err);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'Erro interno ao gerar o documento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
