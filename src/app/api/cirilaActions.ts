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
  Você é a CIRILA, uma inteligência artificial especializada em regulação médica e geração de documentos.
  Sua função é receber um documento PDF enviado pelo usuário, utilizá-lo como base, e gerar um novo documento Word (.docx) contendo o conteúdo original + etiqueta institucional com chave.
  REGRA PRINCIPAL: O documento original deve ser PRESERVADO.
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
    text.includes('angiotc') ||
    text.includes('chave') ||
    text.includes('ressonancia') ||
    text.includes('tomografia')
  );

  if (isGeneratingEtiqueta) {

    // --- REGRA CRÍTICA: EXIGE ANEXO PARA ETIQUETAS DE REGULAÇÃO ---
    if (!isDocumentAttached && !cleanedText.includes('avulsa')) {
      return {
        text: `Olá! Eu sou a **CIRILA** e estou pronta para regular este pedido. 🤖\n\n⚠️ **Regra de Segurança:** Para garantir a integridade do processo, preciso que você **anexe o documento original (PDF ou Word)**.\n\nAssim que você anexar, poderei inserir a etiqueta oficial no topo preservando 100% do conteúdo original. Estou aguardando seu arquivo!`,
        sender: 'ai'
      };
    }

    // PADRÃO B: Etiqueta Única / Lote (Regex mais robusto)
    let examRaw = "EXAME";
    let patient = "PACIENTE";
    let professionalRaw = "";

    // 1. Capturar Exame (palavras-chave de exames médicos)
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
    // verifica tc por último para não conflitar com angiotc
    for (const [kw, label] of Object.entries(examKeywords)) {
      if (cleanedText.includes(kw)) { examRaw = label; break; }
    }
    if (examRaw === 'EXAME' && (cleanedText.includes(' tc ') || cleanedText.startsWith('tc '))) examRaw = 'TC';

    // 2. Extrair Paciente — estratégia em camadas
    let foundPatient = false;

    // Camada 1: "paciente [nome]"
    const m1 = cleanedText.match(/paciente\s+([\w\s]{3,50?}?)(?:\s+assinado|\s+assinada|\s+com|\s+para|,|;|\n|$)/i);
    if (m1 && m1[1] && !validProfs.some(p => m1[1].toLowerCase().includes(p))) {
      patient = m1[1].trim().toUpperCase();
      foundPatient = true;
    }

    // Camada 2: "para o/a [nome]" ou "para [nome]"
    if (!foundPatient) {
      const m2 = cleanedText.match(/para\s+(?:o\s+|a\s+|paciente\s+)?([A-ZÀ-Ú][\w\s]{2,50?})(?:\s+assinado|\s+assinada|\s+com|,|;|\n|$)/i);
      if (m2 && m2[1]) {
        const candidate = m2[1].trim();
        const isExamWord = Object.keys(examKeywords).some(k => candidate.toLowerCase().startsWith(k));
        if (!isExamWord && !validProfs.some(p => candidate.toLowerCase().includes(p))) {
          patient = candidate.toUpperCase();
          foundPatient = true;
        }
      }
    }

    // Camada 3: "de [nome]" (ex: "tc de João da Silva")
    if (!foundPatient) {
      const m3 = cleanedText.match(/\bde\s+([A-ZÀ-Ú][\w\s]{2,40?})(?:\s+assinado|\s+assinada|,|;|\n|$)/i);
      if (m3 && m3[1]) {
        const candidate = m3[1].trim();
        if (!validProfs.some(p => candidate.toLowerCase().includes(p))) {
          patient = candidate.toUpperCase();
          foundPatient = true;
        }
      }
    }

    // Camada 4 (fallback): texto após o exame antes de "assinado"
    if (!foundPatient) {
      const examLower = examRaw.toLowerCase().replace('ã', 'a').replace('ô', 'o');
      const afterExam = cleanedText.split(examLower)[1];
      if (afterExam) {
        const candidate = afterExam.split(/assinado|assinada|,|;|\n/)[0].trim();
        if (candidate.length > 3 && !validProfs.some(p => candidate.includes(p))) {
          patient = candidate.toUpperCase();
        }
      }
    }

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

    const isCleanDoc = cleanedText.includes('limpo') || cleanedText.includes('branco');
    const authKey = generateKey();
    const pos = isCleanDoc ? 'bottom' : 'top';

    const templateParam = currentFileUrl ? `&templateUrl=${encodeURIComponent(currentFileUrl)}` : '';

    if (!isDocumentAttached) {
      const posMsg = isCleanDoc
        ? "Como solicitado, a etiqueta será posicionada no **final da folha** (documento limpo)."
        : "⚠️ **Não encontrei um documento PDF anexado.** Como regra de segurança, gerarei uma **etiqueta avulsa no final da folha** para você movimentar como quiser.";

      return {
        text: `✅ **CIR-A:** Gerando autorização para **${patient}**. ${posMsg}`,
        sender: 'ai',
        actions: [{
          label: '📄 Baixar Etiqueta (.docx)',
          payload: `DOWNLOAD_ETIQUETA_DOCX:::${patient.replace(/\s/g, '+')}:::${examRaw.replace(/\s/g, '+')}:::${professionalRaw}:::${authKey}:::${currentFileUrl || ''}:::1:::${pos}`
        }]
      };
    }

    return {
      text: `✅ **CIRILA:** Excelente! Documento recebido.\n\nEstou processando a autorização para **${patient}** com a chave **${authKey}**. Como manda o protocolo, o conteúdo original foi **100% preservado** e a etiqueta oficial foi inserida ${isCleanDoc ? 'no final' : 'no topo'}.\n\nO documento (.docx) está pronto para impressão.`,
      sender: 'ai',
      actions: [{
        label: '📄 Baixar Pedido Autorizado (.docx)',
        payload: `DOWNLOAD_ETIQUETA_DOCX:::${patient.replace(/\s/g, '+')}:::${examRaw.replace(/\s/g, '+')}:::${professionalRaw}:::${authKey}:::${currentFileUrl}:::1:::${pos}`
      }]
    };
  }

  // --- RESPOSTAS DE CONTEXTO GERAL ---

  if (text.includes('o que você sabe fazer') || text.includes('ajuda') || text.includes('quem é você')) {
    return {
      text: `Olá! Eu sou a **CIRILA**, sua Inteligência Artificial especializada em regulação médica. 🤖🏥\n\nMinha missão é facilitar seu trabalho na **DCRAA**: \n\n1. **Regular Pedidos**: Você anexa um PDF, me diz o paciente e o exame, e eu gero um Word com a etiqueta oficial no topo.\n2. **Planilhas de Sobreaviso**: Posso gerar mapas de supervisão em modo paisagem com quantas chaves você precisar.\n3. **Mapeamento de Destino**: Já conheço os fluxos para HSJB, HMMR e Radio Vida.\n\n **O que vamos regular agora?**`,
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
