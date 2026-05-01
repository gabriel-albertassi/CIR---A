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
  BorderStyle,
  AlignmentType,
  Header,
  ImageRun,
  PageOrientation,
  VerticalAlign,
  HeightRule,
  RelativeHorizontalPosition,
  RelativeVerticalPosition,
  TableAnchorType,
  OverlapType
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
    const qty = parseInt(searchParams.get('qty') || '1');

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
      "mazoni": { name: "Dr Marcelo Henrique da Costa Mazoni", registro: "CRM 52-37297-5", cargo: "Médico Supervisor" }
    };

    const prof = profMap[professionalKey] || { name: professionalKey.toUpperCase(), registro: "REGISTRO", cargo: "CARGO" };
    const dateStr = new Date().toLocaleDateString('pt-BR');

    const getDestination = (exam: string) => {
      const e = exam.toUpperCase();
      if (e.includes('ANGIOTC')) return "HMMR";
      if (e.includes('COLANGIO')) return "RADIO VIDA";
      if (e.includes('TC') || e.includes('TOMOGRAFIA')) return "HSJB";
      if (e.includes('RNM') || e.includes('RESSONANCIA')) return "RADIO VIDA";
      return "HOSPITAL DESTINO";
    };

    // --- FUNÇÃO PARA CRIAR A ETIQUETA FLUTUANTE ("UNLOCKED") ---
    const createLabelTable = (examName: string, authKey: string, destination: string, pName: string, isFloating = true) => {
      const isAvulsa = examName.toUpperCase() === 'AVULSA';
      const finalExam = isAvulsa ? "EXAME A SER PREENCHIDO" : examName.toUpperCase();
      const finalPatient = pName === 'SOBREAVISO' || pName === 'AVULSA' || pName === 'ETIQUETA AVULSA' ? "PACIENTE A SER PREENCHIDO" : pName.toUpperCase();

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        float: isFloating ? {
          horizontalAnchor: TableAnchorType.PAGE,
          verticalAnchor: TableAnchorType.PAGE,
          relativeHorizontalPosition: RelativeHorizontalPosition.CENTER,
          relativeVerticalPosition: pos === 'bottom' ? RelativeVerticalPosition.BOTTOM : RelativeVerticalPosition.TOP,
          overlap: OverlapType.OVERLAP,
        } : undefined,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 20, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 20, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 20, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 20, color: "000000" },
                },
                shading: { fill: "FFFFFF" },
                margins: { top: 200, bottom: 200, left: 300, right: 300 },
                children: [
                  // LINHA 1: [NOME – REGISTRO – CARGO]
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: `${prof.name} – ${prof.registro} – ${prof.cargo}`,
                        bold: true,
                        size: 26,
                        font: "Arial",
                        underline: { type: "single" }
                      })
                    ]
                  }),
                  // LINHA 2: Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 80 },
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
                    spacing: { before: 120 },
                    children: [
                      new TextRun({ text: `${dateStr} : `, bold: true, size: 26, font: "Arial", color: "0000FF" }),
                      new TextRun({ text: authKey, bold: true, size: 32, font: "Arial", color: "FF0000" }),
                      new TextRun({
                        text: ` - ${finalPatient} - ${finalExam} AUTORIZADO PARA ${destination}`,
                        bold: true,
                        size: 26,
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

    // Sobreaviso: ativado apenas por patient=SOBREAVISO explícito (nunca por qty)
    const isSobreaviso = patient.toUpperCase() === 'SOBREAVISO';
    const labelElements: any[] = [];

    let pageHeader: any = null;
    if (isSobreaviso) {
      pageHeader = new Header({
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "002060" },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "CIR-A / REGULAÇÃO SMSVR", bold: true, size: 24, font: "Arial", color: "002060" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [new TextRun({ text: `EMISSÃO: ${dateStr}`, bold: true, size: 20, font: "Arial", color: "002060" })]
                    })]
                  }),
                ]
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 300 },
            children: [new TextRun({ text: "MAPA DE SUPERVISÃO - SOBREAVISO NOTURNO", bold: true, size: 28, font: "Arial", color: "002060" })]
          })
        ]
      });

      const headers = [
        { text: "DATA/CHAVE", width: 15 },
        { text: "PACIENTE", width: 25 },
        { text: "DIAGNÓSTICO", width: 15 },
        { text: "ORIGEM", width: 10 },
        { text: "EXAME", width: 15 },
        { text: "DESTINO", width: 10 },
        { text: "AUD", width: 5 }
      ];

      const tableRows = finalExams.map((examName, index) => {
        const authKey = (index === 0 && providedKey) ? providedKey : generateKey();
        const isEven = index % 2 === 0;

        return new TableRow({
          height: { value: 800, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({ shading: { fill: isEven ? "F2F2F2" : "FFFFFF" }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${dateStr} ${authKey}`, bold: true, size: 18, font: "Arial" })] })] }),
            new TableCell({ shading: { fill: isEven ? "F2F2F2" : "FFFFFF" }, children: [new Paragraph({ text: "" })] }),
            new TableCell({ shading: { fill: isEven ? "F2F2F2" : "FFFFFF" }, children: [new Paragraph({ text: "" })] }),
            new TableCell({ shading: { fill: isEven ? "F2F2F2" : "FFFFFF" }, children: [new Paragraph({ text: "" })] }),
            new TableCell({ shading: { fill: isEven ? "F2F2F2" : "FFFFFF" }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: examName.toUpperCase(), size: 18, font: "Arial" })] })] }),
            new TableCell({ shading: { fill: isEven ? "F2F2F2" : "FFFFFF" }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: getDestination(examName), size: 18, font: "Arial" })] })] }),
            new TableCell({ shading: { fill: isEven ? "F2F2F2" : "FFFFFF" }, children: [new Paragraph({ text: "" })] }),
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
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h.text, bold: true, size: 18, color: "FFFFFF", font: "Arial" })] })]
            }))
          }),
          ...tableRows
        ]
      }));

    } else {
      // Etiquetas Individuais
      finalExams.forEach((examName, index) => {
        const authKey = (index === 0 && providedKey) ? providedKey : generateKey();
        const destination = getDestination(examName);
        labelElements.push(createLabelTable(examName, authKey, destination, patient, !templateUrl));
        if (index < finalExams.length - 1) {
          labelElements.push(new Paragraph({ text: "", spacing: { before: 200, after: 200 } }));
        }
      });
    }

    // --- PROCESSAMENTO COM ANEXO ---
    if (templateUrl) {
      const absoluteUrl = templateUrl.startsWith('http') ? templateUrl : `${req.nextUrl.origin}${templateUrl}`;
      const response = await fetch(absoluteUrl);
      if (!response.ok) throw new Error('Falha ao baixar anexo');
      const fileBuffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';

      const isDocx = contentType.includes('officedocument.wordprocessingml') || templateUrl.toLowerCase().endsWith('.docx');
      const isPdf = contentType.includes('application/pdf') || templateUrl.toLowerCase().endsWith('.pdf');

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
            mergedXml = templateXml.replace(/<\/w:body>/, `${labelBody}</w:body>`);
          } else {
            mergedXml = templateXml.replace(/(<w:body[^>]*>)/, `$1${labelBody}`);
          }
          templateZip.file("word/document.xml", mergedXml);
          const finalBuffer = await templateZip.generateAsync({ type: 'nodebuffer' });

          return new NextResponse(finalBuffer as any, {
            headers: {
              'Content-Disposition': `attachment; filename="Autorizacao_Cirila_${patient.replace(/\s/g, '_')}.docx"`,
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          });
        }
      } else if (isPdf) {
        const pdfData = await pdf(fileBuffer);
        const pdfParagraphs = pdfData.text.split('\n').map(line => new Paragraph({
          children: [new TextRun({ text: line, size: 20, font: "Arial" })]
        }));

        const doc = new Document({
          sections: [{
            children: pos === 'bottom' ? [...pdfParagraphs, ...labelElements] : [...labelElements, ...pdfParagraphs]
          }]
        });
        const finalBuffer = await Packer.toBuffer(doc);
        return new NextResponse(finalBuffer as any, {
          headers: {
            'Content-Disposition': `attachment; filename="Autorizacao_Cirila_${patient.replace(/\s/g, '_')}.docx"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        });
      }
    }

    // --- CASO PADRÃO: SEM ANEXO OU FALLBACK ---
    const finalDoc = new Document({
      sections: [{
        headers: pageHeader ? { default: pageHeader } : undefined,
        properties: {
          page: {
            margin: { top: isSobreaviso ? 1200 : 720, right: 720, bottom: 720, left: 720 },
            size: isSobreaviso ? { orientation: PageOrientation.LANDSCAPE } : undefined
          }
        },
        children: labelElements
      }]
    });

    const buffer = await Packer.toBuffer(finalDoc);
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${isSobreaviso ? 'Planilha_Sobreaviso' : 'Etiqueta'}_${patient.replace(/\s/g, '_')}.docx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (err: any) {
    console.error('[CIRILA_ETIQUETA_ERROR]', err);
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
