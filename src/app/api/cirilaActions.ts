'use server'

import { prisma } from '@/lib/db'
import { sendHospitalNotification } from '@/lib/mail'
import { getUnreadNotifications } from '@/lib/notifications'

export type CirilaResponse = {
  text: string;
  sender: 'ai' | 'user';
  actions?: { label: string, payload: string }[];
  image?: string;
  file?: {
    name: string;
    size?: number;
    type: string;
  };
  payload?: any;
};

/**
 * Função principal da Cirila (IA) para processar queries e documentos
 */
export async function askCirila(query: string): Promise<CirilaResponse> {
  const lowerQuery = query.toLowerCase();
  
  try {
    // 0. Lógica de Dispatch de Email (Invocada por botões)
    if (lowerQuery.startsWith('ask_email_dispatch:::')) {
      const parts = query.split(':::');
      const patientId = parts[1];
      const type = parts[2] || 'ALL';
      
      const result = await executeEmailDispatch(patientId, type);
      
      if (result.success) {
        return {
          text: `✅ **Operação Concluída!** Disparei e-mails para **${result.count} hospitais**. \n\nDestinos: ${result.targetNames?.join(', ')}. \n\nAgora é só aguardar o retorno deles no NIR.`,
          sender: 'ai'
        };
      } else {
        return {
          text: `❌ **Falha no envio:** ${result.error}`,
          sender: 'ai'
        };
      }
    }

    // 1. Lógica de Dashboards / Relatórios
    if (lowerQuery.includes('relatório') || lowerQuery.includes('dashboard') || lowerQuery.includes('estatística')) {
      const patients = await prisma.patient.findMany();
      const tc = patients.filter(p => p.diagnosis.toUpperCase().includes('TC')).length;
      const rnm = patients.filter(p => p.diagnosis.toUpperCase().includes('RNM')).length;
      
      return {
        text: "Com certeza! Aqui está o **relatório consolidado** das regulações recentes. O volume de solicitações de TC e RNM segue estável nesta semana.",
        sender: 'ai',
        payload: {
          type: 'CIRILA_DASHBOARD',
          data: {
            total: patients.length,
            tc,
            rnm,
            others: Math.max(0, patients.length - tc - rnm),
            byHospital: {}
          },
          period: 'Maio 2026',
          examType: 'GERAL'
        },
        actions: [
          { label: 'Baixar Relatório Word', payload: 'DOWNLOAD_REPORT_MONTHLY' }
        ]
      };
    }

    // 2. Lógica de Sobreaviso
    if (lowerQuery.includes('sobreaviso') || lowerQuery.includes('mapa')) {
      return {
        text: "O sistema de sobreaviso está configurado. Quantas chaves (vagas) você deseja mapear para o relatório de hoje?",
        sender: 'ai',
        actions: [
          { label: 'Mapa 3 Chaves', payload: 'DOWNLOAD_DOCX_3' },
          { label: 'Mapa 5 Chaves', payload: 'DOWNLOAD_DOCX_5' },
          { label: 'Configurar Escala', payload: 'NAVIGATE_SOBREAVISO' }
        ]
      };
    }

    // 3. Notificações
    if (lowerQuery.includes('notificação') || lowerQuery.includes('novidade') || lowerQuery.includes('recebi')) {
      const unread = await getUnreadNotifications();
      if (unread.length > 0) {
        return {
          text: `Você tem **${unread.length}** notificações pendentes. A maioria são respostas de e-mails dos hospitais.`,
          sender: 'ai',
          actions: [
            { label: 'Ver Notificações', payload: 'SHOW_NOTIFICATIONS' }
          ]
        };
      } else {
        return {
          text: "Não há novas notificações no momento. Tudo sob controle!",
          sender: 'ai'
        };
      }
    }

    // 4. Busca de Paciente para Etiqueta / Email
    const patientsInDB = await prisma.patient.findMany({
      take: 20,
      orderBy: { created_at: 'desc' }
    });

    const matchedPatient = patientsInDB.find(p => {
      const firstName = p.name.split(' ')[0].toLowerCase();
      return lowerQuery.includes(firstName) || lowerQuery.includes(p.id.substring(0, 8));
    });

    if (matchedPatient) {
      const fileUrlMatch = query.match(/\[file_url:(.*?)\]/);
      const fileUrl = fileUrlMatch ? fileUrlMatch[1] : '';

      return {
        text: `Identifiquei o paciente **${matchedPatient.name}**. \n\nO quadro clínico indica: **${matchedPatient.diagnosis}** (${matchedPatient.severity}).\n\nComo deseja proceder com a regulação deste caso?`,
        sender: 'ai',
        actions: [
          { label: 'Gerar Etiqueta', payload: `DOWNLOAD_ETIQUETA_DOCX:::${matchedPatient.name}:::${matchedPatient.diagnosis}:::Dr. Plantonista:::${matchedPatient.id}:::${fileUrl}:::1:::bottom:::${matchedPatient.origin_hospital}:::1` },
          { label: 'Disparar para Rede Pública', payload: `ASK_EMAIL_DISPATCH:::${matchedPatient.id}:::PUBLIC` },
          { label: 'Disparar Tudo (Triagem)', payload: `ASK_EMAIL_DISPATCH:::${matchedPatient.id}:::ALL` }
        ]
      };
    }

    // 5. Fallback Contextual
    if (query.includes('[file_url:')) {
      return {
        text: "Recebi o documento! Ele parece ser um **Template de Autorização**. \n\nPara que eu possa preenchê-lo, por favor, me diga o **nome do paciente** ou o **ID da solicitação**.",
        sender: 'ai'
      };
    }

    // 6. Resposta Padrão
    return {
      text: "Olá! Eu sou a **Cirila**, sua assistente de regulação. Posso ajudar você a encontrar pacientes, gerar etiquetas de autorização ou disparar e-mails para a rede hospitalar. \n\n**O que você precisa agora?**",
      sender: 'ai',
      actions: [
        { label: 'Relatório Geral', payload: 'REPORT_GENERAL' },
        { label: 'Mapa de Sobreaviso', payload: 'SOBREAVISO_MAP' }
      ]
    };

  } catch (error) {
    console.error('Erro no askCirila:', error);
    return {
      text: "Desculpe, tive um problema técnico ao processar sua solicitação. Por favor, tente novamente.",
      sender: 'ai'
    };
  }
}

