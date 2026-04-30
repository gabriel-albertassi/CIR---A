import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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
  PageNumber,
  NumberFormat
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

  // --- MAPA DE PROFISSIONAIS (ATUALIZADO) ---
  const profMap: Record<string, any> = {
    "paola": { "full": "Paola Calderaro Nogueira Leite – COREN-RJ 88367 – Enfermeira Supervisora" },
    "inima": { "full": "Inimá J. O. Junior – COREN-RJ 83798 – Enfermeiro Supervisor" },
    "inimá": { "full": "Inimá J. O. Junior – COREN-RJ 83798 – Enfermeiro Supervisor" },
    "carlos": { "full": "Carlos Roberto Alves – COREN-RJ 289648 – Enfermeiro Supervisor / Auditor" },
    "roberto": { "full": "Roberto R. Lopes – COREN-RJ 262240 – Enfermeiro Supervisor" },
    "sabrina": { "full": "Sabrina Silva Ramalho – COREN-RJ 146764 – Enfermeira Supervisora" },
    "barenco": { "full": "Dr. Carlos Augusto Barenco – CRO 11981 – Supervisor" },
    "dr. barenco": { "full": "Dr. Carlos Augusto Barenco – CRO 11981 – Supervisor" },
    "rosely": { "full": "Rosely Frossard de Andrade – Mat.1778/PMVR – DCRAA/SMSVR" },
    "mazoni": { "full": "Dr Marcelo Henrique da Costa Mazoni – CRM 52-37297-5 – Médico Supervisor" }
  };

  const prof = profMap[professionalKey] || {
    full: `${professionalKey.toUpperCase()} – REGISTRO – CARGO`
  };
  const departamento = "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR";

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const dateStr = new Date().toLocaleDateString('pt-BR');

  // --- FUNÇÃO PARA CRIAR A ETIQUETA (REUTILIZÁVEL) ---
  const createLabelTable = (examName: string, authKey: string, destination: string) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              },
              margins: { top: 150, bottom: 150, left: 150, right: 150 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: prof.full, bold: true, size: 22, font: "Arial" })]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120 },
                  children: [new TextRun({ text: departamento, bold: true, size: 22, font: "Arial" })]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: `CHAVE DE ACESSO: `, bold: true, size: 24, font: "Arial", color: "1e293b" }),
                    new TextRun({ text: authKey, bold: true, size: 32, font: "Courier New", color: "b91c1c" })
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 120 },
                  children: [
                    new TextRun({ text: `${dateStr} - `, bold: true, size: 22, font: "Arial" }),
                    new TextRun({ text: `${patient.toUpperCase()}`, bold: true, size: 22, font: "Arial" })
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: `${examName.toUpperCase()} - `, bold: true, size: 22, font: "Arial" }),
                    new TextRun({ text: `AUTORIZADO PARA ${destination}`, bold: true, size: 22, color: "0369a1", font: "Arial" })
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
  finalExams.forEach((examName, index) => {
    const examUpper = examName.toUpperCase();
    let destination = "HOSPITAL DESTINO";
    if (examUpper.includes('ANGIOTC')) destination = "HMMR";
    else if (examUpper.includes('COLANGIO')) destination = "RADIO VIDA";
    else if (examUpper.includes('TC') || examUpper.includes('TOMOGRAFIA')) destination = "HSJB";
    else if (examUpper.includes('RNM') || examUpper.includes('RESSONANCIA')) destination = "RADIO VIDA";

    const authKey = (index === 0 && providedKey) ? providedKey : generateKey();
    labelElements.push(createLabelTable(examName, authKey, destination));
    if (index < finalExams.length - 1) {
      labelElements.push(new Paragraph({ text: "", spacing: { before: 240, after: 240 } }));
    }
  });

  // --- LÓGICA DE DOCUMENTO COM ANEXO ---
  if (templateId) {
    try {
      const uploadDir = '/tmp/uploads';
      const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
      const templateFile = files.find(f => f.startsWith(templateId));

      if (templateFile) {
        const templatePath = path.join(uploadDir, templateFile);
        const fileBuffer = fs.readFileSync(templatePath);

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
            // Adicionar alguns parágrafos vazios para empurrar para o final se houver espaço
            const spacer = '<w:p><w:pPr><w:spacing w:before="400"/></w:pPr></w:p>';
            
            // Inserir ANTES do sectPr final do documento original (que controla as margens e rodapé da página)
            const mergedXml = templateXml.replace(/(<w:sectPr[^>]*>)/, `${spacer}${labelBody}$1`);
            
            templateZip.file("word/document.xml", mergedXml);
            const finalBuffer = await templateZip.generateAsync({ type: 'nodebuffer' });

            return new NextResponse(finalBuffer as any, {
              headers: {
                'Content-Disposition': `attachment; filename="Requisicao_Autorizada_${patient.replace(/\s/g, '_')}.docx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              },
            });
          }
        } 
        
        // --- CASO 2: TEMPLATE É PDF (.PDF) ---
        else if (templateFile.endsWith('.pdf')) {
          const data = await pdf(fileBuffer);
          const pdfText = data.text;

          // Criar novo Word com o texto do PDF e Etiqueta no Rodapé
          const doc = new Document({
            sections: [{
              properties: { 
                page: {
                  margin: { top: 720, right: 720, bottom: 1200, left: 720 }, // Margem inferior maior para o rodapé
                }
              },
              footers: {
                default: new Footer({
                  children: labelElements
                })
              },
              children: [
                ...pdfText.split('\n').map(line => new Paragraph({
                  children: [new TextRun({ text: line, size: 20, font: "Arial" })]
                }))
              ]
            }]
          });

          const finalBuffer = await Packer.toBuffer(doc);
          return new NextResponse(finalBuffer as any, {
            headers: {
              'Content-Disposition': `attachment; filename="Requisicao_PDF_Autorizada_${patient.replace(/\s/g, '_')}.docx"`,
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          });
        }
      }
    } catch (err) {
      console.error('[CIRILA_FILE_ERROR]', err);
    }
  }

  // --- CASO PADRÃO: SEM ANEXO (ETIQUETA AVULSA) ---
  const finalDoc = new Document({
    sections: [{
      properties: { 
        page: {
          margin: { top: 720, right: 720, bottom: 1200, left: 720 } 
        }
      },
      footers: {
        default: new Footer({
          children: labelElements
        })
      },
      children: [
        new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ETIQUETA DE AUTORIZAÇÃO DE PROCEDIMENTO", bold: true, size: 28, font: "Arial" })]
        }),
        new Paragraph({ text: "", spacing: { before: 400 } }),
        new Paragraph({ 
          children: [new TextRun({ text: "Este documento contém a etiqueta oficial de regulação da SMSVR.", size: 20, font: "Arial" })]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(finalDoc);
  return new NextResponse(buffer as any, {
    headers: {
      'Content-Disposition': `attachment; filename="Etiqueta_Avulsa_${patient.replace(/\s/g, '_')}.docx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  });
}
