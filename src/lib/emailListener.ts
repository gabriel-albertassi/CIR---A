import { ImapFlow } from 'imapflow';
import { prisma } from './db';
import { createNotification } from './notifications';

/**
 * Conecta à caixa de entrada da Central e busca novos e-mails
 */
export async function fetchUnseenCentralEmails() {
  // Verificação de credenciais
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[EmailListener] Credenciais SMTP_USER/PASS ausentes.');
    return { success: false, error: 'Credentials missing' };
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'webmail.epdvr.com.br',
    port: Number(process.env.IMAP_PORT) || 993,
    secure: process.env.IMAP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false,
    verifyOnly: false
  });

  try {
    await client.connect();

    // Seleciona a caixa de entrada
    let lock = await client.getMailboxLock('INBOX');
    try {
      // Busca e-mails não lidos (UNSEEN)
      // Usamos 'unseen' para pegar apenas o que o regulador ainda não abriu
      const messages = await client.search({ seen: false });
      
      console.log(`[EmailListener] Encontrados ${messages.length} e-mails não lidos.`);

      for (const uid of messages) {
        const message = await client.fetchOne(uid.toString(), { envelope: true });
        if (!message || !message.envelope) continue;

        const { subject, from, date } = message.envelope;
        const fromAddr = from?.[0]?.address || 'Desconhecido';
        const fromName = from?.[0]?.name || fromAddr;

        // Tenta vincular o e-mail a um paciente ativo na fila
        // Buscamos pacientes que não estão finalizados
        const activePatients = await prisma.patient.findMany({
          where: { status: { in: ['WAITING', 'OFFERED'] } },
          select: { id: true, name: true }
        });

        let linkedPatientId = null;
        if (subject) {
          const subjectLower = subject.toLowerCase();
          const found = activePatients.find(p => 
            subjectLower.includes(p.name.toLowerCase()) || 
            (p.name.split(' ')[0].length > 3 && subjectLower.includes(p.name.split(' ')[0].toLowerCase()))
          );
          if (found) linkedPatientId = found.id;
        }

        // Verifica se já existe uma notificação para este UID de e-mail (para não duplicar)
        // Como o modelo Notification não tem 'email_uid', vamos usar o título + data para checar
        const existing = await prisma.notification.findFirst({
          where: {
            title: `E-mail: ${subject}`,
            created_at: {
              gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000) // Últimas 24h
            }
          }
        });

        if (!existing) {
          await createNotification({
            title: `E-mail: ${subject || '(Sem Assunto)'}`,
            message: `Novo e-mail de ${fromName}. Verifique a caixa de entrada da Central.`,
            type: 'INFO',
            patientId: linkedPatientId || undefined
          });
          
          console.log(`[EmailListener] Notificação criada para: ${subject}`);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return { success: true, count: messages.length };
  } catch (error: any) {
    console.error('[EmailListener] Erro ao sincronizar e-mails:', error);
    return { success: false, error: error.message };
  }
}
