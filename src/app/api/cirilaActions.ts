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

export async function getCirilaStats(examType?: 'TC' | 'RNM') {
  try {
    const now = new Date();
    // Ajuste para garantir que pegamos o início do dia local/UTC corretamente
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const firstDayYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);

    console.log(`[CIRILA_STATS] Buscando estatísticas para: ${examType || 'GERAL'}`);

    const filter: any = {};
    if (examType === 'TC') filter.exam_type = { equals: 'TC' };
    if (examType === 'RNM') filter.exam_type = { equals: 'RNM' };

    const getLogs = async (since: Date) => {
      try {
        const model = (prisma as any).cirilaAudit;
        if (model) {
          console.log(`[CIRILA_STATS] Usando Prisma Model para busca desde ${since.toISOString()}`);
          return await model.findMany({
            where: { 
              timestamp: { gte: since },
              ...filter
            }
          });
        }
        
        console.log(`[CIRILA_STATS] Fallback para SQL bruto (Prisma Model não encontrado)`);
        const tableName = '"CirilaAudit"';
        const dateStr = since.toISOString();
        let sql = `SELECT * FROM ${tableName} WHERE timestamp >= $1`;
        
        if (examType) {
          sql += ` AND exam_type = $2`;
          return await prisma.$queryRawUnsafe(sql, dateStr, examType);
        }
        return await prisma.$queryRawUnsafe(sql, dateStr);
      } catch (err) {
        console.error(`[CIRILA_STATS] Erro em getLogs:`, err);
        return [];
      }
    };

    const [monthly, annual] = await Promise.all([
      getLogs(firstDayMonth),
      getLogs(firstDayYear)
    ]);

    console.log(`[CIRILA_STATS] Logs encontrados - Mensal: ${monthly?.length || 0}, Anual: ${annual?.length || 0}`);

    const summarize = (data: any[]) => {
      if (!Array.isArray(data)) return { total: 0, tc: 0, rnm: 0, others: 0, byHospital: {} };
      
      const tc = data.filter((d: any) => d.exam_type === 'TC').length;
      const rnm = data.filter((d: any) => d.exam_type === 'RNM').length;
      
      const byHospital = data.reduce((acc: any, d: any) => {
        const hosp = d.hospital_origin || 'NÃO INFORMADO';
        acc[hosp] = (acc[hosp] || 0) + 1;
        return acc;
      }, {});

      return {
        total: data.length,
        tc,
        rnm,
        others: data.length - tc - rnm,
        byHospital
      };
    };

    return {
      monthly: summarize(monthly),
      annual: summarize(annual)
    };
  } catch (err) {
    console.error('[CIRILA_STATS] Erro fatal:', err);
    return null;
  }
}

