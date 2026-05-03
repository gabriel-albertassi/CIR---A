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
      bcc: 'central.internacao@epdvr.com.br',
      subject: `[REGULAÇÃO CIRA] ${subject}`,
      attachments: attachments,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #020617 0%, #0f172a 100%); padding: 30px; text-align: center; border-bottom: 3px solid #00d8ff;">
            <h1 style="color: #00d8ff; margin: 0; font-size: 28px; letter-spacing: 1px;">CIR-A</h1>
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
            
            <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 30px;">
              <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                ${attachments && attachments.length > 0 ? attachments.map(att => `
                  <a href="${att.path}" target="_blank" download="${att.filename}"
                     style="background: #ffffff; color: #0f172a; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700; font-size: 13px; border: 1.5px solid #e2e8f0; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s ease;">
                     <span style="font-size: 18px;">📄</span> ${att.filename.length > 25 ? att.filename.substring(0, 22) + '...' : att.filename}
                  </a>
                `).join('') : ''}
              </div>

              <div style="text-align: center; margin-top: 10px;">
                <a href="${confirmUrl}" target="_blank"
                   style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                   ✅ Confirmar Recebimento
                </a>
              </div>
            </div>
            
            <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 25px; line-height: 1.5;">
              DICA: Caso o download não inicie, clique com o botão direito nos anexos e selecione "Salvar link como...".
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
            Esta é uma notificação da Secretaria Municipal de Saúde de Volta Redonda (SMSVR).
            <br>© 2026 CIR-A System • Inteligência Automatizada
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
