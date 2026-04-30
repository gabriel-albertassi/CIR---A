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
  HeadingLevel,
  BorderStyle,
  TableLayoutType
} from 'docx';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const count = parseInt(searchParams.get('count') || '15'); // Aumentado para 15 por padrão em landscape

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const dateStr = new Date().toLocaleDateString('pt-BR');

  // Definição de larguras de colunas (Total: 100%)
  const columnWidths = [
    12, // DATA / CHAVE
    20, // CLIENTE (PACIENTE)
    15, // DIAGNÓSTICO
    13, // HOSPITAL ORIGEM
    18, // PROCEDIMENTO
    10, // HOSP. DESTINO
    7,  // CNS
    5   // AUDITOR
  ];

  const headers = [
    'DATA / CHAVE', 
    'CLIENTE (PACIENTE)', 
    'DIAGNÓSTICO', 
    'HOSPITAL ORIGEM', 
    'PROCEDIMENTO', 
    'HOSP. DESTINO', 
    'CNS', 
    'AUD'
  ];

  // Estilo comum para células de cabeçalho
  const headerCellStyle = {
    shading: { fill: '0f172a' }, // Slate 900 (Ultra Profissional)
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 50, right: 50 },
  };

  const headerTextStyle = {
    color: 'ffffff',
    bold: true,
    size: 16, // 8pt
    font: 'Segoe UI',
  };

  // Cabeçalho da Tabela
  const headerRow = new TableRow({
    children: headers.map((text, i) => new TableCell({
      ...headerCellStyle,
      width: { size: columnWidths[i], type: WidthType.PERCENTAGE },
      children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ ...headerTextStyle, text: text.toUpperCase() })] 
      })],
    })),
  });

  // Linhas de Dados com altura aumentada para escrita
  const dataRows = Array.from({ length: count }, (_, index) => {
    const key = generateKey();
    const isEven = index % 2 === 0;
    const rowColor = isEven ? 'f8fafc' : 'ffffff';
    
    return new TableRow({
      height: { value: 900, rule: 'atLeast' }, // Altura aumentada para 900 (aprox 1.5cm)
      children: [
        new TableCell({
          shading: { fill: rowColor },
          verticalAlign: VerticalAlign.CENTER,
          width: { size: columnWidths[0], type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({ 
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: dateStr, size: 14, color: '64748b' }),
                new TextRun({ text: `\n${key}`, size: 22, bold: true, color: '2563eb', font: 'Courier New' }) 
              ] 
            }),
          ],
        }),
        ...columnWidths.slice(1).map((width, i) => new TableCell({ 
          shading: { fill: rowColor },
          width: { size: width, type: WidthType.PERCENTAGE },
          children: [] 
        })),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: '0f172a' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '0f172a' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' },
    }
  });

  // Seção de Assinaturas
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BorderStyle.NONE as any,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '________________________________________', color: '94a3b8' }),
                  new TextRun({ text: '\nMÉDICO REGULADOR DE PLANTÃO', bold: true, size: 16, color: '475569' })
                ]
              })
            ]
          }),
          new TableCell({
            children: [
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '________________________________________', color: '94a3b8' }),
                  new TextRun({ text: '\nSUPERVISOR DE REGULAÇÃO', bold: true, size: 16, color: '475569' })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE },
          margin: { top: 500, right: 500, bottom: 500, left: 500 },
        },
      },
      children: [
        // Cabeçalho Premium
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: BorderStyle.NONE as any,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  verticalAlign: VerticalAlign.BOTTOM,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'CIR - A', bold: true, size: 36, color: '0f172a' }),
                        new TextRun({ text: ' CENTRAL INTELIGENTE DE REGULAÇÃO AUTOMATIZADA - SMSVR', size: 14, color: '475569' })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.BOTTOM,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: 'DATA DE EMISSÃO: ', size: 14, color: '64748b' }),
                        new TextRun({ text: dateStr, bold: true, size: 18, color: '0f172a' })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),
        new Paragraph({
          text: 'MAPA DE SUPERVISÃO - SOBREAVISO NOTURNO',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 400 }
        }),
        table,
        new Paragraph({ text: '', spacing: { before: 400 } }),
        signatureTable,
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 400 },
          children: [
            new TextRun({ text: 'Documento gerado automaticamente pelo Sistema Cirila - CIR-A', size: 14, color: '94a3b8', italics: true })
          ]
        })
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });

  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename=sobreaviso_${Date.now()}.docx`,
    },
  });
}

