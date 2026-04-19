'use server'

import { prisma } from '../../lib/db'
import { sendHospitalNotification } from '../../lib/mail'

export type CirilaResponse = {
  text: string;
  sender: 'ai' | 'user';
  actions?: { label: string, payload: string }[];
  image?: string;
}

/**
 * Função real para disparar os e-mails baseada na triagem inteligente
 */
export async function executeEmailDispatch(patientId: string, targetType: 'PUBLIC' | 'ALL') {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { success: false, error: 'Paciente não encontrado' };

    const hospitals = await prisma.hospital.findMany();
    
    // Filtro de Triagem Inteligente
    const isGrave = ['CTI', 'SALA_VERMELHA', 'CRITICAL', 'HIGH'].includes(patient.severity.toUpperCase());
    
    const targets = hospitals.filter(h => {
      // REGRA: Ignorar o hospital onde o paciente JÁ ESTÁ (Origem)
      if (h.name.toLowerCase().trim() === patient.origin_hospital.toLowerCase().trim()) return false;

      // Regra da Rede Pública
      if (targetType === 'PUBLIC' && h.type !== 'PUBLICO') return false;
      
      // Regra Nelson Gonçalves: Só aceita Clínica Médica (não aceita CTI/GRAVE)
      if (h.name.toLowerCase().includes('nelson') && isGrave) return false;
      
      // Filtro de Capacidade do Hospital
      if (isGrave && !h.accepts_cti) return false;
      if (!isGrave && !h.accepts_clinica) return false;
      
      return !!h.email; // Só hospitais com e-mail cadastrado
    });

    const emails = targets.map(h => h.email!);
    if (emails.length === 0) return { success: false, error: 'Nenhum hospital compatível com e-mail cadastrado.' };

    await sendHospitalNotification({
      to: emails,
      subject: `Solicitação de Vaga: ${patient.name}`,
      patientName: patient.name,
      severity: patient.severity,
      originHospital: patient.origin_hospital,
      diagnosis: patient.diagnosis
    });

    return { success: true, count: emails.length, targetNames: targets.map(h => h.name) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function askCirila(query: string): Promise<CirilaResponse> {
  const text = query.toLowerCase();

  await new Promise(resolve => setTimeout(resolve, 800)); // Simular "digitando..."

  try {
    // CONDICIONAL: FILA GERAL / ESPERA
    if (text.includes('quantos') && (text.includes('fila') || text.includes('aguardando') || text.includes('pacientes'))) {
      const waiting = await prisma.patient.count({ where: { status: 'WAITING' } });
      const offered = await prisma.patient.count({ where: { status: 'OFFERED' } });
      return {
        text: `Neste exato minuto, chefe, temos **${waiting} pacientes aguardando** regulação inicial e **${offered} em solicitação** de vaga ativa na mesa!`,
        sender: 'ai',
        actions: [{ label: 'Ver Fila Dinâmica', payload: 'NAV_QUEUE' }],
        image: '/cirila_2.png'
      };
    }

    // CONDICIONAL: GRAVIDADE
    if (text.includes('vermelha') || text.includes('grave') || text.includes('emergencia') || text.includes('emergência')) {
      const critical = await prisma.patient.count({ where: { severity: 'SALA_VERMELHA', status: { in: ['WAITING', 'OFFERED'] } } });
      return {
        text: critical > 0 
          ? `Alerta Vermelho! Temos **${critical} pacientes** com prioridade máxima (Vaga Zero) parados na Sala Vermelha.` 
          : `Boas notícias! Censo zerado na Sala Vermelha para os aguardos atuais!`,
        sender: 'ai',
        image: '/cirila_2.png'
      };
    }

    // CONDICIONAL: ANEXO
    if (text.includes('laudo') || text.includes('anexo') || text.includes('.pdf') || text.includes('.jpg')) {
      return {
        text: `Arquivo escaneado e recebido! Vou encaminhar o laudo para a equipe médica reguladora do SMSVR analisar! Posso disparar cobranças ou vagas baseadas nele agora mesmo.`,
        sender: 'ai',
        actions: [
          { label: 'Disparar Vagas (Massa)', payload: 'TRIGGER_BLAST' },
          { label: 'Cobrar NIRs Atrasados', payload: 'TRIGGER_CHARGE' }
        ],
        image: '/cirila_2.png'
      };
    }

    // CONDICIONAL: COBRAR NIRS OU DISPARAR VAGAS DIRETAMENTE
    if (text.includes('cobrar') || text.includes('atrasado') || text.includes('nir')) {
      return {
        text: `Com certeza. Posso iniciar uma rotina de checagem. Deseja cobrar os NIRs com evolução pendente agora?`,
        sender: 'ai',
        actions: [{ label: 'Sim, disparar cobranças', payload: 'TRIGGER_CHARGE' }]
      };
    }

    // CONDICIONAL DE FINALIZAÇÃO (Adeus/Obrigado)
    if (text.includes('obrigad') || text.includes('valeu') || text.includes('tchau') || text.includes('encerrar')) {
      return {
        text: `Disponha, chefe! A equipe de Inteligência Artificial da CIR-A está sempre de prontidão. Boa regulação!`,
        sender: 'ai',
        image: '/cirila_icone.png'
      };
    }

    // --- NOVO: DISPARO DE E-MAIL POR COMANDO ---
    if (text.includes('enviar') || text.includes('mande') || text.includes('disparar')) {
      const hospitals = await prisma.hospital.findMany();
      const patients = await prisma.patient.findMany({ where: { status: 'WAITING' } });
      
      // Tentar encontrar o nome do paciente no texto (busca simples)
      const targetPatient = patients.find(p => text.includes(p.name.toLowerCase()));
      
      if (targetPatient) {
        let isPublic = text.includes('publica') || text.includes('pública') || text.includes('rede');
        let isPrivate = text.includes('privado') || text.includes('contratado') || text.includes('particular');
        
        // Se não especificou, assume que quer saber as opções
        if (!isPublic && !isPrivate) {
          return {
            text: `Encontrei o paciente **${targetPatient.name}** na fila. Para qual rede deseja realizar o disparo agora?`,
            sender: 'ai',
            actions: [
              { label: 'Disparar Rede Pública', payload: `SEND_MAIL_${targetPatient.id}_PUBLIC` },
              { label: 'Rede Pública + Privado', payload: `SEND_MAIL_${targetPatient.id}_ALL` }
            ],
            image: '/cirila_2.png'
          };
        }

        // Lógica de Triagem (Regra Nelson Gonçalves)
        const isCti = targetPatient.severity === 'CTI' || targetPatient.severity === 'SALA_VERMELHA' || targetPatient.severity === 'CRITICAL';
        
        return {
          text: `Entendido! Paciente **${targetPatient.name}** tem perfil ${isCti ? '**CTI/Grave**' : '**Clínico**'}. Vou preparar os e-mails para a rede ${isPublic ? 'Pública' : 'Privada'}. Confirma o envio?`,
          sender: 'ai',
          actions: [
            { label: 'Sim, disparar e-mails', payload: `EXECUTE_SEND_${targetPatient.id}_${isPublic ? 'PUBLIC' : 'ALL'}` },
            { label: 'Cancelar', payload: 'CANCEL' }
          ],
          image: '/cirila_2.png'
        };
      }
    }

    if (text.includes('disparar') || text.includes('vaga') || text.includes('email')) {
      return {
        text: `Posso iniciar um disparo de malha de e-mails para Hospitais Públicos e Privados agora mesmo. Confirma?`,
        sender: 'ai',
        actions: [{ label: 'Sim, disparar agora', payload: 'TRIGGER_BLAST' }],
        image: '/cirila_2.png'
      };
    }

    // RESPOSTA PADRÃO
    return {
      text: `Entendido! Você pode me perguntar sobre o estado da fila de pacientes ("quantos na sala vermelha?"), cadastrar hospitais no painel, ou me pedir para disparar mensagens: "Cirila, enviar paciente João para rede pública".`,
      sender: 'ai',
      actions: [
        { label: 'Gerenciar Hospitais', payload: 'NAV_HOSPITALS' },
        { label: 'Como estão as filas?', payload: 'QUERY_QUEUE' }
      ],
      image: '/cirila_2.png'
    };
  } catch (err) {
    return { text: `Desculpe chefe, meus fios esbarraram no servidor. Nao consegui ler o banco de dados.`, sender: 'ai' };
  }
}