// --- PROTOCOLO ATIVO (Estado de sessão do servidor) ---
// Protocolo 1 (padrão): TC → HSJB
// Protocolo 2: TC → HMMR
let protocoloAtivo = 1;

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

  const validProfs = ['paola', 'inima', 'inimá', 'carlos', 'roberto', 'sabrina', 'sabina', 'barenco', 'rosely', 'mazoni', 'gabriel'];

  // 1. Detecção de Anexo (Pega sempre o ÚLTIMO para evitar conflitos de cache no prompt)
  const fileUrls = text.match(/\[file_url:(.+?)\]/gi);
  const currentFileUrl = fileUrls ? fileUrls[fileUrls.length - 1].match(/\[file_url:(.+?)\]/i)![1] : null;
  const isDocumentAttached = !!currentFileUrl;
  
  if (isDocumentAttached) {
    console.log(`[CIRILA_ACTIONS] Arquivo detectado na query: ${currentFileUrl}`);
  }
  const cleanedText = text.replace(/\[file_url:.+?\]/gi, '').trim();

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

  // --- DETECÇÃO DE TIPO DE EXAME (GLOBAL) ---
  const isTC = /\b(tc|tomografia)\b/i.test(cleanedText);
  const isRNM = /\b(rnm|ressonancia|ressonância|rmn)\b/i.test(cleanedText);

  // --- COMANDOS DE RELATÓRIO ---
  if (cleanedText.includes('relatório') || cleanedText.includes('relatorio')) {
    console.log(`[CIRILA_ACTIONS] Comando de relatório detectado: "${cleanedText}"`);
    
    const isMonthly = /\b(mensal|mês|mes)\b/i.test(cleanedText);
    const isAnnual = /\b(anual|ano|anualmente)\b/i.test(cleanedText);
    
    if (isMonthly || (!isAnnual && cleanedText.includes('relatorio'))) {
      return {
        text: `📊 **Relatório Mensal de Autorizações**\n\nCom certeza, chefe! Estou preparando o consolidado de todas as chaves geradas neste mês. \n\nO documento contém:\n• Total de autorizações (TC/RNM)\n• Lista detalhada por paciente e hospital\n• Auditoria institucional completa`,
        sender: 'ai',
        actions: [
          { label: '📄 Baixar Relatório Mensal (.docx)', payload: 'DOWNLOAD_REPORT_MONTHLY' }
        ]
      };
    }
  }

  // --- COMANDOS DE LISTAGEM ---
  const isHelpCommand = 
    cleanedText.startsWith('!') || 
    cleanedText.startsWith('@') || 
    cleanedText === 'comandos' || 
    cleanedText === 'ajuda' ||
    cleanedText === 'help' ||
    cleanedText.includes('quais são os comandos');

  if (isHelpCommand) {
    return {
      text: `📋 **CATÁLOGO DE COMANDOS — CIRILA V.2**\n\nChefe, aqui estão os comandos que eu entendo:\n\n` +
            `• **Gerar Etiquetas**: *"Gerar [EXAME] para [PACIENTE]"* \n  *(Ex: "Gerar TC de Crânio para João Silva")*\n\n` +
            `• **Planilha de Sobreaviso**: *"Sobreaviso [QTD]"* \n  *(Ex: "Sobreaviso 20" — Gera mapa com 20 chaves)*\n\n` +
            `• **Protocolos (TC)**: *"Protocolo 1"* (HSJB) ou *"Protocolo 2"* (Retiro)\n\n` +
            `• **Relatórios**: *"Relatório Mensal"* ou *"Relatório Anual"* \n  *(Filtros: "Relatório de TC Mensal", "Relatório RNM Anual")*\n\n` +
            `• **Chaves no Chat**: Adicione *"no chat"* ao comando de etiqueta para gerar apenas o texto.\n\n` +
            `• **Assinatura**: Você pode incluir o médico direto: *"Assinado por Inimá"* ou *"Inimá"*.\n\n` +
            `• **Anexos**: Basta arrastar um PDF/Imagem e depois me dar o comando de gerar.\n\n` +
            `*Dica: Você pode usar !comandos ou @comandos a qualquer momento.*`,
      sender: 'ai',
      actions: [
        { label: '📊 Relatório TC Mensal', payload: 'gerar relatorio de tc mensal' },
        { label: '📊 Relatório RNM Mensal', payload: 'gerar relatorio de rnm mensal' },
        { label: '📄 Sobreaviso (15)', payload: 'sobreaviso 15' },
        { label: '🚑 Protocolo 2 (Retiro)', payload: 'protocolo 2' },
      ]
    };
  }
  
  // 3. DETECÇÃO DE PROTOCOLO — Altera rota de destino das TCs
  const isProtocoloCommand =
    cleanedText.includes('protocolo 2') ||
    cleanedText.includes('protocolo 1') ||
    cleanedText.includes('protocolo normal') ||
    cleanedText.includes('desativar protocolo');

  if (isProtocoloCommand) {
    if (cleanedText.includes('protocolo 2') || cleanedText.includes('ativar protocolo 2')) {
      protocoloAtivo = 2;
      return {
        text: `Certo chefe, agora todas as Tomografias vão ser direcionadas para o **Hospital do Retiro**.\n\n*Para voltar ao padrão, digite: \"protocolo 1\" ou \"protocolo normal\".*`,
        sender: 'ai'
      };
    } else {
      protocoloAtivo = 1;
      return {
        text: `✅ **CIRILA — PROTOCOLO 1 (PADRÃO) RESTAURADO**\n\nTodas as **TCs** voltaram a ser autorizadas para o **HSJB**.`,
        sender: 'ai'
      };
    }
  }

  // 4. DETECÇÃO DE SOBREAVISO — SEMPRE TEM PRIORIDADE MÁXIMA
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
  // Aceita "gerar tc..." OU "tc ... etiqueta ..." (formato direto sem 'gerar')
  const isGeneratingEtiqueta = (text.includes('gerar') || text.includes('gera') || text.includes('chave') || text.includes('autoriza') || text.includes('etiqueta')) && (
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
    let hospitalOrigin = ""; // Empty to detect missing
    let professionalRaw = "";

    // Quantidade
    const batchMatch = cleanedText.match(/(\d+(?:\s+\d+)?)/);
    const qty = batchMatch ? Math.max(1, Math.min(100, parseInt(batchMatch[1].split(/\s+/).pop()!))) : (cleanedText.includes('chaves') ? 10 : 1);

    // Hospital
    const hospMatch = cleanedText.match(/\b(hsjb|hmmr|hnsg|hmpagb|ps\s+pinheiral|pinheiral|hospital\s+sao\s+joao\s+batista|hospital\s+municipal|municipar|santa\s+casa|unimed|hmvr|upa|cais|hinja|santana|santa\s+casa|santa\s+cecilia|santa\s+cecília|nelson\s+gonçalves|nelson|gonçalves)\b/i);
    if (hospMatch) {
      const h = hospMatch[0].toUpperCase();
      if (h.includes('SAO JOAO BATISTA') || h.includes('HSJB')) hospitalOrigin = 'HSJB';
      else if (h.includes('MUNICIPAL') || h.includes('MUNICIPAR') || h.includes('HMMR')) hospitalOrigin = 'HMMR';
      else if (h.includes('NELSON') || h.includes('GONÇALVES') || h.includes('HNSG')) hospitalOrigin = 'HNSG';
      else if (h.includes('HMPAGB')) hospitalOrigin = 'HMPAGB';
      else if (h.includes('PINHEIRAL')) hospitalOrigin = 'PS PINHEIRAL';
      else hospitalOrigin = h;
    }

    // Exame (Suporte a múltiplos, regiões anatômicas compostas e modificadores)
    const examKeywords: Record<string, string> = {
      'angiotc': 'ANGIOTC',
      'urotc': 'UROTC',
      'rnm': 'RNM',
      'rmn': 'RNM',
      'ressonancia': 'RNM',
      'ressonância': 'RNM',
      'tc': 'TC',
      'tomografia': 'TC',
      'ecografia': 'ECOGRAFIA',
      'ecocardiograma': 'ECOCARDIOGRAMA',
      'eco': 'ECO',
      'usg': 'USG',
      'ultrassom': 'USG',
      'ultrasom': 'USG',
      'ultrassonografia': 'USG',
      'doppler': 'DOPPLER',
      'duplex': 'DOPPLER',
      'ecodoppler': 'ECODOPPLER',
      'ecodopplercardiograma': 'ECODOPPLERCARDIOGRAMA',
      'endoscopia': 'ENDOSCOPIA',
      'colonoscopia': 'COLONOSCOPIA',
      'broncoscopia': 'BRONCOSCOPIA',
      'laringoscopia': 'LARINGOSCOPIA',
      'cistoscopia': 'CISTOSCOPIA',
      'histeroscopia': 'HISTEROSCOPIA',
      'pet': 'PET',
      'cintilografia': 'CINTILOGRAFIA',
      'mamografia': 'MAMOGRAFIA',
      'densitometria': 'DENSITOMETRIA',
      'raio x': 'RAIO X',
      'rx': 'RX',
      'raiox': 'RX',
      'cateterismo': 'CATETERISMO',
      'arteriografia': 'ARTERIOGRAFIA',
      'eletroencefalograma': 'ELETROENCEFALOGRAMA',
      'eeg': 'EEG',
      'eletrocardiograma': 'ECG',
      'ecg': 'ECG',
      'holter': 'HOLTER',
      'mapa': 'MAPA',
      'espirometria': 'ESPIROMETRIA',
      'audiometria': 'AUDIOMETRIA',
      'biopsia': 'BIOPSIA',
      'puncao': 'PUNCAO',
      'punção': 'PUNCAO',
      'colangiornm': 'COLANGIORNM',
      'colangio': 'COLANGIO',
      'urografia': 'UROGRAFIA',
    };

    // Stop-words: quando encontrar essas, parar de capturar a especificação do exame
    const examStopWords = [
      ...validProfs,
      'hsjb', 'hmmr', 'hnsg', 'hmpagb', 'pinheiral', 'upa', 'unimed', 'hmvr', 'cais',
      'etiqueta', 'gerar', 'para', 'paciente', 'avulsa', 'chave', 'chaves', 'no', 'na', 'chat',
    ];
    
    const foundExams: string[] = [];
    for (const [kw, label] of Object.entries(examKeywords)) {
      // Regex Flexível: captura o exame mesmo sem "DE/DO/DA" e para antes de stop-words ou nomes de hospitais
      const regex = new RegExp(`\\b${kw}\\b(?:\\s+(?:de|do|da|dos|das)?\\s*(.+?))?(?=\\s+(?:${examStopWords.join('|')})\\b|$)`, 'i');
      const match = cleanedText.match(regex);
      if (match) {
        let fullExam = label;
        if (match[1]) {
          // Limpa a especificação: remove resíduos de stop-words no final
          let spec = match[1].trim()
            .replace(new RegExp(`\\s+(?:${examStopWords.join('|')})\\b.*$`, 'i'), '')
            .trim();

          // REGRA DE OURO: Se achar "com/sem contraste", corta tudo que vem depois
          // Isso evita que o nome do paciente seja engolido pelo exame
          const contrastMatch = spec.match(/\b(?:com|sem|c\/|s\/)\s+(?:contraste|contr|contrast)\b/i);
          if (contrastMatch) {
            const contrastStr = contrastMatch[0];
            const endIdx = spec.toLowerCase().indexOf(contrastStr.toLowerCase()) + contrastStr.length;
            spec = spec.substring(0, endIdx).trim();
          }

          // Limita a 80 chars para segurança
          if (spec.length > 0 && spec.length < 80) {
            fullExam = spec.toUpperCase().includes(label) ? spec.toUpperCase() : `${label} DE ${spec.toUpperCase()}`;
          }
        }
        if (!foundExams.includes(fullExam)) foundExams.push(fullExam);
      }
    }
    
    if (foundExams.length > 0) {
      examRaw = foundExams.join(', ');
    }

    // --- PROFISSIONAL (detectado ANTES do paciente para não conflitar nomes) ---
    const profMarkers = '(?:assinado|assinada|por|etiqueta|regulação|regulador|assinatura|ass|at|pela|do|da|pelo|na|paga|na\\s+etiqueta\\s+do|na\\s+etiqueta\\s+da)';
    const explicitProfMatch = cleanedText.match(new RegExp(`${profMarkers}\\s+\\b(${validProfs.join('|')})\\b`, 'i'));
    
    if (explicitProfMatch) {
      professionalRaw = explicitProfMatch[1].toLowerCase();
    } else {
      // Fallback: NÃO usar busca livre (evita confundir paciente com profissional)
      professionalRaw = "";
    }

    // --- PACIENTE ---
    const m1 = cleanedText.match(/para\s+([^,;.\n\-\(\)]+)/i);
    if (m1 && m1[1]) {
      let candidate = m1[1].trim();
      if (hospMatch) {
        const hospName = hospMatch[0].toLowerCase();
        candidate = candidate.toLowerCase().replace(new RegExp(`\\b${hospName}\\b`, 'g'), '').trim();
      }
      // Remove stop-words e o profissional detectado
      candidate = candidate.replace(/\b(sem|com|etiqueta|no|chat|apenas|texto|so|só|chave|chaves|avulsa|do|da|pelo|pela|na|paga|autorizado|autorizada)\b/gi, '').trim();
      if (professionalRaw) {
        candidate = candidate.replace(new RegExp(`\\b${professionalRaw}\\b`, 'gi'), '').trim();
      }
      
      if (candidate && candidate.length > 2) {
        patient = candidate.toUpperCase();
      }
    } else {
      // Se não achou "para", extrai o paciente por resíduo (remove exame, hospital, profissional, stop-words)
      let residue = cleanedText;
      // Remove palavras-chave do exame e especificação anatômica
      foundExams.forEach(e => {
        const parts = e.split(' DE ');
        const kw = parts[0].toLowerCase();
        const spec = parts[1]?.toLowerCase();
        residue = residue.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '');
        if (spec) residue = residue.replace(new RegExp(`\\b${spec}\\b`, 'gi'), '');
      });
      // Remove hospital
      if (hospMatch) residue = residue.replace(new RegExp(`\\b${hospMatch[0]}\\b`, 'gi'), '');
      // Remove stop-words comuns e termos de contraste remanescentes
      residue = residue.replace(/\b(gerar|gera|etiqueta|no|chat|chave|chaves|de|do|da|em|na|no|autorizado|autorizada|para|com|sem|contraste|contr|c\/|s\/)\b/gi, '').trim();
      // Remove APENAS o profissional detectado (não todos — "gabriel" pode ser paciente)
      if (professionalRaw) {
        residue = residue.replace(new RegExp(`\\b${professionalRaw}\\b`, 'gi'), '');
      }
      residue = residue.trim();
      
      if (residue.length > 2) {
        // Limpeza final para garantir que não sobrou lixo de comando
        patient = residue.toUpperCase()
          .replace(/\b(AUTORIZADO|AUTORIZADA|COM|SEM|CONTRASTE|CONTR|C\/|S\/|EXAME|PARA)\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    // VALIDAR HOSPITAL DE ORIGEM - SE NÃO TIVER, PERGUNTAR
    if (!hospitalOrigin && !isChatOnly) {
      return {
        text: `Entendido, chefe! Para gerar a autorização corretamente, **qual o Hospital de Origem?** (Clique em um botão abaixo para prosseguir)`,
        sender: 'ai',
        actions: [
          { label: 'HSJB', payload: `${cleanedText} no HSJB` },
          { label: 'HMMR', payload: `${cleanedText} no HMMR` },
          { label: 'HNSG', payload: `${cleanedText} no HNSG` },
          { label: 'HMPAGB', payload: `${cleanedText} no HMPAGB` },
          { label: 'PS PINHEIRAL', payload: `${cleanedText} no PS PINHEIRAL` },
          { label: 'UPA', payload: `${cleanedText} na UPA` },
          { label: 'SANTA CASA', payload: `${cleanedText} na SANTA CASA` }
        ]
      };
    }

    const finalHospital = hospitalOrigin || "HOSPITAL ORIGEM";

    // --- REGRAS DE SAÍDA ---
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const destination = (exam: string) => {
      const e = exam.toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (e.includes('ANGIOTC') || e.includes('ANGIO')) return 'HMMR';
      if (e.includes('COLANGIO')) return 'RADIO VIDA';
      if (e.includes('RNM') || e.includes('RMN') ||
        e.includes('RESSONANCIA') || e.includes('RESSON')) return 'RADIO VIDA';
      // PROTOCOLO 2: TC vai para HMMR em vez de HSJB
      if (e.includes('TC') || e.includes('TOMOGRAFIA')) return protocoloAtivo === 2 ? 'HMMR' : 'HSJB';
      if (e.includes('ECO') || e.includes('ECOGRAFIA') ||
        e.includes('ECOCARDIOGRAMA')) return 'HSJB';
      if (e.includes('ENDOSCOPIA') || e.includes('COLONOSCOPIA')) return 'HSJB';
      if (e.includes('PET') || e.includes('CINTILOGRAFIA') ||
        e.includes('MAMOGRAFIA') || e.includes('DENSITOMETRIA')) return 'RADIO VIDA';
      return 'HSJB';
    };

    const finalExamOnly = examRaw === "EXAME" ? "EXAME" : examRaw;
    
    // Gerar a lista de chaves (sempre respeitando a quantidade)
    const generatedKeys = Array.from({ length: qty }, () => generateKey());
    const firstKey = generatedKeys[0];

    // Formato COMPLETO para etiquetas (documento): DATA : CHAVE - PACIENTE – ORIGEM - EXAME AUTORIZADO PARA DESTINO
    const textKeysBlock = generatedKeys.map(k => {
      const dest = destination(examRaw);
      return `\`${dateStr} : ${k.trim()} - ${patient.trim()} – ${finalHospital.trim()} - ${finalExamOnly.trim()} AUTORIZADO PARA ${dest.trim()}\``;
    }).join('\n');

    // CASO 1: CHAT ONLY (Chave / Avulsa sem etiqueta) -> NUNCA pede assinatura
    if (isChatOnly) {
      return {
        text: `✅ **CIRILA — CHAVES GERADAS NO CHAT**\n\nAqui estão seus registros de auditoria:\n\n${textKeysBlock}\n\n*Processo concluído com sucesso.*`,
        sender: 'ai'
      };
    }

    // CASO 2: DOCUMENTO (Etiqueta) -> Pede assinatura se faltar
    if (!professionalRaw) {
      return {
        text: `Entendido, chefe! Vou preparar a autorização para **${patient}**.\n\nQuem assina pela **DCRAA** hoje?`,
        sender: 'ai',
        actions: ['paola', 'inima', 'carlos', 'roberto', 'sabrina', 'barenco', 'gabriel'].map(p => ({
          label: p.toUpperCase(),
          payload: `${cleanedText} na etiqueta do ${p}`
        }))
      };
    }

    if (!isDocumentAttached) {
      // --- LOG DE AUDITORIA (Precisão 100%) ---
      try {
        const auditData = {
          exam_type: isTC ? 'TC' : (isRNM ? 'RNM' : 'OUTROS'),
          patient_name: patient,
          hospital_origin: finalHospital,
          destination: destination(examRaw),
          professional: professionalRaw,
          key: firstKey
        };

        const model = (prisma as any).cirilaAudit;
        if (model) {
          await model.create({ data: auditData });
        } else {
          // Fallback SQL para salvar caso o client esteja desatualizado
          const sql = `
            INSERT INTO "CirilaAudit" (id, exam_type, patient_name, hospital_origin, destination, professional, key, timestamp)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
          `;
          await prisma.$executeRawUnsafe(sql, auditData.exam_type, auditData.patient_name, auditData.hospital_origin, auditData.destination, auditData.professional, auditData.key);
        }
      } catch (e) {
        console.error('[CIRILA_AUDIT] Erro ao gravar log:', e);
      }

      return {
        text: `✅ **CIRILA:** Autorização gerada para **${patient}**. \n\nAqui estão as chaves para cópia rápida (Chat):\n\n${textKeysBlock}\n\nTambém gerei um documento Word vazio apenas com elas, caso precise:`,
        sender: 'ai',
        actions: [{
          label: `📄 Baixar ${qty > 1 ? qty + ' Etiquetas' : 'Etiqueta'} (.docx)`,
          payload: `DOWNLOAD_ETIQUETA_DOCX:::${patient.replace(/\s/g, '+')}:::${examRaw.replace(/\s/g, '+')}:::${professionalRaw}:::${firstKey}:::${currentFileUrl || ''}:::${qty}:::bottom:::${finalHospital.replace(/\s/g, '+')}:::${protocoloAtivo}`
        }]
      };
    }

    // --- LOG DE AUDITORIA (Precisão 100%) ---
    try {
      const auditData = {
        exam_type: isTC ? 'TC' : (isRNM ? 'RNM' : 'OUTROS'),
        patient_name: patient,
        hospital_origin: finalHospital,
        destination: destination(examRaw),
        professional: professionalRaw,
        key: firstKey
      };

      const model = (prisma as any).cirilaAudit;
      if (model) {
        await model.create({ data: auditData });
      } else {
        // Fallback SQL para salvar caso o client esteja desatualizado
        const sql = `
          INSERT INTO "CirilaAudit" (id, exam_type, patient_name, hospital_origin, destination, professional, key, timestamp)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
        `;
        await prisma.$executeRawUnsafe(sql, auditData.exam_type, auditData.patient_name, auditData.hospital_origin, auditData.destination, auditData.professional, auditData.key);
      }
    } catch (e) {
      console.error('[CIRILA_AUDIT] Erro ao gravar log:', e);
    }

    return {
      text: `✅ **CIRILA:** Perfeito! Documento recebido.\n\nEstou processando a autorização para **${patient}** (Hospital: ${finalHospital}). \n\n**Chave(s) gerada(s) para cópia:**\n${textKeysBlock} \n\nO arquivo Word com a etiqueta no **FINAL DA FOLHA** está pronto:`,
      sender: 'ai',
      actions: [{
        label: '📄 Baixar Pedido Autorizado (.docx)',
        payload: `DOWNLOAD_ETIQUETA_DOCX:::${patient.replace(/\s/g, '+')}:::${examRaw.replace(/\s/g, '+')}:::${professionalRaw}:::${firstKey}:::${currentFileUrl}:::${qty}:::bottom:::${finalHospital.replace(/\s/g, '+')}:::${protocoloAtivo}`
      }]
    };
  }



  // --- RESPOSTAS DE CONTEXTO GERAL ---

  if (text.includes('o que você sabe fazer') || text.includes('ajuda') || text.includes('quem é você')) {
    return {
      text: `Olá! Eu sou a **CIRILA**, sua Inteligência Artificial especializada em regulação médica da SMSVR. 🤖🏥\n\nMinhas capacidades principais:\n\n1. **Geração de Etiquetas**: Insiro etiquetas oficiais (Caixa Alta, Negrito, Preto) no final dos seus documentos autorizados.\n2. **Planilhas de Sobreaviso**: Gerador de mapas de supervisão noturna em modo paisagem com colunas institucionais.\n3. **Gestão de Chaves**: Posso gerar listas de chaves únicas diretamente aqui no chat.\n4. **Triagem Inteligente**: Extraio automaticamente Paciente, Hospital de Origem e Exame dos seus comandos.\n\n**Como posso agilizar seu processo agora?**`,
      sender: 'ai',
      image: '/cirila_2.png',
      actions: [
        { label: '📋 Ver Comandos', payload: '!comandos' },
        { label: '📄 Gerar Sobreaviso', payload: 'sobreaviso 15' },
        { label: 'Como funciona?', payload: 'ajuda' }
      ]
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
    text: `Entendido chefe! Estou pronta para regular.\n\nComo você prefere colar o anexo manualmente, vou gerar o documento Word com **espaço reservado no topo** e a etiqueta no final da folha.\n\nEscolha a quantidade de chaves abaixo ou me dê o comando (ex: *"Gerar TC para João Silva"*):`,
    sender: 'ai',
    actions: [
      { label: '📄 Sobreaviso — 10 chaves', payload: 'DOWNLOAD_DOCX_10' },
      { label: '📄 Sobreaviso — 15 chaves', payload: 'DOWNLOAD_DOCX_15' },
      { label: '📄 Sobreaviso — 20 chaves', payload: 'DOWNLOAD_DOCX_20' },
      { label: '📄 Sobreaviso — 30 chaves', payload: 'DOWNLOAD_DOCX_30' },
      { label: '📄 Sobreaviso — 50 chaves', payload: 'DOWNLOAD_DOCX_50' },
      { label: '📋 Ver Comandos', payload: '!comandos' },
      { label: 'Como funciona?', payload: 'ajuda' },
    ]
  };
}
