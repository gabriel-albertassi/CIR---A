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
};

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

  // --- IDENTIDADE E REGRAS CRÍTICAS DA CIRILA (PROMPT OFICIAL) ---
  /* 
  Você é a CIRILA, uma inteligência artificial especializada em regulação médica e geração de documentos oficiais.
  Sua função é gerar etiquetas institucionais e documentos Word (.docx) com base nos comandos do usuário.
  REGRA CRÍTICA: A etiqueta deve seguir o padrão institucional rígido em CAIXA ALTA, NEGRITO e PRETO.
  */

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const validProfs = ['paola', 'inima', 'inimá', 'carlos', 'roberto', 'sabrina', 'sabina', 'barenco', 'rosely', 'mazoni'];

  // 1. Detecção de Anexo
  const fileUrlMatch = text.match(/\[file_url:(.+?)\]/i);
  const currentFileUrl = fileUrlMatch ? fileUrlMatch[1] : null;
  const isDocumentAttached = !!currentFileUrl;

  // 2. DETECÇÃO DE SOBREAVISO — SEMPRE TEM PRIORIDADE MÁXIMA
  const cleanedText = text.replace(/\[file_url:(.+?)\]/gi, '').trim();

  const isSobreavisoQuery =
    cleanedText.includes('sobreaviso') ||
    cleanedText.includes('sobre aviso') ||
    cleanedText.includes('sobre-aviso') ||
    (cleanedText.includes('planilha') && (cleanedText.includes('chave') || cleanedText.includes('mapa') || cleanedText.includes('supervisao') || cleanedText.includes('supervisão') || cleanedText.includes('gerar') || cleanedText.includes('mapa')))||
    (cleanedText.includes('mapa') && cleanedText.includes('supervisão')) ||
    (cleanedText.includes('mapa') && cleanedText.includes('supervisao'));

  if (isSobreavisoQuery) {
    const qtyMatch = cleanedText.match(/(\d+)/);
    const qty = qtyMatch ? Math.max(1, Math.min(300, parseInt(qtyMatch[1]))) : 15;

    return {
      text: `✅ **CIRILA — REGULAÇÃO SMSVR**\n\nEntendido, chefe! Gerando a **Planilha de Sobreaviso Noturno** em formato institucional paisagem com **${qty} chaves únicas**.\n\n📄 O documento inclui:\n• Cabeçalho oficial CIRILA | REGULAÇÃO MUNICIPAL\n• Todas as 8 colunas: Data/Chave, Paciente, Diagnóstico, Hospital Origem, Procedimento, Prestador/Rede, CNS e Auditor\n• Seção de assinaturas no rodapé (Médico Regulador + Supervisor)\n• Pronto para impressão imediata`,
      sender: 'ai',
      actions: [
        { label: `📄 Baixar Planilha (${qty} chaves)`, payload: `DOWNLOAD_DOCX_${qty}` },
        { label: '10 chaves', payload: 'DOWNLOAD_DOCX_10' },
        { label: '15 chaves', payload: 'DOWNLOAD_DOCX_15' },
        { label: '20 chaves', payload: 'DOWNLOAD_DOCX_20' },
        { label: '30 chaves', payload: 'DOWNLOAD_DOCX_30' },
        { label: '50 chaves', payload: 'DOWNLOAD_DOCX_50' },
      ]
    };
  }

  // 3-A. ETIQUETAS AVULSAS — SOMENTE quando não há anexo E o texto pede explicitamente avulsa/branca/limpa
  const isAvulsaQuery =
    !isDocumentAttached && (
      cleanedText.includes('avulsa') ||
      (cleanedText.includes('etiqueta') && (
        cleanedText.includes('branca') ||
        cleanedText.includes('limpa') ||
        cleanedText.includes('vazia')
      ))
    );

  if (isAvulsaQuery) {
    const qtyMatch = cleanedText.match(/(\d+)/);
    const qty = qtyMatch ? Math.max(1, Math.min(50, parseInt(qtyMatch[1]))) : 1;
    const professionalRaw = validProfs.find(p => cleanedText.includes(p)) || '';
    const authKey = generateKey();

    if (!professionalRaw) {
      return {
        text: `Entendido, chefe! Vou gerar **${qty} etiqueta(s) avulsa(s)**.\n\nQuem assina pela DCRAA hoje?`,
        sender: 'ai',
        actions: ['paola', 'inima', 'carlos', 'roberto', 'sabrina', 'barenco'].map(p => ({
          label: p.toUpperCase(),
          payload: `gerar ${qty} etiqueta avulsa assinado por ${p}`
        }))
      };
    }

    return {
      text: `✅ **CIRILA:** Gerando **${qty} etiqueta(s) avulsa(s)** para preenchimento manual, assinadas por **${professionalRaw.toUpperCase()}**.\n\nFormato: \`[DATA] : [CHAVE] - PACIENTE A PREENCHER - EXAME AUTORIZADO PARA DESTINO\``,
      sender: 'ai',
      actions: [{
        label: `📄 Baixar ${qty} Etiqueta(s) Avulsa(s)`,
        payload: `DOWNLOAD_ETIQUETA_DOCX:::AVULSA:::AVULSA:::${professionalRaw}:::${authKey}::::::${qty}:::bottom`
      }]
    };
  }

    // 3-B. ETIQUETA REGULAR (com ou sem PDF)
  const isGeneratingEtiqueta = (text.includes('gerar') || text.includes('gera') || text.includes('chave') || text.includes('autoriza')) && (
    text.includes('etiqueta') ||
    text.includes('tc') ||
    text.includes('rnm') ||
    text.includes('rmn') ||
    text.includes('angiotc') ||
    text.includes('chave') ||
    text.includes('ressonancia') ||
    text.includes('tomografia') ||
    text.includes('eco') ||
    text.includes('ecografia')
  );

  // 4. GERAÇÃO DE CHAVES AVULSAS (SEM DOCUMENTO) - REGRA: APENAS LISTA NO CHAT
  const isKeyOnlyQuery = cleanedText.match(/gerar\s+(\d+)\s+chaves/i);
  if (isKeyOnlyQuery && !isGeneratingEtiqueta && !isSobreavisoQuery) {
    const qty = Math.min(100, parseInt(isKeyOnlyQuery[1]));
    const keys = Array.from({ length: qty }, (_, i) => `${String(i + 1).padStart(2, '0')}. **${generateKey()}**`).join('\n');
    return {
      text: `✅ **CHAVES GERADAS COM SUCESSO:**\n\n${keys}\n\n*Copie as chaves acima para uso imediato.*`,
      sender: 'ai'
    };
  }

  if (isGeneratingEtiqueta) {

    /* 
    // --- REGRA CRÍTICA: EXIGE ANEXO PARA ETIQUETAS DE REGULAÇÃO (DESATIVADO POR SOLICITAÇÃO) ---
    if (!isDocumentAttached && !cleanedText.includes('avulsa')) {
      return {
        text: `Olá! Eu sou a **CIRILA** e estou pronta para regular este pedido. 🤖\n\n⚠️ **Regra de Segurança:** Para garantir a integridade do processo, preciso que você **anexe o documento original (PDF ou Word)**.\n\nAssim que você anexar, poderei inserir a etiqueta oficial no final da folha preservando 100% do conteúdo original. Estou aguardando seu arquivo!`,
        sender: 'ai'
      };
    }
    */


    // PADRÃO B: Etiqueta Única / Lote (Regex mais robusto)
    let examRaw = "EXAME";
    let patient = "PACIENTE";
    let hospitalOrigin = "HOSPITAL ORIGEM";
    let professionalRaw = "";

    // 1. Captura Hospital (geralmente sigla no final ou após o nome)
    // Necessário declarar antes do exame para evitar erro de escopo
    const hospMatch = cleanedText.match(/\b(hsjb|hmmr|hospital\s+sao\s+joao\s+batista|hospital\s+municipal|municipar|santa\s+casa|unimed|hmvr|upa|cais|hinja|santana|santa\s+cecilia|santa\s+cecília)\b/i);
    if (hospMatch) {
      const h = hospMatch[0].toUpperCase();
      if (h.includes('SAO JOAO BATISTA') || h.includes('HSJB')) hospitalOrigin = 'HSJB';
      else if (h.includes('MUNICIPAL') || h.includes('MUNICIPAR') || h.includes('HMMR')) hospitalOrigin = 'HMMR';
      else hospitalOrigin = h;
    }


    // 2. Capturar Exame (Mais robusto)
    const examMatch = cleanedText.match(/(?:gerar|gera|solicitar)\s+(.+?)(?:\s+para|\s+paciente|\s+assinado|\s+assinada|,|;|\n|$)/i);
    if (examMatch && examMatch[1]) {
      let candidate = examMatch[1].trim().toUpperCase();
      // Se o candidato for apenas um hospital ou profissional, limpa
      if (!hospMatch || !candidate.includes(hospMatch[0].toUpperCase())) {
        examRaw = candidate;
      }
    }

    // Fallback para keywords se a captura falhar ou for muito genérica
    const examKeywords: Record<string, string> = {
      'angiotc': 'ANGIOTC',
      'angio': 'ANGIOTC',
      'rnm': 'RESSONÂNCIA',
      'rmn': 'RESSONÂNCIA',
      'ressonancia': 'RESSONÂNCIA',
      'ressonância': 'RESSONÂNCIA',
      'tomografia': 'TC',
      'ecografia': 'ECOGRAFIA',
      'ecocardiograma': 'ECOCARDIOGRAMA',
      'eco': 'ECOCARDIOGRAMA',
      'endoscopia': 'ENDOSCOPIA',
      'colonoscopia': 'COLONOSCOPIA',
      'holter': 'HOLTER',
      'mapa': 'MAPA PRESSÓRICO',
      'ergo': 'ERGOMETRIA',
      'densitometria': 'DENSITOMETRIA',
      'mamografia': 'MAMOGRAFIA',
      'cintilografia': 'CINTILOGRAFIA',
      'pet': 'PET-SCAN',
      'biópsia': 'BIÓPSIA',
      'biopsia': 'BIÓPSIA',
    };
    
    if (examRaw === "EXAME") {
      for (const [kw, label] of Object.entries(examKeywords)) {
        if (cleanedText.includes(kw)) { examRaw = label; break; }
      }
    }
    if (examRaw === 'EXAME' && (cleanedText.includes(' tc ') || cleanedText.startsWith('tc '))) examRaw = 'TC';

    // Limpeza do Exame
    examRaw = examRaw.replace(/\b(ETIQUETA|CHAVE|PARA|PACIENTE|ASSINADO|ASSINADA|SEM|COM|NO|CHAT|APENAS|TEXTO|SÓ|SO)\b/gi, '').trim();
    if (!examRaw) examRaw = "EXAME";

    // 3. Extrair Paciente
    let foundPatient = false;
    
    // Camada 1: "para [nome]" - Pega tudo entre "para" e o hospital ou fim da linha
    const m1 = cleanedText.match(/para\s+([^,;.\n\-\(\)]+)/i);
    if (m1 && m1[1]) {
      let candidate = m1[1].trim();
      // Remove hospital se ele foi capturado junto no match de candidate
      if (hospMatch) {
        const hospName = hospMatch[0].toLowerCase();
        candidate = candidate.toLowerCase().replace(new RegExp(`\\b${hospName}\\b`, 'g'), '').trim();
      }
      // Remove flags como "sem etiqueta"
      candidate = candidate.replace(/\b(sem|com|etiqueta|no|chat|apenas|texto|so|só)\b/gi, '').trim();

      if (candidate && candidate.length > 2 && 
          !validProfs.some(p => candidate.toLowerCase() === p) && 
          !Object.keys(examKeywords).some(k => candidate.toLowerCase().includes(k))) {
        patient = candidate.toUpperCase();
        foundPatient = true;
      }
    }

    if (!foundPatient) {
      const m2 = cleanedText.match(/paciente\s+([\w\s]{3,40?}?)(?:\s+assinado|\s+assinada|,|;|\n|$)/i);
      if (m2 && m2[1]) {
        patient = m2[1].trim().toUpperCase();
        foundPatient = true;
      }
    }

    // Camada Final: Limpeza agressiva
    patient = patient.replace(/\b(HSJB|HMMR|UPA|CAIS|HMVR|HINJA|ASSINADO|ASSINADA|COM|SEM|ETIQUETA|NO|CHAT|APENAS|TEXTO|SÓ|SO)\b/gi, '').trim();
    if (!patient) patient = "PACIENTE";

    // 3. Profissional
    professionalRaw = validProfs.find(p => cleanedText.includes(p)) || "";

    if (!professionalRaw) {
      return {
        text: `Chefe, para regular o processo, preciso saber quem assina pela **DCRAA**.\n\n(Opções: Paola, Inimá, Carlos, Roberto, Sabrina ou Barenco)`,
        sender: 'ai',
        actions: ['paola', 'inima', 'carlos', 'roberto', 'sabrina', 'barenco'].map(p => ({
          label: `Assinar como ${p.toUpperCase()}`,
          payload: `${query} assinado por ${p}`
        }))
      };
    }


    const authKey = generateKey();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const destination = (kw: string) => {
      const e = kw.toUpperCase();
      if (e.includes('ANGIO')) return 'HMMR';
      if (e.includes('RNM') || e.includes('RMN') || e.includes('RESSONANCIA')) return 'RADIO VIDA';
      return 'HSJB';
    };

    const labelText = `${dateStr} : ${authKey} - ${patient} – ${hospitalOrigin} - ${examRaw} AUTORIZADO PARA ${destination(examRaw)}`;

    // NOVO: Se o usuário pedir "sem etiqueta", "no chat" ou "apenas texto"
    const isChatOnly = cleanedText.includes('sem etiqueta') || cleanedText.includes('no chat') || cleanedText.includes('apenas texto') || cleanedText.includes('só texto');

    if (isChatOnly) {
      return {
        text: `✅ **CIRILA — AUTORIZAÇÃO GERADA**\n\nAqui está sua etiqueta institucional pronta para uso:\n\n\`${labelText}\`\n\n**Chave Única:** ${authKey}\n**Assinado por:** ${professionalRaw.toUpperCase()}\n\n*Processo concluído com sucesso.*`,
        sender: 'ai'
      };
    }


    const pos = 'bottom'; // REGRA: Sempre no FINAL da folha

    if (!isDocumentAttached) {
      return {
        text: `✅ **CIRILA:** Autorização gerada para **${patient}**. \n\nComo você não enviou anexo, aqui está a etiqueta para copiar:\n\n\`${labelText}\`\n\nTambém gerei um documento Word vazio apenas com ela no final, caso precise:`,
        sender: 'ai',
        actions: [{
          label: '📄 Baixar Etiqueta (.docx)',
          payload: `DOWNLOAD_ETIQUETA_DOCX:::${patient.replace(/\s/g, '+')}:::${examRaw.replace(/\s/g, '+')}:::${professionalRaw}:::${authKey}:::${currentFileUrl || ''}:::1:::${pos}:::${hospitalOrigin.replace(/\s/g, '+')}`
        }]
      };
    }

    return {
      text: `✅ **CIRILA:** Perfeito! Documento recebido.\n\nEstou processando a autorização para **${patient}** (Hospital: ${hospitalOrigin}). \n\nEtiqueta gerada:\n\`${labelText}\` \n\nO arquivo Word com a etiqueta no **FINAL DA FOLHA** está pronto:`,
      sender: 'ai',
      actions: [{
        label: '📄 Baixar Pedido Autorizado (.docx)',
        payload: `DOWNLOAD_ETIQUETA_DOCX:::${patient.replace(/\s/g, '+')}:::${examRaw.replace(/\s/g, '+')}:::${professionalRaw}:::${authKey}:::${currentFileUrl}:::1:::${pos}:::${hospitalOrigin.replace(/\s/g, '+')}`
      }]
    };
  }


  // --- RESPOSTAS DE CONTEXTO GERAL ---

  if (text.includes('o que você sabe fazer') || text.includes('ajuda') || text.includes('quem é você')) {
    return {
      text: `Olá! Eu sou a **CIRILA**, sua Inteligência Artificial especializada em regulação médica da SMSVR. 🤖🏥\n\nMinhas capacidades principais:\n\n1. **Geração de Etiquetas**: Insiro etiquetas oficiais (Caixa Alta, Negrito, Preto) no final dos seus documentos autorizados.\n2. **Planilhas de Sobreaviso**: Gerador de mapas de supervisão noturna em modo paisagem com colunas institucionais.\n3. **Gestão de Chaves**: Posso gerar listas de chaves únicas diretamente aqui no chat.\n4. **Triagem Inteligente**: Extraio automaticamente Paciente, Hospital de Origem e Exame dos seus comandos.\n\n**Como posso agilizar seu processo agora?**`,
      sender: 'ai',
      image: '/cirila_2.png'
    };
  }

  if (isDocumentAttached && !isGeneratingEtiqueta) {
    return {
      text: `Recebi seu documento, chefe! 📄 \n\nPara que eu possa gerar a autorização corretamente, me diga: **Qual o exame e o nome do paciente?** \n\n *Exemplo: "Gerar TC de crânio para João Silva, etiqueta Inimá"*`,
      sender: 'ai'
    };
  }

  // Fallback
  return {
    text: `Entendido chefe! Estou pronta para regular.\n\nSe tiver um pedido médico, anexe o arquivo PDF e me dê o comando.\n\nPara gerar a **Planilha de Sobreaviso**, escolha a quantidade de chaves abaixo ou diga: *"Gerar planilha sobreaviso com 20 chaves"*`,
    sender: 'ai',
    actions: [
      { label: '📄 Sobreaviso — 10 chaves', payload: 'DOWNLOAD_DOCX_10' },
      { label: '📄 Sobreaviso — 15 chaves', payload: 'DOWNLOAD_DOCX_15' },
      { label: '📄 Sobreaviso — 20 chaves', payload: 'DOWNLOAD_DOCX_20' },
      { label: '📄 Sobreaviso — 30 chaves', payload: 'DOWNLOAD_DOCX_30' },
      { label: '📄 Sobreaviso — 50 chaves', payload: 'DOWNLOAD_DOCX_50' },
      { label: 'Como anexar?', payload: 'ajuda' },
    ]
  };
}
