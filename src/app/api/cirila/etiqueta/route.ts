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
  const exam = searchParams.get('exam')?.replace(/\+/g, ' ') || 'EXAME';
  const profKey = searchParams.get('professional')?.toLowerCase() || 'paola';

  // --- MAPA DE PROFISSIONAIS (MAPEAMENTO FIXO CONFORME REGRA) ---
  const profMap: Record<string, any> = {
    "paola": {
      "full": "Paola Calderaro Nogueira Leite – COREN-RJ 88367 – Enfermeira Supervisora",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "inima": {
      "full": "Inimá J. O. Junior – COREN-RJ 83798 – Enfermeiro Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "inimá": {
      "full": "Inimá J. O. Junior – COREN-RJ 83798 – Enfermeiro Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "carlos": {
      "full": "Carlos Roberto Alves – COREN-RJ 289648 – Enfermeiro Supervisor / Auditor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "roberto": {
      "full": "Roberto R. Lopes – COREN-RJ 262240 – Enfermeiro Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "sabrina": {
      "full": "Sabrina Silva Ramalho – COREN-RJ 146764 – Enfermeira Supervisora",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "barenco": {
      "full": "Dr. Carlos Augusto Barenco – CRO 11981 – Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "dr. barenco": {
      "full": "Dr. Carlos Augusto Barenco – CRO 11981 – Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    // Mantendo os extras como fallback se necessário, mas priorizando os acima
    "rosely": {
      "full": "Rosely Frossard de Andrade – Mat.1778/PMVR – DCRAA/SMSVR",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "mazoni": {
      "full": "Dr Marcelo Henrique da Costa Mazoni – CRM 52-37297-5 – Médico Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    }
  };

  const prof = profMap[profKey] || {
    full: `${profKey.toUpperCase()} – REGISTRO – CARGO`,
    departamento: "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
  };

  // --- LÓGICA DE DESTINO AUTOMÁTICO (ATUALIZADA) ---
  let destination = "HOSPITAL DESTINO";
  const examUpper = exam.toUpperCase();
  
  if (examUpper.includes('ANGIOTC')) {
    destination = "HMMR";
  } else if (examUpper.includes('TC') || examUpper.includes('TOMOGRAFIA')) {
    destination = "HSJB";
  } else if (examUpper.includes('COLANGIO RNM') || examUpper.includes('COLANGIORNM')) {
    destination = "RADIO VIDA";
  } else if (examUpper.includes('RNM') || examUpper.includes('RESSONANCIA') || examUpper.includes('RESSONÂNCIA')) {
    destination = "RADIO VIDA";
  }

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const dateStr = new Date().toLocaleDateString('pt-BR');
  const authKey = generateKey();

  // --- CRIAÇÃO DO DOCUMENTO ---
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
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
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    // Linha 1: Profissional (Negrito, Arial)
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: prof.full,
                          bold: true,
                          size: 20,
                          font: "Arial"
                        })
                      ]
                    }),
                    // Linha 2: Departamento (Negrito, Arial)
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 120 },
                      children: [
                        new TextRun({
                          text: prof.departamento,
                          bold: true,
                          size: 20,
                          font: "Arial"
                        })
                      ]
                    }),
                    // Linha 3: Etiqueta de Autorização (Arial)
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: `${dateStr} : `,
                          bold: true,
                          size: 20,
                          font: "Arial",
                          color: "000000"
                        }),
                        new TextRun({
                          text: `${authKey} - `,
                          bold: true,
                          size: 20,
                          font: "Arial",
                          color: "000000"
                        }),
                        new TextRun({
                          text: `${patient.toUpperCase()} - ${examUpper} `,
                          size: 20,
                          font: "Arial",
                          color: "000000"
                        }),
                        new TextRun({
                          text: `AUTORIZADO PARA ${destination}`,
                          bold: true,
                          size: 20,
                          color: "b91c1c", // Vermelho institucional (Red 700)
                          font: "Arial"
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });

  return new NextResponse(blob, {
    headers: {
      'Content-Disposition': `attachment; filename="Etiqueta_${patient.replace(/\s/g, '_')}.docx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  });
}
