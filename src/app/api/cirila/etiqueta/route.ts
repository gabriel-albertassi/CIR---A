import { NextRequest, NextResponse } from 'next/server';
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
  const tableRows: TableRow[] = [];

  finalExams.forEach((examName, index) => {
    const examUpper = examName.toUpperCase();
    let destination = "HOSPITAL DESTINO";

    if (examUpper.includes('ANGIOTC')) {
      destination = "HMMR";
    } else if (examUpper.includes('TC') || examUpper.includes('TOMOGRAFIA')) {
      destination = "HSJB";
    } else if (examUpper.includes('RNM') || examUpper.includes('RESSONANCIA') || examUpper.includes('RESSONÂNCIA')) {
      destination = "RADIO VIDA";
    }

    const authKey = generateKey();

    // Cada etiqueta é uma linha da tabela
    tableRows.push(
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
                spacing: { after: 40 },
                children: [new TextRun({ text: prof.full, bold: true, size: 20, font: "Arial" })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [new TextRun({ text: departamento, bold: true, size: 20, font: "Arial" })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${dateStr} : `, bold: true, size: 20, font: "Arial" }),
                  new TextRun({ text: `${authKey} - `, bold: true, size: 20, font: "Arial" }),
                  new TextRun({ text: `${patient.toUpperCase()} - ${examUpper} `, size: 20, font: "Arial" }),
                  new TextRun({ text: `AUTORIZADO PARA ${destination}`, bold: true, size: 20, color: "b91c1c", font: "Arial" })
                ]
              })
            ]
          })
        ]
      })
    );

    // Espaçador entre etiquetas (exceto na última)
    if (index < finalExams.length - 1) {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NIL },
                bottom: { style: BorderStyle.NIL },
                left: { style: BorderStyle.NIL },
                right: { style: BorderStyle.NIL },
              },
              children: [new Paragraph({ spacing: { before: 200, after: 200 } })]
            })
          ]
        })
      );
    }
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8Array = new Uint8Array(buffer);

  return new NextResponse(uint8Array, {
    headers: {
      'Content-Disposition': `attachment; filename="Etiquetas_${patient.replace(/\s/g, '_')}.docx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  });
}
