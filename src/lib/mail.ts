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
  patientId: string;
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
  patientId,
  severity,
  originHospital,
  diagnosis,
  attachments
}: MailOptions) {
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Configurações SMTP ausentes no .env. O e-mail não será enviado.');
    return { success: false, error: 'SMTP credentials missing' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cir-a-fo1k.vercel.app';
  
  // Link único de confirmação por paciente
  const confirmUrl = `${siteUrl}/api/confirm-receipt?p=${patientId}&h=Hospital`;

  try {
    const info = await transporter.sendMail({
      from: `"CIRA Regulação" <${process.env.SMTP_USER}>`,
      to: to.join(', '),
      subject: `[REGULAÇÃO CIRA] ${subject}`,
      attachments: attachments,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #020617 0%, #0f172a 100%); padding: 30px; text-align: center; border-bottom: 3px solid #00d8ff;">
            <h1 style="color: #00d8ff; margin: 0; font-size: 28px; letter-spacing: 1px;">CIRA</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Central Inteligente de Regulação Automatizada</p>
          </div>
          
          <div style="padding: 40px; background: #ffffff; color: #1e293b;">
            <h2 style="margin-top: 0; font-size: 20px; color: #020617;">Nova Solicitação de Vaga</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">Olá, equipe do NIR. Foi identificada uma necessidade de regulação para o perfil da sua unidade. Seguem dados iniciais:</p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #f1f5f9;">
              <p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Paciente:</strong> <span style="font-size: 16px; color: #020617;">${patientName}</span></p>
              <p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Gravidade:</strong> <span style="padding: 4px 10px; border-radius: 6px; background: ${getSeverityColor(severity)}20; color: ${getSeverityColor(severity)}; font-weight: 800; font-size: 12px;">${severity}</span></p>
              <p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Hospital de Origem:</strong> ${originHospital}</p>
              <p style="margin: 0; font-size: 14px;"><strong>Quadro Clínico:</strong> ${diagnosis}</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; margin-top: 30px;">
              ${attachments && attachments.length > 0 ? `
              <a href="${attachments[0].path}" 
                 style="background: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 700; width: 220px; text-align: center; display: block; margin-bottom: 10px;">
                 📥 Baixar Malote Digital
              </a>
              ` : ''}

              <a href="${confirmUrl}" 
                 style="background: #00d8ff; color: #020617; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 700; width: 220px; text-align: center; display: block;">
                 ✅ Confirmar Recebimento
              </a>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 25px;">
              Este link de confirmação registra automaticamente o recebimento na mesa de regulação em tempo real.
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
            Esta é uma notificação da Secretaria Municipal de Saúde de Volta Redonda (SMSVR).
            <br>© 2026 CIRA System • Inteligência Assistida
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
