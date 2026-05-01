import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, readFileSync, existsSync } from 'fs';
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
  BorderStyle,
  AlignmentType,
  Footer,
  Header,
  ImageRun,
  TableLayoutType,
  PageOrientation,
  VerticalAlign,
  HeightRule
} from 'docx';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get('patient')?.replace(/\+/g, ' ') || 'PACIENTE';
  const professionalKey = searchParams.get('professional')?.toLowerCase() || 'paola';
  const templateId = searchParams.get('templateId');
  const providedKey = searchParams.get('key');
  
  // Suporte a múltiplos exames (separados por vírgula) ou quantidade
  const examsRaw = searchParams.get('exam')?.replace(/\+/g, ' ') || 'EXAME';
  const qty = parseInt(searchParams.get('qty') || '1');
  
  const examsList = examsRaw.split(',').map(e => e.trim());
  
  // Se houver apenas um exame mas qty > 1 (Modo Lote)
  let finalExams: string[] = [];
  if (examsList.length === 1 && qty > 1) {
    finalExams = Array(qty).fill(examsList[0]);
  } else {
    finalExams = examsList;
  }

  // --- MAPA DE PROFISSIONAIS ---
  const profMap: Record<string, any> = {
    "paola": { name: "Paola Calderaro Nogueira Leite", registro: "COREN-RJ 88367", cargo: "Enfermeira Supervisora" },
    "inima": { name: "Inimá J. O. Junior", registro: "COREN-RJ 83798", cargo: "Enfermeiro Supervisor" },
    "inimá": { name: "Inimá J. O. Junior", registro: "COREN-RJ 83798", cargo: "Enfermeiro Supervisor" },
    "carlos": { name: "Carlos Roberto Alves", registro: "COREN-RJ 289648", cargo: "Enfermeiro Supervisor / Auditor" },
    "roberto": { name: "Roberto R. Lopes", registro: "COREN-RJ 262240", cargo: "Enfermeiro Supervisor" },
    "sabrina": { name: "Sabrina Silva Ramalho", registro: "COREN-RJ 146764", cargo: "Enfermeira Supervisora" },
    "sabina": { name: "Sabrina Silva Ramalho", registro: "COREN-RJ 146764", cargo: "Enfermeira Supervisora" },
    "barenco": { name: "Dr. Carlos Augusto Barenco", registro: "CRO 11981", cargo: "Supervisor" },
    "dr. barenco": { name: "Dr. Carlos Augusto Barenco", registro: "CRO 11981", cargo: "Supervisor" },
    "rosely": { name: "Rosely Frossard de Andrade", registro: "Mat.1778/PMVR", cargo: "DCRAA/SMSVR" },
    "mazoni": { name: "Dr Marcelo Henrique da Costa Mazoni", registro: "CRM 52-37297-5", cargo: "Médico Supervisor" }
  };

  const prof = profMap[professionalKey] || {
    name: professionalKey.toUpperCase(),
    registro: "REGISTRO",
    cargo: "CARGO"
  };
  const departamento = "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR";

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const getDestination = (exam: string) => {
    const e = exam.toUpperCase();
    if (e.includes('ANGIOTC')) return "HMMR";
    if (e.includes('COLANGIO')) return "RADIO VIDA";
    if (e.includes('TC') || e.includes('TOMOGRAFIA')) return "HSJB";
    if (e.includes('RNM') || e.includes('RESSONANCIA')) return "RADIO VIDA";
    return "HOSPITAL DESTINO";
  };

  const dateStr = new Date().toLocaleDateString('pt-BR');

  // --- FUNÇÃO PARA CRIAR A ETIQUETA (REUTILIZÁVEL) ---
  const createLabelTable = (examName: string, authKey: string, destination: string, pName: string) => {
    const isAvulsa = examName.toUpperCase() === 'AVULSA';
    const finalExam = isAvulsa ? "EXAME A SER PREENCHIDO" : examName.toUpperCase();
    const finalPatient = pName === 'SOBREAVISO' || pName === 'AVULSA' || pName === 'ETIQUETA AVULSA' ? "PACIENTE A SER PREENCHIDO" : pName.toUpperCase();

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 25, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 25, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 25, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 25, color: "000000" },
              },
              margins: { top: 250, bottom: 250, left: 400, right: 400 },
              children: [
                // LINHA 1: [NOME – REGISTRO – CARGO]
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ 
                      text: `${prof.name} – ${prof.registro} – ${prof.cargo}`, 
                      bold: true, 
                      size: 24, 
                      font: "Arial", 
                      underline: { type: "single" } 
                    })
                  ]
                }),
                // LINHA 2: Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                  children: [
                    new TextRun({ 
                      text: "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR", 
                      bold: true, 
                      size: 22, 
                      font: "Arial" 
                    })
                  ]
                }),
                // LINHA 3: [DATA] : [CHAVE] - [PACIENTE] - [EXAME] AUTORIZADO PARA [DESTINO]
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 150 },
                  children: [
                    new TextRun({ text: `${dateStr} : `, bold: true, size: 26, font: "Arial", color: "0000FF" }),
                    new TextRun({ text: authKey, bold: true, size: 30, font: "Arial", color: "FF0000" }),
                    new TextRun({ 
                      text: ` - ${finalPatient} - ${finalExam} AUTORIZADO PARA ${destination}`, 
                      bold: true, 
                      size: 24, 
                      color: "0000FF", 
                      font: "Arial" 
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  };

  // --- PREPARAÇÃO DO CONTEÚDO ---
  const labelElements: any[] = [];
  const isSobreaviso = patient.toUpperCase() === 'SOBREAVISO' || qty > 1;

  let pageHeader: any = null;
  if (isSobreaviso) {
    pageHeader = new Header({
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2 },
            bottom: { style: BorderStyle.SINGLE, size: 2 },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "CIR-A / REGULAÇÃO SMSVR", bold: true, size: 20, font: "Arial" })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: `DATA DE EMISSÃO: ${dateStr}`, bold: true, size: 20, font: "Arial" })] 
                  })]
                }),
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 300 },
          children: [new TextRun({ text: "MAPA DE SUPERVISÃO - SOBREAVISO NOTURNO", bold: true, size: 28, font: "Arial" })]
        })
      ]
    });

    const headers = [
      { text: "DATA / CHAVE", width: 12 },
      { text: "CLIENTE (PACIENTE)", width: 20 },
      { text: "DIAGNÓSTICO", width: 15 },
      { text: "HOSPITAL ORIGEM", width: 12 },
      { text: "PROCEDIMENTO", width: 15 },
      { text: "PRESTADOR / REDE", width: 12 },
      { text: "CNS", width: 7 },
      { text: "AUD", width: 7 }
    ];

    const tableRows = finalExams.map((examName, index) => {
      const authKey = (index === 0 && providedKey) ? providedKey : generateKey();
      const isManualFill = patient.toUpperCase() === 'SOBREAVISO';
      
      return new TableRow({
        height: { value: 800, rule: HeightRule.ATLEAST }, // Altura maior para preenchimento manual
        children: [
          new TableCell({ 
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${dateStr} ${authKey}`, bold: true, size: 18, font: "Arial" })] })] 
          }),
          new TableCell({ children: [new Paragraph({ text: "" })] }), 
          new TableCell({ children: [new Paragraph({ text: "" })] }), 
          new TableCell({ 
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isManualFill ? "" : "SMC", size: 18, font: "Arial" })] })] 
          }),
          new TableCell({ 
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isManualFill ? "" : examName.toUpperCase(), bold: !isManualFill, size: 16, font: "Arial" })] })] 
          }),
          new TableCell({ 
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isManualFill ? "" : getDestination(examName), bold: !isManualFill, size: 18, font: "Arial" })] })] 
          }),
          new TableCell({ children: [new Paragraph({ text: "" })] }),
          new TableCell({ children: [new Paragraph({ text: "" })] }),
        ]
      });
    });

    labelElements.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map(h => new TableCell({
            width: { size: h.width, type: WidthType.PERCENTAGE },
            shading: { fill: "002060" },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ 
              alignment: AlignmentType.CENTER, 
              children: [new TextRun({ text: h.text, bold: true, size: 18, color: "FFFFFF", font: "Arial" })] 
            })]
          }))
        }),
        ...tableRows
      ]
    }));

    labelElements.push(new Paragraph({ text: "", spacing: { before: 800 } }));
    labelElements.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_______________________________________", size: 20 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MÉDICO REGULADOR DE PLANTÃO", bold: true, size: 18, font: "Arial" })] })
              ]
            }),
            new TableCell({
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_______________________________________", size: 20 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SUPERVISOR DE REGULAÇÃO", bold: true, size: 18, font: "Arial" })] })
              ]
            }),
          ]
        })
      ]
    }));
  } else {
    // Layout de Etiquetas Individuais
    finalExams.forEach((examName, index) => {
      const authKey = (index === 0 && providedKey) ? providedKey : generateKey();
      const destination = getDestination(examName);
      labelElements.push(createLabelTable(examName, authKey, destination, patient));
      if (index < finalExams.length - 1) {
        labelElements.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));
      }
    });
  }

  // --- LÓGICA DE DOCUMENTO COM ANEXO ---
  if (templateId) {
    try {
      const uploadDir = join(process.cwd(), 'tmp', 'uploads');
      const files = existsSync(uploadDir) ? readdirSync(uploadDir) : [];
      const templateFile = files.find(f => f.startsWith(templateId));

      if (templateFile) {
        const templatePath = join(uploadDir, templateFile);
        const fileBuffer = readFileSync(templatePath);

        // --- CASO 1: TEMPLATE É WORD (.DOCX) ---
        if (templateFile.endsWith('.docx')) {
          const templateZip = await JSZip.loadAsync(fileBuffer);
          const templateXml = await templateZip.file("word/document.xml")?.async("string") || "";

          // Gerar XML da etiqueta
          const tempDoc = new Document({ sections: [{ children: labelElements }] });
          const tempBuffer = await Packer.toBuffer(tempDoc);
          const tempZip = await JSZip.loadAsync(tempBuffer);
          const labelXml = await tempZip.file("word/document.xml")?.async("string") || "";
          
          const bodyMatch = labelXml.match(/<w:body>([\s\S]*?)(?:<w:sectPr|<\/w:body>)/);
          if (bodyMatch && bodyMatch[1]) {
            let labelBody = bodyMatch[1];
            // Spacer simples sem linha para não poluir
            const spacer = '<w:p><w:pPr><w:spacing w:before="400" w:after="400"/></w:pPr></w:p>';
            
            // Inserir no TOPO (logo após <w:body>) de forma robusta
            const mergedXml = templateXml.replace(/(<w:body[^>]*>)/, `$1${labelBody}${spacer}`);
            
            templateZip.file("word/document.xml", mergedXml);
            const finalBuffer = await templateZip.generateAsync({ type: 'nodebuffer' });

            return new NextResponse(finalBuffer as any, {
              headers: {
                'Content-Disposition': `attachment; filename="Autorizacao_Cirila_${patient.replace(/\s/g, '_')}.docx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              },
            });
          }
        } 
        
        // --- CASO 2: TEMPLATE É PDF (.PDF) OU IMAGEM (.PNG, .JPG) ---
        else {
          let mainContent: any[] = [];
          
          if (templateFile.toLowerCase().endsWith('.pdf')) {
            const data = await pdf(fileBuffer);
            const pdfText = data.text.trim();
            mainContent = pdfText.length > 0 
              ? pdfText.split('\n').map(line => new Paragraph({
                  children: [new TextRun({ text: line, size: 20, font: "Arial" })]
                }))
              : [new Paragraph({ children: [new TextRun({ text: "[CONTEÚDO DO PDF PRESERVADO NO ORIGINAL]", italics: true })] })];
          } else if (['.png', '.jpg', '.jpeg'].some(ext => templateFile.toLowerCase().endsWith(ext))) {
            mainContent = [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: fileBuffer as Buffer,
                    transformation: { width: 500, height: 400 },
                  } as any),
                ],
              }),
            ];
          }

          const doc = new Document({
            sections: [{
              properties: { 
                page: {
                  margin: { top: 720, right: 720, bottom: 720, left: 720 }
                }
              },
              children: [
                ...labelElements, // ETIQUETA NO TOPO
                new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }), // Espaçador
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "------------------- DOCUMENTO ORIGINAL ABAIXO -------------------", bold: true, color: "999999", size: 16 })]
                }),
                ...mainContent,
              ]
            }]
          });

          const finalBuffer = await Packer.toBuffer(doc);
          return new NextResponse(finalBuffer as any, {
            headers: {
              'Content-Disposition': `attachment; filename="Cirila_Doc_Autorizado_${patient.replace(/\s/g, '_')}.docx"`,
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          });
        }
      }
    } catch (err) {
      console.error('[CIRILA_FILE_ERROR]', err);
    }
  }

  // --- CASO PADRÃO: SEM ANEXO (ETIQUETA AVULSA / SOBREAVISO) ---
  const finalDoc = new Document({
    sections: [{
      headers: pageHeader ? { default: pageHeader } : undefined,
      properties: { 
        page: {
          margin: { top: isSobreaviso ? 1600 : 720, right: 720, bottom: 1200, left: 720 }
        },
        ...(isSobreaviso ? { size: { orientation: PageOrientation.LANDSCAPE } } : {})
      },
      children: isSobreaviso 
        ? labelElements 
        : [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  height: { value: 11000, rule: HeightRule.ATLEAST }, // Aumentado para empurrar mais pro rodapé
                  children: [
                    new TableCell({
                      verticalAlign: VerticalAlign.BOTTOM,
                      children: labelElements
                    })
                  ]
                })
              ]
            })
          ]
    }]
  });

  const buffer = await Packer.toBuffer(finalDoc);
  return new NextResponse(buffer as any, {
    headers: {
      'Content-Disposition': `attachment; filename="${isSobreaviso ? 'Planilha_Sobreaviso' : 'Etiqueta_Avulsa'}_${patient.replace(/\s/g, '_')}.docx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  });
}
