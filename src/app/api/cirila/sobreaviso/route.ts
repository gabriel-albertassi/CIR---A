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

// ─── Bordas ──────────────────────────────────────────────────────────────────

const THIN_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' };

const TABLE_BORDERS = {
  top:              THIN_BORDER,
  bottom:           THIN_BORDER,
  left:             THIN_BORDER,
  right:            THIN_BORDER,
  insideHorizontal: THIN_BORDER,
  insideVertical:   THIN_BORDER,
};

// ─── Colunas (proporções conforme o modelo) ──────────────────────────────────
// Largura útil A4 paisagem com margens left+right = 200+200 twips ≈ 14688 dxa

const PAGE_WIDTH_DXA = 14688;

const COLS_DEF = [
  { label: 'DATA / CHAVE',             pct: 10 },
  { label: 'CLIENTE (PACIENTE)',        pct: 30 },
  { label: 'DIAGNÓSTICO',              pct: 16 },
  { label: 'HOSPITAL ORIGEM',          pct: 14 },
  { label: 'PROCEDIMENTO',             pct: 15 },
  { label: 'PRESTADOR: REDE /\nPRIVADO', pct: 12 },
  { label: 'CNS',                      pct:  6 },
  { label: 'AUDITOR',                  pct: 10 },
];

const COLS = COLS_DEF.map((c) => ({ ...c, dxa: Math.round((c.pct / 100) * PAGE_WIDTH_DXA) }));
// Ajuste da última coluna para garantir que a soma bata com PAGE_WIDTH_DXA
const sumDxa = COLS.slice(0, -1).reduce((acc, c) => acc + c.dxa, 0);
COLS[COLS.length - 1].dxa = PAGE_WIDTH_DXA - sumDxa;

// ─── Cabeçalho da tabela ──────────────────────────────────────────────────────

function buildTableHeader(): TableRow {
  return new TableRow({
    tableHeader: true,
    cantSplit: true,
    height: { value: 700, rule: HeightRule.ATLEAST },
    children: COLS.map((col) =>
      new TableCell({
        width: { size: col.dxa, type: WidthType.DXA },
        shading: { fill: '000000', color: '000000', type: 'solid' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: col.label.split('\n').reduce((acc: TextRun[], line, i) => {
              if (i > 0) acc.push(new TextRun({ break: 1 }));
              acc.push(new TextRun({ text: line, bold: true, size: 18, color: 'FFFFFF', font: 'Arial' }));
              return acc;
            }, []),
          }),
        ],
      })
    ),
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const count = Math.max(1, Math.min(300, parseInt(searchParams.get('count') || '30')));

  const now         = new Date();
  const dateStr     = now.toLocaleDateString('pt-BR');
  const dateFileStr = now.toISOString().slice(0, 10).replace(/-/g, '');

  // ─── Configuração de paginação com altura FIXA ────────────────────────────
  // A4 paisagem: 11906 twips de altura total
  // Margens top (1000) + bottom (800) = 1800
  // Cabeçalho doc (paragrafos) ≈ 600 twips
  // Cabeçalho tabela = 700 twips
  // Espaço para linhas = 11906 - 1800 - 600 - 700 = 8806 twips
  // 9 linhas: 8806 / 9 ≈ 978 → usamos 960 (valor "round" com margem de segurança)
  const ROWS_PER_PAGE = 9;
  const ROW_HEIGHT    = 960; // twips FIXO — nunca muda independente da quantidade

  const nextKey    = makeKeyGenerator();
  const totalPages = Math.ceil(count / ROWS_PER_PAGE);

  // Pré-gera todas as chaves para garantir unicidade global entre páginas
  const allRows = Array.from({ length: count }, (_, i) => ({
    key:         nextKey(),
    globalIndex: i,
  }));

  // ─── Cabeçalho do documento (repetido em cada página/seção) ──────────────
  const buildDocHeader = () => [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'CIR-A / REGULAÇÃO SMSVR', bold: true, size: 20, font: 'Arial', color: '000000' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'MAPA DE SUPERVISÃO - SOBREAVISO', bold: true, size: 26, font: 'Arial', color: '000000' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `DATA: ${dateStr}`, size: 18, font: 'Arial', color: '000000' }),
      ],
    }),
  ];

  // ─── Configuração de página (reutilizada em todas as seções) ─────────────
  const pageProps = {
    size: { orientation: PageOrientation.LANDSCAPE },
    margin: { top: 1000, bottom: 800, left: 200, right: 200 },
  };

  // ─── Montar seções — UMA seção por página (quebra automática) ────────────
  const sections = Array.from({ length: totalPages }, (_, pageIndex) => {
    const pageRows = allRows.slice(pageIndex * ROWS_PER_PAGE, (pageIndex + 1) * ROWS_PER_PAGE);

    const dataRows = pageRows.map((row) => {
      const fill = row.globalIndex % 2 === 0 ? 'FFFFFF' : 'EBF5FF';

      const emptyCell = (colIndex: number) =>
        new TableCell({
          width: { size: COLS[colIndex].dxa, type: WidthType.DXA },
          shading: { fill, color: fill, type: 'solid' },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ children: [] })],
        });

      return new TableRow({
        height: { value: ROW_HEIGHT, rule: HeightRule.EXACT }, // EXACT = imutável
        children: [
          // Coluna DATA / CHAVE: data acima, chave em azul abaixo
          new TableCell({
            width: { size: COLS[0].dxa, type: WidthType.DXA },
            shading: { fill, color: fill, type: 'solid' },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: dateStr, size: 16, color: '333333', font: 'Arial' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: row.key, bold: true, size: 18, color: '1A56DB', font: 'Arial' })],
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

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: COLS.map((c) => c.dxa),
      borders: TABLE_BORDERS,
      rows: [buildTableHeader(), ...dataRows],
    });

    return {
      properties: { page: pageProps },
      children: [...buildDocHeader(), table],
    };
  });

  const doc = new Document({ sections });
  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Mapa_Sobreaviso_${dateFileStr}.docx"`,
    },
  });
}
