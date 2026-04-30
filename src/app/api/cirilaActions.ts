'use server'

import { prisma } from '@/lib/db'
import { sendHospitalNotification } from '@/lib/mail'
import { getUnreadNotifications } from '@/lib/notifications'

export type CirilaResponse = {
  text: string;
  sender: 'ai' | 'user';
  actions?: { label: string, payload: string }[];
  image?: string;
}

/**
 * Função real para disparar os e-mails baseada na triagem inteligente
 */
export async function executeEmailDispatch(patientId: string, targetType: string) {
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
      if (h.type !== 'PUBLICO' && !(patient as any).is_private) return false;

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

    // Preparar Anexos: Malote + Evolução Médica
    const attachments = [];
    if (patient.attachment_url) {
      attachments.push({
        filename: patient.attachment_name || 'malote-paciente.pdf',
        path: patient.attachment_url
      });
    }
    if ((patient as any).evolution_url) {
      attachments.push({
        filename: (patient as any).evolution_name || 'evolucao-medica.pdf',
        path: (patient as any).evolution_url
      });
    }

    await sendHospitalNotification({
      to: emails,
      subject: `Solicitação de Vaga: ${patient.name}`,
      patientName: patient.name,
      patientId: patient.id,
      severity: patient.severity,
      originHospital: patient.origin_hospital,
      diagnosis: patient.diagnosis,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    return { success: true, count: emails.length, targetNames: targets.map(h => h.name) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function askCirila(query: string): Promise<CirilaResponse> {
  const text = query.toLowerCase();

  // --- LÓGICA DE REGULAÇÃO DE EXAMES E CHAVES (CIRILA ESPECIALIZADA) ---

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const examMap: Record<string, { code: string, destination: string }> = {
    'tc': { code: 'TC', destination: 'HSJB' },
    'tomografia': { code: 'TC', destination: 'HSJB' },
    'angiotc': { code: 'ANGIOTC', destination: 'HMMR' },
    'angiotomografia': { code: 'ANGIOTC', destination: 'HMMR' },
    'rnm': { code: 'RNM', destination: 'RADIO VIDA' },
    'ressonancia': { code: 'RNM', destination: 'RADIO VIDA' },
    'ressonância': { code: 'RNM', destination: 'RADIO VIDA' },
    'colangio rnm': { code: 'COLANGIO RNM', destination: 'RADIO VIDA' },
    'colangiornm': { code: 'COLANGIO RNM', destination: 'RADIO VIDA' },
    'colangio ressonância': { code: 'COLANGIO RNM', destination: 'RADIO VIDA' },
    'colangio ressonancia': { code: 'COLANGIO RNM', destination: 'RADIO VIDA' },
  };

  const isGenerating = text.includes('gerar') || text.includes('gera ');

  if (isGenerating) {
    // 1. Caso: Chaves Avulsas ou Documentos (ex: "Gerar 10 chaves", "Gerar planilha de sobreaviso")
    const isSobreaviso = text.includes('sobreaviso') && (text.includes('documento') || text.includes('word') || text.includes('planilha'));
    const isStandaloneKey = text.includes('chave avulsa') || text.includes('chaves para sobreaviso') || (text.includes('chave') && !text.includes('para '));
    const keyQtyMatch = text.match(/gerar (\d+) chaves?/);

    if (isSobreaviso || isStandaloneKey || keyQtyMatch) {
      const count = keyQtyMatch ? parseInt(keyQtyMatch[1]) : (text.includes('sobreaviso') ? 15 : (text.includes('chave avulsa') ? 1 : 5));

      // Caso especial: Documento Word (Sobreaviso)
      if (isSobreaviso) {
        return {
          text: `Gerando documento de sobreaviso com **${count} chaves**... Clique no botão abaixo para baixar.`,
          sender: 'ai',
          actions: [{ label: '⬇️ Baixar Documento (.docx)', payload: `DOWNLOAD_DOCX_${count}` }]
        };
      }

      const keys = Array.from({ length: count }, () => generateKey());
      return {
        text: keys.join('\n'),
        sender: 'ai'
      };
    }

    // 2. Caso: Etiqueta Profissional (Word)
    // Ex: "Gerar TC de crânio para Gabriel Albertassi, etiqueta Paola"
    // Ou: "30/04/2026 : XEF5H - PACIENTE - EXAME ETIQUETA INIMÁ"
    if (text.toLowerCase().includes('etiqueta')) {
      // 2.1: Função auxiliar para expandir exames (ex: "TC de tórax e abdome" -> "TC DE TÓRAX, TC DE ABDOME")
      const expandExams = (examStr: string): string => {
        const upper = examStr.toUpperCase();
        let baseType = '';
        if (upper.includes('ANGIOTC')) baseType = 'ANGIOTC';
        else if (upper.includes('TC')) baseType = 'TC';
        else if (upper.includes('RNM') || upper.includes('RESSONANCIA')) baseType = 'RNM';
        else if (upper.includes('COLANGIO')) baseType = 'COLANGIO RNM';

        // Split por vírgula ou " E "
        const parts = upper.split(/,|\s+E\s+/).map(p => p.trim());
        const expanded = parts.map(p => {
          if (baseType && !p.includes(baseType)) {
            // Se a parte não tem o tipo base (ex: "ABDOME" numa lista de "TC"), adiciona
            return `${baseType} ${p.replace(/^DE\s+/, '')}`;
          }
          return p;
        });
        return expanded.join(', ');
      };

      // Tentativa 1: Formato natural "Gerar [EXAME] para [PACIENTE] [na/com] etiqueta [PROF]"
      let etiquetaMatch = text.match(/gerar\s+(.+?)\s+para\s+([a-záàâãéèêíïóôõöúç\s]+?)(?:\s*(?:,|\s+)(?:na\s+|com\s+|do\s+|da\s+)?etiqueta\s+(?:da\s+|do\s+)?([a-záàâãéèêíïóôõöúç\s]+))?$/i);
      
      // Tentativa 2: Formato direto "Etiqueta [PROF] para [PACIENTE] exame [EXAME]"
      if (!etiquetaMatch) {
        etiquetaMatch = text.match(/etiqueta\s+(?:da\s+|do\s+)?([a-záàâãéèêíïóôõöúç\s]+)\s+para\s+([a-záàâãéèêíïóôõöúç\s]+?)(?:\s*(?:,|\s+)(?:exame\s+)?(.+))?$/i);
        if (etiquetaMatch) {
          const professional = etiquetaMatch[1].trim().toLowerCase().split(/\s+/)[0];
          const patient = etiquetaMatch[2].trim().toUpperCase();
          const examRaw = (etiquetaMatch[3] || 'EXAME').trim();
          const exam = expandExams(examRaw);
          
          return {
            text: `Preparando etiquetas profissionais para **${patient}** (${exam})... Clique abaixo para baixar o arquivo pronto para impressão.`,
            sender: 'ai',
            actions: [{ 
              label: '📄 Baixar Etiquetas (.docx)', 
              payload: `DOWNLOAD_ETIQUETA_DOCX_${patient.replace(/\s/g, '+')}_${exam.replace(/\s/g, '+')}_${professional}` 
            }]
          };
        }
      }

      // Tentativa 3: Formato completo de autorização (Copy-Paste de Log)
      if (!etiquetaMatch) {
        const fullMatch = text.match(/(?:\d{2}\/\d{2}\/\d{4}\s*:\s*)?[A-Z0-9]{5}\s*-\s*(.+?)\s*-\s*(.+?)\s*ETIQUETA\s+([A-ZÀ-Úa-zà-ú\s]+)/i);
        
        if (fullMatch) {
          const patient = fullMatch[1].trim().toUpperCase();
          const examRaw = fullMatch[2].trim();
          const exam = expandExams(examRaw);
          const professional = fullMatch[3].trim().split(/\s+/)[0].toLowerCase();
          
          const validProfs = ['paola', 'inima', 'inimá', 'carlos', 'roberto', 'sabrina', 'barenco', 'rosely', 'mazoni'];
          
          if (!validProfs.includes(professional)) {
            return {
              text: `Identifiquei uma autorização para **${patient}**, mas não reconheci o nome do profissional "**${professional}**". \n\nPor favor, use um dos nomes autorizados (Paola, Inimá, Carlos, Roberto, Sabrina ou Barenco).`,
              sender: 'ai'
            };
          }

          return {
            text: `Identifiquei uma autorização completa. Gerando etiquetas para **${patient}** (${exam}) com assinatura de **${professional.toUpperCase()}**.`,
            sender: 'ai',
            actions: [{ 
              label: '📄 Baixar Etiquetas (.docx)', 
              payload: `DOWNLOAD_ETIQUETA_DOCX_${patient.replace(/\s/g, '+')}_${exam.replace(/\s/g, '+')}_${professional}` 
            }]
          };
        }
      }

      if (etiquetaMatch) {
        const examRaw = etiquetaMatch[1].trim();
        const exam = expandExams(examRaw);
        const patient = etiquetaMatch[2].trim().toUpperCase();
        const professionalRaw = (etiquetaMatch[3] || '').trim().toLowerCase().split(/\s+/)[0];
        
        const validProfs = ['paola', 'inima', 'inimá', 'carlos', 'roberto', 'sabrina', 'barenco', 'rosely', 'mazoni'];
        
        if (!professionalRaw || !validProfs.includes(professionalRaw)) {
          return {
            text: `Chefe, não identifiquei qual enfermeiro(a) supervisor(a) vai assinar esta etiqueta para **${patient}**. \n\nPor favor, informe o nome (ex: Paola, Inimá, Carlos, Roberto, Sabrina ou Barenco).`,
            sender: 'ai'
          };
        }

        return {
          text: `Preparando etiquetas profissionais para **${patient}** (${exam})... Clique abaixo para baixar o arquivo pronto para impressão.`,
          sender: 'ai',
          actions: [{ 
            label: '📄 Baixar Etiquetas (.docx)', 
            payload: `DOWNLOAD_ETIQUETA_DOCX_${patient.replace(/\s/g, '+')}_${exam.replace(/\s/g, '+')}_${professionalRaw}` 
          }]
        };
      }
    }

    // 2.2 Caso: Mapa de Sobreaviso
    if (text.includes('sobreaviso') || text.includes('mapa') || text.includes('planilha')) {
      return {
        text: `Entendido chefe! Vou gerar o **Mapa de Sobreaviso** configurado para 15 entradas. Você pode imprimir e preencher manualmente os plantões.`,
        sender: 'ai',
        actions: [{ 
          label: '📅 Baixar Mapa de Sobreaviso (.docx)', 
          payload: 'DOWNLOAD_DOCX_SOBREAVISO_15' 
        }]
      };
    }

    // 3. Caso: Autorização de Exames (Texto no Chat)
    const patientMatch = text.match(/para\s+([a-záàâãéèêíïóôõöúç\s]+)/i);
    const patientName = patientMatch ? patientMatch[1].trim().toUpperCase() : 'PACIENTE NÃO IDENTIFICADO';

    const authorizations: string[] = [];
    const dateStr = new Date().toLocaleDateString('pt-BR');

    // Removemos a parte do paciente do texto de busca de exames para evitar redundância
    const textForExams = patientMatch ? text.replace(patientMatch[0], '').trim() : text;

    // Busca por todos os exames mencionados na frase
    Object.entries(examMap).forEach(([trigger, info]) => {
      // Regex para encontrar o termo isolado ou seguido de "de" (ex: "TC de crânio")
      const examRegex = new RegExp(`(${trigger})(\\s+de\\s+[a-záàâãéèêíïóôõöúç\\s,]+)?`, 'gi');
      let match;

      while ((match = examRegex.exec(textForExams)) !== null) {
        const fullExamName = match[0].toUpperCase();

        // Ajuste para listas como "abdome e pelve" ou "tórax, abdome"
        const parts = fullExamName.split(/,|\s+E\s+/).map(p => p.trim());
        parts.forEach(p => {
          if (p.length < 3) return; // Filtra conectivos residuais
          const cleanPart = p.replace(/^GERAR\s+/, '').replace(/^DE\s+/, '');
          // Garante que o código do exame (TC/RNM) esteja no início
          const finalExam = cleanPart.startsWith(info.code) ? cleanPart : `${info.code} ${cleanPart.replace(new RegExp(trigger, 'i'), '').trim()}`;
          
          authorizations.push(`${dateStr} : ${generateKey()} - ${patientName} - ${finalExam.trim()} AUTORIZADO PARA ${info.destination}`);
        });
      }
    });

    if (authorizations.length > 0) {
      // Remover duplicatas de autorizações idênticas
      const uniqueAuths = Array.from(new Set(authorizations));
      return {
        text: uniqueAuths.join('\n'),
        sender: 'ai'
      };
    }
  }

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

    // --- NOVO: DISPARO DE E-MAIL POR COMANDO (Reconhece intenção de disparo) ---
    const lowerText = text.toLowerCase();
    const isCommand = lowerText.includes('enviar') ||
      lowerText.includes('envie') ||
      lowerText.includes('mande') ||
      lowerText.includes('manda') ||
      lowerText.includes('solicita') ||
      lowerText.includes('encaminha') ||
      lowerText.includes('peça') ||
      lowerText.includes('vaga');

    if (isCommand) {
      const hospitals = await prisma.hospital.findMany();
      const patients = await prisma.patient.findMany({ where: { status: { in: ['WAITING', 'OFFERED'] } } });

      // Busca flexível pelo nome do paciente ignorando "o paciente" ou conectivos
      const targetPatient = patients.find(p => {
        const nameNormalized = p.name.toLowerCase();
        return lowerText.includes(nameNormalized) ||
          nameNormalized.split(' ').some(part => part.length > 3 && lowerText.includes(part));
      });

      if (targetPatient) {
        const specificHospital = hospitals.find(h =>
          text.includes(h.name.toLowerCase()) ||
          (h.name.toLowerCase().includes('teste') && text.includes('teste'))
        );

        // Lógica robusta de detecção de Rede
        let isPublic = text.includes('publica') || text.includes('pública') || text.includes('rede') || text.includes('sus');
        let isPrivate = text.includes('privado') || text.includes('privada') || text.includes('particular') || text.includes('convenio');
        let isAll = text.includes('ambas') || (isPublic && isPrivate) || text.includes('todos') || text.includes('geral');

        // Se não especificou nada, assume Pública (Rede) por segurança
        if (!isPublic && !isPrivate && !isAll) isPublic = true;

        // Detecção de Tipo de Leito mencionado
        let requestedProfile = '';
        if (text.includes('cti') || text.includes('intensiv')) requestedProfile = 'CTI';
        else if (text.includes('vermelha')) requestedProfile = 'SALA VERMELHA';
        else if (text.includes('clinica') || text.includes('clínica') || text.includes('enfermaria')) requestedProfile = 'CLÍNICA MÉDICA';

        let levelText = requestedProfile || targetPatient.severity;

        if (specificHospital) {
          return {
            text: `Localizei a unidade **${specificHospital.name}**. Deseja disparar a solicitação do paciente **${targetPatient.name}** (${levelText}) somente para ela?`,
            sender: 'ai',
            actions: [
              { label: `Sim, só para ${specificHospital.name}`, payload: `EXECUTE_SEND_${targetPatient.id}_ONLY_${specificHospital.id}` },
              { label: 'Não, disparar para Rede', payload: `SEND_MAIL_${targetPatient.id}_${isPrivate ? 'PRIVATE' : 'PUBLIC'}` }
            ],
            image: '/cirila_2.png'
          };
        }

        const targetType = isAll ? 'ALL' : (isPrivate && !isPublic ? 'PRIVATE' : 'PUBLIC');
        const targetLabel = isAll ? 'Pública e Privada' : (isPrivate && !isPublic ? 'Privada' : 'Pública (Rede)');

        // ALERTA DE SEGURANÇA: Se o alvo é privado mas o paciente é público
        if ((isPrivate || isAll) && !(targetPatient as any).is_private) {
          return {
            text: `⚠️ **Atenção Chefe**: O paciente **${targetPatient.name}** não possui perfil para a rede privada cadastrado. \n\nDeseja disparar as solicitações **apenas para a rede pública**?`,
            sender: 'ai',
            actions: [
              { label: 'Sim, disparar para Rede Pública', payload: `EXECUTE_SEND_${targetPatient.id}_PUBLIC` },
              { label: 'Cancelar', payload: 'CANCEL' }
            ],
            image: '/cirila_2.png'
          };
        }

        return {
          text: `Perfeito chefe! Paciente **${targetPatient.name}** para **${levelText}**. Vou disparar a solicitação para a rede **${targetLabel}**. Posso confirmar?`,
          sender: 'ai',
          actions: [
            { label: `Confirmar Disparo (${targetLabel})`, payload: `EXECUTE_SEND_${targetPatient.id}_${targetType}` },
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

    const unread = await getUnreadNotifications();
    let notificationText = '';
    if (unread.length > 0) {
      notificationText = `\n\n📢 **Aviso**: Identifiquei **${unread.length} novas respostas** de hospitais no seu sininho! Deseja que eu faça um resumo para você?`;
    }

    return {
      text: `Entendido! Você pode me perguntar sobre o estado da fila de pacientes ("quantos na sala vermelha?"), cadastrar hospitais no painel, ou me pedir para disparar mensagens: "Ciri, solicita a vaga do paciente João para rede pública".${notificationText}`,
      sender: 'ai',
      actions: unread.length > 0 ? [
        { label: 'Ver Notificações', payload: 'NAV_NOTIFICATIONS' },
        { label: 'Como estão as filas?', payload: 'QUERY_QUEUE' }
      ] : [
        { label: 'Gerenciar Hospitais', payload: 'NAV_HOSPITALS' },
        { label: 'Como estão as filas?', payload: 'QUERY_QUEUE' }
      ],
      image: '/cirila_2.png'
    };
  } catch (err) {
    return { text: `Desculpe chefe, meus fios esbarraram no servidor. Nao consegui ler o banco de dados.`, sender: 'ai' };
  }
}
