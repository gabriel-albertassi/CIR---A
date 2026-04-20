import nodemailer from 'nodemailer';

// Configuração do transporte SMTP usando os dados do .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'webmail.epdvr.com.br',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true para porta 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Algumas redes governamentais exigem isso para aceitar certificados auto-assinados
  tls: {
    rejectUnauthorized: false
  }
});

interface MailOptions {
  to: string[];
  subject: string;
  patientName: string;
  severity: string;
  originHospital: string;
  diagnosis: string;
  attachments?: {
    filename: string;
    path: string;
  }[];
}

export async function sendHospitalNotification({
  to,
  subject,
  patientName,
  severity,
  originHospital,
  diagnosis,
  attachments
}: MailOptions) {
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Configurações SMTP ausentes no .env. O e-mail não será enviado.');
    return { success: false, error: 'SMTP credentials missing' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"CIR-A Regulação" <${process.env.SMTP_USER}>`,
      to: to.join(', '),
      subject: `[REGULAÇÃO CIR-A] ${subject}`,
      attachments: attachments,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #020617; padding: 20px; text-align: center;">
            <h1 style="color: #00d8ff; margin: 0; font-size: 24px;">CIR-A</h1>
            <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Central Integrada de Regulação Assistida</p>
          </div>
          
          <div style="padding: 30px; background: white; color: #1e293b;">
            <h2 style="margin-top: 0;">Solicitação de Vaga de Regulação</h2>
            <p>Olá, equipe do NIR. Temos um novo paciente aguardando regulação para o perfil da sua unidade.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Paciente:</strong> ${patientName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Gravidade:</strong> <span style="font-weight: bold; color: ${getSeverityColor(severity)}">${severity}</span></p>
              <p style="margin: 0 0 10px 0;"><strong>Hospital de Origem:</strong> ${originHospital}</p>
              <p style="margin: 0;"><strong>Quadro Clínico:</strong> ${diagnosis}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://cir-a-fo1k.vercel.app'}" 
                 style="background: #00d8ff; color: #020617; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 700; display: inline-block;">
                 Acessar Painel de Regulação
              </a>
            </div>
          </div>
          
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            Esta é uma notificação automática da Secretaria Municipal de Saúde de Volta Redonda.
            <br>Enviado via Servidor Oficial EPDVR.
            <br>© 2026 CIR-A System
          </div>
        </div>
      `,
    });

    console.log('Email enviado com sucesso:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro detalhado no envio (SMTP):', error);
    return { success: false, error };
  }
}

function getSeverityColor(severity: string) {
  const s = severity.toUpperCase();
  if (s.includes('SALA_VERMELHA') || s.includes('CRITICAL') || s.includes('CTI')) return '#ef4444';
  if (s.includes('HIGH') || s.includes('LARANJA')) return '#f59e0b';
  if (s.includes('MEDIUM') || s.includes('AMARELO')) return '#3b82f6';
  return '#10b981';
}
