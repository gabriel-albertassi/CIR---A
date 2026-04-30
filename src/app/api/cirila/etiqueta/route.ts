import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
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
  VerticalAlign
} from 'docx';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get('patient')?.replace(/\+/g, ' ') || 'PACIENTE';
  const professionalKey = searchParams.get('professional')?.toLowerCase() || 'paola';
  const templateId = searchParams.get('templateId');
  
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

  // --- CONSTRUÇÃO DAS ETIQUETAS ---
  const children: any[] = [];

  // Se não houver template, adiciona espaços em branco no topo
  if (!templateId) {
    for (let i = 0; i < 15; i++) {
      children.push(new Paragraph({ text: "" }));
    }
  }

  finalExams.forEach((examName, index) => {
    const examUpper = examName.toUpperCase();
    let destination = "HOSPITAL DESTINO";

    if (examUpper.includes('ANGIOTC')) {
      destination = "HMMR";
    } else if (examUpper.includes('COLANGIO')) {
      destination = "RADIO VIDA";
    } else if (examUpper.includes('TC') || examUpper.includes('TOMOGRAFIA')) {
      destination = "HSJB";
    } else if (examUpper.includes('RNM') || examUpper.includes('RESSONANCIA') || examUpper.includes('RESSONÂNCIA')) {
      destination = "RADIO VIDA";
    }

    const authKey = generateKey();

    // Cada etiqueta é uma tabela de uma única célula (box)
    children.push(
      new Table({
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
                      new TextRun({ text: `${examUpper} - `, bold: true, size: 22, font: "Arial" }),
                      new TextRun({ text: `AUTORIZADO PARA ${destination}`, bold: true, size: 22, color: "0369a1", font: "Arial" })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    );

    // Espaçador entre etiquetas
    if (index < finalExams.length - 1 || templateId) {
      children.push(new Paragraph({ text: "", spacing: { before: 240, after: 240 } }));
    }
  });

  // Gerar o documento de etiqueta
  const labelDoc = new Document({
    sections: [{
      properties: { 
        page: { 
          margin: { top: 720, right: 720, bottom: 720, left: 720 } 
        } 
      },
      children: children
    }]
  });

  const labelBuffer = await Packer.toBuffer(labelDoc);

  // --- LÓGICA DE MESCLAGEM SE HOUVER TEMPLATE ---
  if (templateId) {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      const files = fs.readdirSync(uploadDir);
      const templateFile = files.find(f => f.startsWith(templateId));

      if (templateFile && templateFile.endsWith('.docx')) {
        const templatePath = path.join(uploadDir, templateFile);
        const templateBuffer = fs.readFileSync(templatePath);

        // Abrir ambos os documentos com JSZip
        const templateZip = await JSZip.loadAsync(templateBuffer);
        const labelZip = await JSZip.loadAsync(labelBuffer);

        // Extrair o conteúdo XML do corpo da etiqueta
        const labelXml = await labelZip.file("word/document.xml")?.async("string") || "";
        const templateXml = await templateZip.file("word/document.xml")?.async("string") || "";

        // Capturar o conteúdo entre <w:body> e o primeiro <w:sectPr (ou </w:body>)
        // Isso pega apenas as tabelas e parágrafos da etiqueta
        const bodyContentMatch = labelXml.match(/<w:body>([\s\S]*?)(?:<w:sectPr|<\/w:body>)/);
        if (bodyContentMatch) {
          const newContent = bodyContentMatch[1];
          
          // Inserir no início do body do template
          const mergedXml = templateXml.replace('<w:body>', `<w:body>${newContent}`);
          
          templateZip.file("word/document.xml", mergedXml);
          
          const finalBuffer = await templateZip.generateAsync({ type: 'nodebuffer' });
          const finalUint8Array = new Uint8Array(finalBuffer);
          
          return new NextResponse(finalUint8Array, {
            headers: {
              'Content-Disposition': `attachment; filename="Requisicao_Com_Etiqueta_${patient.replace(/\s/g, '_')}.docx"`,
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          });
        }
      }
    } catch (err) {
      console.error('[CIRILA_MERGE_ERROR]', err);
      // Fallback para apenas a etiqueta se a mesclagem falhar
    }
  }

  // Retorno padrão (apenas etiqueta)
  const labelUint8Array = new Uint8Array(labelBuffer);
  return new NextResponse(labelUint8Array, {
    headers: {
      'Content-Disposition': `attachment; filename="Etiquetas_${patient.replace(/\s/g, '_')}.docx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  });
}
