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
  const cleanedText = text.replace(/\[file_url:.+?\]/i, '').trim();

  // 2. Detecção de Preferência de Saída (Chat Only / Sem Etiqueta)
  // REGRA: "Chave" ou "Avulsa" sem "Etiqueta" implica Chat Only e SEM ASSINATURA
  const isChatOnly = 
    cleanedText.includes('sem etiqueta') || 
    cleanedText.includes('no chat') || 
    cleanedText.includes('apenas texto') || 
    cleanedText.includes('só texto') || 
    cleanedText.includes('so texto') ||
    (cleanedText.includes('chave') && !cleanedText.includes('etiqueta')) ||
    (cleanedText.includes('avulsa') && !cleanedText.includes('etiqueta')) ||
    (cleanedText.includes('chaves') && !cleanedText.includes('etiqueta'));

  // 3. DETECÇÃO DE SOBREAVISO — SEMPRE TEM PRIORIDADE MÁXIMA
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

  // 4. GERAÇÃO DE CHAVES OU ETIQUETAS
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
    text.includes('ecografia') ||
    text.includes('avulsa')
  );

  if (isGeneratingEtiqueta && !isSobreavisoQuery) {
    // 4.1. Extração de Dados (Comum para Chat e Documento)
    let examRaw = "EXAME";
    let patient = "PACIENTE";
    let hospitalOrigin = "HOSPITAL ORIGEM";
    let professionalRaw = "";

    // Quantidade
    const batchMatch = cleanedText.match(/(\d+(?:\s+\d+)?)/);
    const qty = batchMatch ? Math.max(1, Math.min(100, parseInt(batchMatch[1].split(/\s+/).pop()!))) : (cleanedText.includes('chaves') ? 10 : 1);

    // Hospital
    const hospMatch = cleanedText.match(/\b(hsjb|hmmr|hospital\s+sao\s+joao\s+batista|hospital\s+municipal|municipar|santa\s+casa|unimed|hmvr|upa|cais|hinja|santana|santa\s+cecilia|santa\s+cecília)\b/i);
    if (hospMatch) {
      const h = hospMatch[0].toUpperCase();
      if (h.includes('SAO JOAO BATISTA') || h.includes('HSJB')) hospitalOrigin = 'HSJB';
      else if (h.includes('MUNICIPAL') || h.includes('MUNICIPAR') || h.includes('HMMR')) hospitalOrigin = 'HMMR';
      else hospitalOrigin = h;
    }

    // Exame
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
    
    for (const [kw, label] of Object.entries(examKeywords)) {
      if (cleanedText.includes(kw)) { examRaw = label; break; }
    }
    if (examRaw === 'EXAME' && (cleanedText.includes(' tc ') || cleanedText.startsWith('tc '))) examRaw = 'TC';

    // Paciente
    const m1 = cleanedText.match(/para\s+([^,;.\n\-\(\)]+)/i);
    if (m1 && m1[1]) {
      let candidate = m1[1].trim();
      if (hospMatch) {
        const hospName = hospMatch[0].toLowerCase();
        candidate = candidate.toLowerCase().replace(new RegExp(`\\b${hospName}\\b`, 'g'), '').trim();
      }
      candidate = candidate.replace(/\b(sem|com|etiqueta|no|chat|apenas|texto|so|só|chave|chaves|avulsa)\b/gi, '').trim();
      if (candidate && candidate.length > 2 && !validProfs.some(p => candidate.toLowerCase() === p)) {
        patient = candidate.toUpperCase();
      }
    }

    // Profissional
    const profMarkers = '(?:assinado|assinada|por|etiqueta|regulação|regulador|assinatura|ass|at|pela)';
    const explicitProfMatch = cleanedText.match(new RegExp(`${profMarkers}\\s+\\b(${validProfs.join('|')})\\b`, 'i'));
    if (explicitProfMatch) {
      professionalRaw = explicitProfMatch[1].toLowerCase();
    } else {
      const potentialProf = validProfs.find(p => new RegExp(`\\b${p}\\b\\s*$`, 'i').test(cleanedText));
      professionalRaw = potentialProf || "";
    }

    // --- REGRAS DE SAÍDA ---
    const authKey = generateKey();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const destination = (kw: string) => {
      const e = kw.toUpperCase();
      if (e.includes('ANGIO')) return 'HMMR';
      if (e.includes('RNM') || e.includes('RMN') || e.includes('RESSONANCIA')) return 'RADIO VIDA';
      return 'HSJB';
    };

    // Ajuste de Placeholders se for lote/avulsa
    const isAvulsa = cleanedText.includes('avulsa') || (qty > 1 && patient === "PACIENTE");
    const finalPatient = isAvulsa && patient === "PACIENTE" ? "PACIENTE A PREENCHER" : patient;
    const finalHospital = isAvulsa && hospitalOrigin === "HOSPITAL ORIGEM" ? "HOSPITAL ORIGEM" : hospitalOrigin;
    const finalExam = isAvulsa && examRaw === "EXAME" ? "EXAME AUTORIZADO PARA DESTINO" : `${examRaw} AUTORIZADO PARA ${destination(examRaw)}`;

    // CASO 1: CHAT ONLY (Chave / Avulsa sem etiqueta) -> NUNCA pede assinatura
    if (isChatOnly) {
      const keys = Array.from({ length: qty }, () => {
        const k = generateKey();
        return `\`${dateStr} : ${k} - ${finalPatient} – ${finalHospital} - ${finalExam}\``;
      }).join('\n');

      return {
        text: `✅ **CIRILA — CHAVES GERADAS NO CHAT**\n\nAqui estão suas chaves institucionalizadas:\n\n${keys}\n\n*Processo concluído com sucesso.*`,
        sender: 'ai'
      };
    }

    // CASO 2: DOCUMENTO (Etiqueta) -> Pede assinatura se faltar
    if (!professionalRaw) {
      // Se for apenas chave mas SEM a flag isChatOnly (ex: pediu etiqueta de chave), ainda pedimos assinatura
      return {
        text: `Entendido, chefe! Vou gerar **${qty} etiqueta(s)** para o documento.\n\nQuem assina pela **DCRAA** hoje?`,
        sender: 'ai',
        actions: ['paola', 'inima', 'carlos', 'roberto', 'sabrina', 'barenco'].map(p => ({
          label: p.toUpperCase(),
          payload: `${cleanedText} assinado por ${p}`
        }))
      };
    }

    const labelText = `${dateStr} : ${authKey} - ${patient} – ${hospitalOrigin} - ${finalExam}`;
    const pos = 'bottom';

    if (!isDocumentAttached) {
      return {
        text: `✅ **CIRILA:** Autorização gerada para **${patient}**. \n\nComo você não enviou anexo, aqui está a etiqueta para copiar:\n\n\`${labelText}\`\n\nTambém gerei um documento Word vazio apenas com ela no final, caso precise:`,
        sender: 'ai',
        actions: [{
          label: '📄 Baixar Etiqueta (.docx)',
          payload: `DOWNLOAD_ETIQUETA_DOCX:::${patient.replace(/\s/g, '+')}:::${examRaw.replace(/\s/g, '+')}:::${professionalRaw}:::${authKey}:::${currentFileUrl || ''}:::${qty}:::${pos}:::${hospitalOrigin.replace(/\s/g, '+')}`
        }]
      };
    }

    return {
      text: `✅ **CIRILA:** Perfeito! Documento recebido.\n\nEstou processando a autorização para **${patient}** (Hospital: ${hospitalOrigin}). \n\nEtiqueta gerada:\n\`${labelText}\` \n\nO arquivo Word com a etiqueta no **FINAL DA FOLHA** está pronto:`,
      sender: 'ai',
      actions: [{
        label: '📄 Baixar Pedido Autorizado (.docx)',
        payload: `DOWNLOAD_ETIQUETA_DOCX:::${patient.replace(/\s/g, '+')}:::${examRaw.replace(/\s/g, '+')}:::${professionalRaw}:::${authKey}:::${currentFileUrl}:::${qty}:::${pos}:::${hospitalOrigin.replace(/\s/g, '+')}`
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
