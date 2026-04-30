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

  // --- MAPA DE PROFISSIONAIS (ATUALIZADO) ---
  const profMap: Record<string, any> = {
    "paola": {
      "nome": "Paola Calderaro Nogueira Leite",
      "registro": "COREN-RJ 88367",
      "cargo": "Enfermeira Supervisora",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "inima": {
      "nome": "Inimá J. O. Junior",
      "registro": "COREN-RJ 83798",
      "cargo": "Enfermeiro Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "inimat": { 
      "nome": "Inimá J. O. Junior",
      "registro": "COREN-RJ 83798",
      "cargo": "Enfermeiro Supervisor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "carlos_alves": {
      "nome": "Carlos Roberto Alves",
      "registro": "COREN-RJ 289648",
      "cargo": "Enfermeiro Supervisor / Auditor",
      "departamento": "Departamento, Controle, Regulação – Avaliação e Auditoria – DCRAA – SMSVR"
    },
    "carlos": {
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
    "roberto": {
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
      "nome": "Dr. Carlos Augusto Barenco",
      "registro": "CRO 11981",
      "cargo": "Supervisor",
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
        margin: { top: 720, right: 720, bottom: 720, left: 720 },
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
                    // Cabeçalho Profissional
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [
                        new TextRun({
                          text: `${prof.nome} – ${prof.registro} – ${prof.cargo}`,
                          bold: true,
                          size: 18,
                          font: "Segoe UI"
                        })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 200 },
                      children: [
                        new TextRun({
                          text: prof.departamento,
                          size: 16,
                          font: "Segoe UI",
                          color: "475569"
                        })
                      ]
                    }),
                    // Linha da Autorização
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: [
                        new TextRun({
                          text: `${dateStr} : `,
                          bold: true,
                          size: 20,
                          font: "Segoe UI"
                        }),
                        new TextRun({
                          text: `${authKey} - `,
                          bold: true,
                          color: "2563eb",
                          size: 22,
                          font: "Courier New"
                        }),
                        new TextRun({
                          text: `${patient.toUpperCase()} - ${examUpper} `,
                          size: 20,
                          font: "Segoe UI"
                        }),
                        new TextRun({
                          text: `AUTORIZADO PARA ${destination}`,
                          bold: true,
                          size: 20,
                          color: "b91c1c", // Vermelho institucional (Red 700)
                          font: "Segoe UI"
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
