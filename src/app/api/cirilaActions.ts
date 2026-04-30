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

  const validProfs = ['paola', 'inima', 'inimá', 'carlos', 'roberto', 'sabrina', 'barenco', 'rosely', 'mazoni'];

  const expandExams = (examStr: string): string => {
    const upper = examStr.toUpperCase();
    let baseType = '';
    if (upper.includes('ANGIOTC')) baseType = 'ANGIOTC';
    else if (upper.includes('TC')) baseType = 'TC';
    else if (upper.includes('RNM') || upper.includes('RESSONANCIA')) baseType = 'RNM';
    else if (upper.includes('COLANGIO')) baseType = 'COLANGIO RNM';

    const parts = upper.split(/,|\s+E\s+/).map(p => p.trim());
    const expanded = parts.map(p => {
      if (baseType && !p.includes(baseType)) {
        return `${baseType} ${p.replace(/^DE\s+/, '')}`;
      }
      return p;
    });
    return expanded.join(', ');
  };

  // 0. Caso especial: Extração de Pedido de Documento (Upload)
  if (text.includes('extraído do documento')) {
    // Tenta encontrar o nome do paciente no bloco de texto
    const lines = query.split('\n');
    let patientFound = '';
    let examFound = '';

    for (const line of lines) {
      const upperLine = line.toUpperCase();
      if (upperLine.includes('PACIENTE:') || upperLine.includes('NOME:') || upperLine.includes('NOME DO PACIENTE:')) {
        patientFound = line.split(':').pop()?.trim().toUpperCase() || '';
      }
      // Tenta identificar o exame
      Object.keys(examMap).forEach(trigger => {
        if (upperLine.includes(trigger.toUpperCase()) && !examFound) {
          examFound = upperLine;
        }
      });
    }

    if (patientFound && examFound) {
      const cleanExam = expandExams(examFound);
      return {
        text: `Identifiquei o pedido no documento! \n\n**Paciente:** ${patientFound} \n**Exame:** ${cleanExam} \n\nQual profissional deve assinar a etiqueta? (Ex: Paola, Inimá, Barenco...)`,
        sender: 'ai',
        actions: validProfs.slice(0, 4).map(p => ({
          label: `Assinar como ${p.toUpperCase()}`,
          payload: `Gerar etiqueta de ${cleanExam} para ${patientFound} assinado por ${p}`
        }))
      };
    } else if (examFound) {
       return {
        text: `Identifiquei o exame (**${expandExams(examFound)}**) no documento, mas não consegui ler o nome do paciente. \n\nPor favor, digite o nome do paciente para eu gerar a etiqueta.`,
        sender: 'ai'
      };
    }

    return {
      text: `Recebi o texto do documento, mas não consegui identificar automaticamente o paciente e o exame. \n\nVocê pode me pedir assim: "Gerar etiqueta de [EXAME] para [PACIENTE] assinado por [PROFISSIONAL]"`,
      sender: 'ai'
    };
  }

  const isGenerating = text.includes('gerar') || text.includes('gera ');

  if (isGenerating) {
    const isSobreaviso = text.includes('sobreaviso') && (text.includes('documento') || text.includes('word') || text.includes('planilha'));
    const isStandaloneKey = text.includes('chave avulsa') || text.includes('chaves para sobreaviso') || (text.includes('chave') && !text.includes('para '));
    const keyQtyMatch = text.match(/gerar (\d+) chaves?/);

    if (isSobreaviso || isStandaloneKey || keyQtyMatch) {
      const count = keyQtyMatch ? parseInt(keyQtyMatch[1]) : (text.includes('sobreaviso') ? 15 : (text.includes('chave avulsa') ? 1 : 5));

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

    if (text.toLowerCase().includes('etiqueta')) {
      // Tentativa 1: Formato natural "Gerar [EXAME] para [PACIENTE] [na/com] etiqueta [PROF]" ou "assinado por [PROF]"
      let etiquetaMatch = text.match(/gerar\s+etiqueta\s+(?:de\s+)?(.+?)\s+para\s+([a-záàâãéèêíïóôõöúç\s]+?)(?:\s*(?:,|\s+)(?:na\s+|com\s+|do\s+|da\s+|assinado por\s+|assinada por\s+)?(?:etiqueta\s+)?(?:da\s+|do\s+)?([a-záàâãéèêíïóôõöúç\s]+))?$/i);
      
      // Fallback se o "etiqueta" estiver no final
      if (!etiquetaMatch) {
        etiquetaMatch = text.match(/gerar\s+(.+?)\s+para\s+([a-záàâãéèêíïóôõöúç\s]+?)(?:\s*(?:,|\s+)(?:na\s+|com\s+|do\s+|da\s+|assinado por\s+|assinada por\s+)?etiqueta\s+(?:da\s+|do\s+)?([a-záàâãéèêíïóôõöúç\s]+))?$/i);
      }

      if (etiquetaMatch) {
        const examRaw = etiquetaMatch[1].trim();
        const exam = expandExams(examRaw);
        const patient = etiquetaMatch[2].trim().toUpperCase();
        const professionalRaw = (etiquetaMatch[3] || '').trim().toLowerCase().split(/\s+/)[0];
        
        if (!professionalRaw || !validProfs.includes(professionalRaw)) {
          return {
            text: `Chefe, não identifiquei qual enfermeiro(a) supervisor(a) vai assinar esta etiqueta para **${patient}**. \n\nPor favor, informe o nome (ex: Paola, Inimá, Carlos, Roberto, Sabrina ou Barenco).`,
            sender: 'ai',
            actions: validProfs.slice(0, 4).map(p => ({
              label: `Assinar como ${p.toUpperCase()}`,
              payload: `Gerar etiqueta de ${exam} para ${patient} assinado por ${p}`
            }))
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

    // Mapa de Sobreaviso
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

    // Autorização de Exames (Texto no Chat)
    const patientMatch = text.match(/para\s+([a-záàâãéèêíïóôõöúç\s]+)/i);
    const patientName = patientMatch ? patientMatch[1].trim().toUpperCase() : 'PACIENTE NÃO IDENTIFICADO';

    const authorizations: string[] = [];
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const textForExams = patientMatch ? text.replace(patientMatch[0], '').trim() : text;

    Object.entries(examMap).forEach(([trigger, info]) => {
      const examRegex = new RegExp(`(${trigger})(\\s+de\\s+[a-záàâãéèêíïóôõöúç\\s,]+)?`, 'gi');
      let match;
      while ((match = examRegex.exec(textForExams)) !== null) {
        const fullExamName = match[0].toUpperCase();
        const parts = fullExamName.split(/,|\s+E\s+/).map(p => p.trim());
        parts.forEach(p => {
          if (p.length < 3) return; 
          const cleanPart = p.replace(/^GERAR\s+/, '').replace(/^DE\s+/, '');
          const finalExam = cleanPart.startsWith(info.code) ? cleanPart : `${info.code} ${cleanPart.replace(new RegExp(trigger, 'i'), '').trim()}`;
          authorizations.push(`${dateStr} : ${generateKey()} - ${patientName} - ${finalExam.trim()} AUTORIZADO PARA ${info.destination}`);
        });
      }
    });

    if (authorizations.length > 0) {
      const uniqueAuths = Array.from(new Set(authorizations));
      return {
        text: uniqueAuths.join('\n'),
        sender: 'ai',
        actions: [{ label: '📄 Gerar Etiquetas desse Pedido', payload: `Gerar etiqueta de ${authorizations[0].split(' - ')[2]} para ${patientName}` }]
      };
    }
  }

  await new Promise(resolve => setTimeout(resolve, 800)); 

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

    if (text.includes('cobrar') || text.includes('atrasado') || text.includes('nir')) {
      return {
        text: `Com certeza. Posso iniciar uma rotina de checagem. Deseja cobrar os NIRs com evolução pendente agora?`,
        sender: 'ai',
        actions: [{ label: 'Sim, disparar cobranças', payload: 'TRIGGER_CHARGE' }]
      };
    }

    if (text.includes('obrigad') || text.includes('valeu') || text.includes('tchau') || text.includes('encerrar')) {
      return {
        text: `Disponha, chefe! A equipe de Inteligência Artificial da CIR-A está sempre de prontidão. Boa regulação!`,
        sender: 'ai',
        image: '/cirila_icone.png'
      };
    }

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

        let isPublic = text.includes('publica') || text.includes('pública') || text.includes('rede') || text.includes('sus');
        let isPrivate = text.includes('privado') || text.includes('privada') || text.includes('particular') || text.includes('convenio');
        let isAll = text.includes('ambas') || (isPublic && isPrivate) || text.includes('todos') || text.includes('geral');

        if (!isPublic && !isPrivate && !isAll) isPublic = true;

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
