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

  // --- MAPA DE PROFISSIONAIS (ATUALIZADO CONFORME IMAGEM) ---
  const profMap: Record<string, any> = {
    "paola": {
      "nome": "Paola Calderaro Nogueira Leite",
      "registro": "Coren-RJ 88367",
      "cargo": "Enfermeira supervisora",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "inima": {
      "nome": "Inimá J. O. Junior",
      "registro": "Coren-RJ 83798",
      "cargo": "Enfermeiro supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "rosely": {
      "nome": "Rosely Frossard de Andrade",
      "registro": "Mat.1778/PMVR",
      "cargo": "DCRAA/SMSVR",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "carlos_alves": {
      "nome": "Carlos Roberto Alves",
      "registro": "COREN-RJ 289648",
      "cargo": "Enfermeiro Supervisor / Auditor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "roberto_lopes": {
      "nome": "Roberto R. Lopes",
      "registro": "COREN-RJ 262240",
      "cargo": "Enfermeiro Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "sabrina": {
      "nome": "Sabrina Silva Ramalho",
      "registro": "COREN-RJ 146764",
      "cargo": "Enfermeira Supervisora",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "barenco": {
      "nome": "DR. Carlos Augusto Barenco",
      "registro": "CRO 11981",
      "cargo": "Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "mazoni": {
      "nome": "Dr Marcelo Henrique da Costa Mazoni",
      "registro": "CRM 52-37297-5",
      "cargo": "Médico Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    }
  };

  const prof = profMap[profKey] || {
    nome: profKey.toUpperCase(),
    registro: "COREN-RJ / CRM",
    cargo: "Regulador(a)",
    departamento: "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
  };

  // --- LÓGICA DE DESTINO AUTOMÁTICO ---
  let destination = "HOSPITAL DESTINO";
  const examUpper = exam.toUpperCase();
  if (examUpper.includes('TC') || examUpper.includes('TOMOGRAFIA')) {
    destination = "HSJB";
    if (examUpper.includes('ANGIOTC') || examUpper.includes('ANGIOTOMOGRAFIA')) {
      destination = "HMMR";
    }
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
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: `${prof.nome} – ${prof.registro} – ${prof.cargo}`,
                          bold: true,
                          size: 20,
                          font: "Arial"
                        })
                      ]
                    }),
                    // Linha 2: Departamento (Negrito, Arial)
                    new Paragraph({
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
                    // Linha 3: Etiqueta de Autorização (Exatamente abaixo, Arial)
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: [
                        new TextRun({
                          text: `${dateStr} : `,
                          bold: true,
                          size: 20,
                          font: "Arial"
                        }),
                        new TextRun({
                          text: `${authKey} - `,
                          bold: true,
                          size: 20,
                          font: "Arial"
                        }),
                        new TextRun({
                          text: `${patient.toUpperCase()} - ${examUpper} `,
                          size: 20,
                          font: "Arial"
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