/**
 * Interface para anexos no sistema Cirila
 */
interface CirilaAttachment {
  filename: string;
  path: string;
}

/**
 * Resultado da operação de dispatch
 */
interface DispatchResult {
  success: boolean;
  count?: number;
  targetNames?: string[];
  error?: string;
}

/**
 * Função real para disparar os e-mails baseada na triagem inteligente
 */
export async function executeEmailDispatch(patientId: string, targetType: string): Promise<DispatchResult> {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { success: false, error: 'Paciente não encontrado' };

    const hospitals = await prisma.hospital.findMany();

    // Filtro de Triagem Inteligente
    const isGrave = ['CTI', 'SALA_VERMELHA', 'CRITICAL', 'HIGH'].includes(patient.severity.toUpperCase());

    let targets = hospitals.filter(h => {
      // REGRA: Ignorar o hospital onde o paciente JÁ ESTÁ (Origem)
      if (h.name.toLowerCase().trim() === patient.origin_hospital.toLowerCase().trim()) return false;

      // TRAVA DE SEGURANÇA: Só envia para privado se o paciente tiver perfil privado
      if (h.type !== 'PUBLICO' && !patient.is_private) return false;

      // Regra da Rede Pública
      if (targetType === 'PUBLIC' && h.type !== 'PUBLICO') return false;

      // Regra Nelson Gonçalves: Só aceita Clínica Médica (não aceita CTI/GRAVE)
      if (h.name.toLowerCase().includes('nelson') && isGrave) return false;

      // Filtro de Capacidade do Hospital
      if (isGrave && !h.accepts_cti) return false;
      if (!isGrave && !h.accepts_clinica) return false;

      return !!h.email; // Só hospitais com e-mail cadastrado
    });

    // Se o targetType for um ID específico (ex: ONLY_uuid)
    if (targetType.startsWith('ONLY_')) {
      const hospitalId = targetType.replace('ONLY_', '');
      targets = hospitals.filter(h => h.id === hospitalId);
    }

    const emails = targets.map(h => h.email!);
    if (emails.length === 0) return { success: false, error: 'Nenhum hospital compatível com e-mail cadastrado.' };

    // Preparar Anexos: Malote + Evolução Médica - Garantir tipagem estrita
    const attachments: CirilaAttachment[] = [];
    
    if (patient.attachment_url) {
      attachments.push({
        filename: patient.attachment_name || 'malote-paciente.pdf',
        path: patient.attachment_url
      });
    }
    
    if (patient.evolution_url) {
      attachments.push({
        filename: patient.evolution_name || 'evolucao-medica.pdf',
        path: patient.evolution_url
      });
    }

    // Executar envio e auditoria em transação
    await prisma.$transaction(async (tx) => {
      await sendHospitalNotification({
        to: emails,
        patientName: patient.name,
        patientId: patient.id,
        severity: patient.severity,
        originHospital: patient.origin_hospital,
        diagnosis: patient.diagnosis,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      // Registrar Auditoria do Sistema (Cirila)
      await tx.log.create({
        data: {
          patient_id: patient.id,
          action: 'NOTIFICACAO_EMAIL',
          details: `E-mail disparado para ${emails.length} hospitais via Cirila. Destinos: ${targets.map(h => h.name).join(', ')}`
        }
      });
    });

    return { success: true, count: emails.length, targetNames: targets.map(h => h.name) };
  } catch (err: any) {
    console.error('Erro no dispatch Cirila:', err);
    return { success: false, error: err.message };
  }
}

