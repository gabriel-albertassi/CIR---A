import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import JSZip from 'jszip';
import pdf from 'pdf-parse';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  TextRun,
  UnderlineType,
  BorderStyle,
  AlignmentType,
  Header,
  PageOrientation,
  VerticalAlign,
  HeightRule,
  TableLayoutType,
  ImageRun,
  Footer,
} from 'docx';


const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patient = searchParams.get('patient')?.replace(/\+/g, ' ') || 'PACIENTE';
    const professionalKey = searchParams.get('professional')?.toLowerCase() || 'paola';
    const templateUrl = searchParams.get('templateUrl');
    const providedKey = searchParams.get('key');
    const pos = searchParams.get('pos') || 'top';
    const examsRaw = searchParams.get('exam')?.replace(/\+/g, ' ') || 'EXAME';
    const hospitalOrigin = searchParams.get('hospitalOrigin')?.replace(/\+/g, ' ') || 'HOSPITAL ORIGEM';
    const qty = parseInt(searchParams.get('qty') || '1');
    const protocolo = parseInt(searchParams.get('protocolo') || '1');

    const examsList = examsRaw.split(',').map(e => e.trim());
    let finalExams: string[] = [];
    if (examsList.length === 1 && qty > 1) {
      finalExams = Array(qty).fill(examsList[0]);
    } else {
      finalExams = examsList;
    }

    const profMap: Record<string, any> = {
      "paola": { name: "Paola Calderaro Nogueira Leite", registro: "COREN-RJ 88367", cargo: "Enfermeira Supervisora" },
      "inima": { name: "Inimá J. O. Junior", registro: "COREN-RJ 83798", cargo: "Enfermeiro Supervisor" },
      "inimá": { name: "Inimá J. O. Junior", registro: "COREN-RJ 83798", cargo: "Enfermeiro Supervisor" },
      "carlos": { name: "Carlos Roberto Alves", registro: "COREN-RJ 289648", cargo: "Enfermeiro Supervisor / Auditor" },
      "roberto": { name: "Roberto R. Lopes", registro: "COREN-RJ 262240", cargo: "Enfermeiro Supervisor" },
      "sabrina": { name: "Sabrina Silva Ramalho", registro: "COREN-RJ 146764", cargo: "Enfermeira Supervisora" },
      "sabina": { name: "Sabrina Silva Ramalho", registro: "COREN-RJ 146764", cargo: "Enfermeira Supervisora" },
      "barenco": { name: "Dr. Carlos Augusto Barenco", registro: "CRO 11981", cargo: "Supervisor" },
      "rosely": { name: "Rosely Frossard de Andrade", registro: "Mat.1778/PMVR", cargo: "DCRAA/SMSVR" },
      "mazoni": { name: "Dr Marcelo Henrique da Costa Mazoni", registro: "CRM 52-37297-5", cargo: "Médico Supervisor" },
      "gabriel": { name: "Gabriel Albertassi", registro: "DCRAA / SMSVR", cargo: "Coordenador de Regulação" }
    };

    const prof = profMap[professionalKey] || { name: professionalKey.toUpperCase(), registro: "REGISTRO", cargo: "CARGO" };
    const dateStr = new Date().toLocaleDateString('pt-BR');

    const getDestination = (exam: string) => {
      const e = exam.toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (e.includes('ANGIOTC') || e.includes('ANGIO')) return 'HMMR';
      if (e.includes('COLANGIO')) return 'RADIO VIDA';
      if (e.includes('RNM') || e.includes('RMN') ||
        e.includes('RESSONANCIA') || e.includes('RESSON')) return 'RADIO VIDA';
      // PROTOCOLO 2: TC vai para HMMR em vez de HSJB
      if (e.includes('TC') || e.includes('TOMOGRAFIA')) return protocolo === 2 ? 'HMMR' : 'HSJB';
      if (e.includes('ECO') || e.includes('ECOGRAFIA') ||
        e.includes('ECOCARDIOGRAMA')) return 'HSJB';
      if (e.includes('ENDOSCOPIA') || e.includes('COLONOSCOPIA')) return 'HSJB';
      if (e.includes('PET') || e.includes('CINTILOGRAFIA') ||
        e.includes('MAMOGRAFIA') || e.includes('DENSITOMETRIA')) return 'RADIO VIDA';
      return 'HSJB'; // Default institucional
    };

    // --- ETIQUETA INSTITUCIONAL (FORMATO EXATO DO MODELO) ---
    // Formato: bordas pretas, texto esquerda, 3 linhas fixas
    const createLabelTable = (examName: string, authKey: string, destination: string, pName: string, hOrigin: string) => {
      const isAvulsa = examName.toUpperCase().includes('AVULSA');
      const finalExam = isAvulsa ? 'EXAME' : examName.toUpperCase();
      const finalPatient = (isAvulsa ? 'PACIENTE' : pName.toUpperCase()).trim();
      const finalHospital = (isAvulsa ? 'HOSPITAL ORIGEM' : hOrigin.toUpperCase()).trim();
      const labelBorder = { style: BorderStyle.SINGLE, size: 12, color: '000000' };

      return new Table({
        width: { size: 8500, type: WidthType.DXA }, // Ajuste moderado
        alignment: AlignmentType.CENTER,
        layout: TableLayoutType.FIXED,
        borders: {
          top: labelBorder, bottom: labelBorder, left: labelBorder, right: labelBorder,
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                margins: { top: 120, bottom: 120, left: 250, right: 250 }, // Margens moderadas
                children: [
                  // LINHA 1: Nome – Registro – Cargo
                  ...(!isAvulsa ? [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      spacing: { after: 120 }, 
                      children: [
                        new TextRun({
                          text: `${prof.name.toUpperCase()} – ${prof.registro.toUpperCase()} – ${prof.cargo.toUpperCase()}`,
                          bold: true, size: 24, font: { name: 'Arial' }, color: '000000', // Fonte 12pt
                        }),
                      ],
                    }),
                    // LINHA 2: Departamento
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      spacing: { after: 120 },
                      children: [
                        new TextRun({
                          text: 'DEPARTAMENTO, CONTROLE, REGULAÇÃO – AVALIAÇÃO E AUDITORIA – DCRAA – SMSVR',
                          bold: true, size: 20, font: { name: 'Arial' }, color: '000000', // Fonte 10pt
                        }),
                      ],
                    }),
                  ] : []),
                  // LINHA 3: [DATA] : [CHAVE] - [PACIENTE] ...
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 0 },
                    children: [
                      new TextRun({
                        text: `${dateStr} : ${authKey.trim()} - ${finalPatient.trim()} – ${finalHospital.trim()} - ${finalExam.trim()} AUTORIZADO PARA ${destination.toUpperCase().trim()}`,
                        bold: true, size: 24, font: { name: 'Arial' }, color: '000000', // Fonte 12pt
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    };


    const labelElements: any[] = [];

    // Etiquetas Individuais
    finalExams.forEach((examName, index) => {
      const authKey = (index === 0 && providedKey) ? providedKey : generateKey();
      const destination = getDestination(examName);
      labelElements.push(createLabelTable(examName, authKey, destination, patient, hospitalOrigin));
      if (index < finalExams.length - 1) {
        // Espaço entre etiquetas múltiplas
        labelElements.push(new Paragraph({ spacing: { before: 800, after: 800 }, children: [] }));
      }
    });

    // --- PROCESSAMENTO COM ANEXO ---
    if (templateUrl) {
      const absoluteUrl = templateUrl.startsWith('http') ? templateUrl : `${req.nextUrl.origin}${templateUrl}`;
      
      // Cache buster for the template fetch
      const cacheBustedUrl = absoluteUrl.includes('?') 
        ? `${absoluteUrl}&cb=${Date.now()}` 
        : `${absoluteUrl}?cb=${Date.now()}`;

      console.log(`[CIRILA_ETIQUETA] Buscando anexo (Fresh): ${cacheBustedUrl}`);
      
      const response = await fetch(cacheBustedUrl, { cache: 'no-store' });
      if (!response.ok) {
        console.error(`[CIRILA_ETIQUETA_ERROR] Falha ao baixar anexo (${response.status}): ${absoluteUrl}`);
        throw new Error('Falha ao baixar anexo');
      }
      
      const fileBuffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      console.log(`[CIRILA_ETIQUETA] Anexo baixado. Tipo: ${contentType}, Tamanho: ${fileBuffer.length} bytes`);

      const isDocx = contentType.includes('officedocument.wordprocessingml') || templateUrl.toLowerCase().endsWith('.docx');
      const isPdf = contentType.includes('application/pdf') || templateUrl.toLowerCase().endsWith('.pdf');
      const isImage = contentType.includes('image/') || templateUrl.toLowerCase().endsWith('.jpg') || templateUrl.toLowerCase().endsWith('.jpeg') || templateUrl.toLowerCase().endsWith('.png');

      if (isDocx) {
        const templateZip = await JSZip.loadAsync(fileBuffer);
        const templateXml = await templateZip.file("word/document.xml")?.async("string") || "";

        // Gerar XML da etiqueta flutuante
        const tempDoc = new Document({ sections: [{ children: labelElements }] });
        const tempBuffer = await Packer.toBuffer(tempDoc);
        const tempZip = await JSZip.loadAsync(tempBuffer);
        const labelXml = await tempZip.file("word/document.xml")?.async("string") || "";

        const bodyMatch = labelXml.match(/<w:body[^>]*>([\s\S]*?)<\/w:body>/);
        if (bodyMatch) {
          const labelBody = bodyMatch[1].replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/, '');
          let mergedXml = "";
          if (pos === 'bottom') {
            // Em vez de só anexar, tentamos garantir que não haja quebra de página forçada
            mergedXml = templateXml.replace(/<\/w:body>/, `${labelBody}</w:body>`);
          } else {
            mergedXml = templateXml.replace(/(<w:body[^>]*>)/, `$1${labelBody}`);
          }
          templateZip.file("word/document.xml", mergedXml);
          const finalBuffer = await templateZip.generateAsync({ type: 'nodebuffer' });

          return new NextResponse(new Uint8Array(finalBuffer), {
            headers: {
              'Content-Disposition': `attachment; filename="Autorizacao_Cirila_${patient.replace(/\s/g, '_')}.docx"`,
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          });
        }
      } else if (isImage) {
        const mainContent = [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                data: fileBuffer,
                transformation: {
                  width: 400, // Reduzido
                  height: 550, // Reduzido
                },
              } as any),
            ],
          }),
        ];

        const doc = new Document({
          sections: [{
            properties: { 
              page: { 
                margin: { top: 720, right: 720, bottom: 720, left: 720 }, 
              } 
            },
            footers: {
              default: new Footer({
                children: labelElements,
              }),
            },
            children: [
              ...mainContent,
            ]
          }]
        });

        const finalBuffer = await Packer.toBuffer(doc);
        return new NextResponse(new Uint8Array(finalBuffer), {
          headers: {
            'Content-Disposition': `attachment; filename="Autorizacao_Cirila_${patient.replace(/\s/g, '_')}.docx"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        });
      }

    }

    // --- CASO PADRÃO: SEM ANEXO (TEMPLATE VAZIO PARA COLAGEM MANUAL) ---
    // Página 100% limpa conforme solicitado, apenas com a etiqueta no rodapé.
    const emptyParagraphs = [
      new Paragraph({ children: [] })
    ];


    const finalDoc = new Document({
      title: "Etiqueta Cirila",
      creator: "Cirila Bot",
      description: "Etiqueta de Autorização de Exame",
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          },
        },
        footers: {
          default: new Footer({
            children: labelElements,
          }),
        },
        children: [...emptyParagraphs]
      }]
    });


    const buffer = await Packer.toBuffer(finalDoc);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Disposition': `attachment; filename="Etiqueta_${patient.replace(/\s/g, '_')}.docx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (err: any) {
    console.error('[CIRILA_ETIQUETA_ERROR]', err);
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
