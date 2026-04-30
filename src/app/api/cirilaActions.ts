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

  // --- IDENTIDADE E REGRAS CRÍTICAS DA CIRILA ---
  
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

  // 1. REGRA CRÍTICA: Detecção de Anexo (Sem ler o conteúdo)
  const fileIdMatch = text.match(/\[file_id:(.+?)\]/i);
  const currentFileId = fileIdMatch ? fileIdMatch[1] : null;
  const isDocumentAttached = !!currentFileId || text.includes('anexo');

  // 2. COMANDO DE GERAÇÃO DE ETIQUETA
  const isGeneratingEtiqueta = text.includes('gerar') && (text.includes('etiqueta') || text.includes('tc') || text.includes('rnm') || text.includes('angiotc'));

  if (isGeneratingEtiqueta) {
    // Validação de Anexo (Obrigatório conforme regra)
    if (!isDocumentAttached) {
       return {
        text: `Olá chefe! Sou a **CIRILA**, sua IA de regulação. \n\nPara eu gerar a etiqueta de autorização com a chave de acesso, **você precisa anexar o documento (Pedido Médico)** primeiro. \n\nAssim que anexar, eu cuidarei da geração da chave e do destino automaticamente sem mexer no conteúdo original do seu template.`,
        sender: 'ai'
      };
    }

    // Extração de dados apenas do comando do usuário
    // Ex: "Gerar TC de crânio para Gabriel Albertassi, etiqueta Inimá"
    const cleanedText = text.replace(/\[file_id:.+?\]/gi, '').trim();
    
    let etiquetaMatch = cleanedText.match(/gerar\s+etiqueta\s+(?:de\s+)?(.+?)\s+para\s+([a-záàâãéèêíïóôõöúç\s]+?)(?:\s*(?:,|\s+)(?:na\s+|com\s+|do\s+|da\s+|assinado por\s+|assinada por\s+)?(?:etiqueta\s+)?(?:da\s+|do\s+)?([a-záàâãéèêíïóôõöúç\s]+))?$/i);
    
    if (!etiquetaMatch) {
      etiquetaMatch = cleanedText.match(/gerar\s+(.+?)\s+para\s+([a-záàâãéèêíïóôõöúç\s]+?)(?:\s*(?:,|\s+)(?:na\s+|com\s+|do\s+|da\s+|assinado por\s+|assinada por\s+)?etiqueta\s+(?:da\s+|do\s+)?([a-záàâãéèêíïóôõöúç\s]+))?$/i);
    }

    if (etiquetaMatch) {
      const examRaw = etiquetaMatch[1].trim();
      const patient = etiquetaMatch[2].trim().toUpperCase();
      const professionalRaw = (etiquetaMatch[3] || '').trim().toLowerCase().split(/\s+/)[0];

      if (!professionalRaw || !validProfs.includes(professionalRaw)) {
        return {
          text: `Chefe, para gerar a etiqueta de **${patient}**, preciso saber qual profissional da **DCRAA** vai assinar. \n\n(Opções: Paola, Inimá, Carlos, Roberto, Sabrina, Barenco, Rosely ou Mazoni)`,
          sender: 'ai',
          actions: validProfs.slice(0, 4).map(p => ({
            label: `Assinar como ${p.toUpperCase()}`,
            payload: `Gerar etiqueta de ${examRaw} para ${patient} assinado por ${p}`
          }))
        };
      }

      // Mapeamento de destino conforme regra fixa
      const examLower = examRaw.toLowerCase();
      let destination = "HOSPITAL DESTINO";
      if (examLower.includes('angiotc')) destination = "HMMR";
      else if (examLower.includes('colangio')) destination = "RADIO VIDA";
      else if (examLower.includes('tc') || examLower.includes('tomografia')) destination = "HSJB";
      else if (examLower.includes('rnm') || examLower.includes('ressonancia') || examLower.includes('ressonância')) destination = "RADIO VIDA";

      const authKey = generateKey();

      return {
        text: `✅ **CIRILA:** Chave **${authKey}** gerada com sucesso para **${patient}**! \n\nO destino configurado é **${destination}**. \n\nEstou processando seu documento original como template e inserindo a etiqueta oficial da regulação no topo. Clique abaixo para baixar o arquivo pronto para impressão.`,
        sender: 'ai',
        actions: [{ 
          label: '📄 Baixar Documento com Etiqueta (.docx)', 
          payload: `DOWNLOAD_ETIQUETA_DOCX_${patient.replace(/\s/g, '+')}_${examRaw.replace(/\s/g, '+')}_${professionalRaw}_${authKey}_${currentFileId || ''}` 
        }]
      };
    }
  }


  // --- RESPOSTAS DE CONTEXTO GERAL (PERSONA CIRILA) ---

  if (text.includes('o que você sabe fazer') || text.includes('ajuda')) {
    return {
      text: `Sou a **CIRILA**, a Central Inteligente de Regulação Automatizada. \n\nMinhas funções principais: \n1. **Geração de Etiquetas**: Insiro chaves de acesso oficiais da DCRAA em seus pedidos médicos. \n2. **Triagem de Destino**: Mapeio automaticamente se o exame vai para HSJB, HMMR ou Radio Vida. \n3. **Preservação de Template**: Mantenho seus documentos originais intactos, apenas adicionando a regulação. \n\nComo posso ajudar na regulação agora?`,
      sender: 'ai',
      image: '/cirila_2.png'
    };
  }

  if (text.includes('anexo') || text.includes('documento')) {
    return {
      text: `Recebi o documento, chefe! Ele será usado como **Template Visual** para a etiqueta. \n\nAgora, por favor, me diga: **Qual exame e qual paciente devo regular neste documento?**`,
      sender: 'ai'
    };
  }

  // Fallback padrão amigável
  await new Promise(resolve => setTimeout(resolve, 600));
  return {
    text: `Entendido chefe! Se precisar gerar uma etiqueta de autorização, basta anexar o pedido e me dizer o nome do paciente e o exame. Estou de prontidão!`,
    sender: 'ai',
    actions: [
      { label: 'Gerar TC para Paciente', payload: 'Gerar etiqueta de TC para...' },
      { label: 'Ver Fila de Espera', payload: 'NAV_QUEUE' }
    ]
  };
}

