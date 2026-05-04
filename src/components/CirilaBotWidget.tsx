'use client';

import React, { useState, useEffect, useRef } from 'react';
import { askCirila, executeEmailDispatch, CirilaResponse } from '../app/api/cirilaActions';
import { Send, Paperclip, Bot, Bell, ChevronDown, ChevronUp, Sparkles, Loader2, FileText, CheckCircle2, BarChart3, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CirilaAvatar from './CirilaAvatar';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#00d8ff', '#0f172a', '#64748b', '#94a3b8'];

function CirilaDashboard({ data, period, examType }: { data: any, period: string, examType?: string }) {
  const chartData = [
    { name: 'TC', value: data.tc },
    { name: 'RNM', value: data.rnm },
    { name: 'Outros', value: data.others }
  ].filter(d => d.value > 0);

  const hospitalData = Object.entries(data.byHospital || {}).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => (b.value as number) - (a.value as number));

  const isFiltered = examType && examType !== 'GERAL';

  return (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.9)', 
      backdropFilter: 'blur(10px)',
      borderRadius: '20px', 
      padding: '1.25rem', 
      border: '1px solid rgba(226, 232, 240, 0.8)', 
      boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
      marginTop: '1rem',
      width: '100%',
      minWidth: '300px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="#00d8ff" />
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: 700 }}>
            {isFiltered ? `Relatório ${examType}` : 'Relatório Geral'}
          </h4>
        </div>
        <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
          {period}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginBottom: '2px' }}>AUTORIZADOS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{data.total}</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginBottom: '2px' }}>DESEMPENHO</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '1rem', fontWeight: 800 }}>
            <TrendingUp size={14} /> +12%
          </div>
        </div>
      </div>

      {!isFiltered && chartData.length > 0 && (
        <div style={{ height: '160px', width: '100%', marginBottom: '1.25rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', fontWeight: 600 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {hospitalData.length > 0 && (
        <div style={{ marginTop: isFiltered ? '0.5rem' : '0' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Principais Origens
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {hospitalData.slice(0, 3).map((h: any, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{h.name}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00d8ff' }}>{h.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CirilaBotWidget() {
  const router = useRouter();
  const [messages, setMessages] = useState<CirilaResponse[]>([
    { text: 'Olá! Eu sou a Cirila, sua IA da SMSVR. Como posso agilizar a regulação hoje?', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); 
  const [expression, setExpression] = useState<'neutral' | 'smiling' | 'thinking' | 'alert'>('neutral');
  const [lastIncompleteQuery, setLastIncompleteQuery] = useState<string | null>(null);
  const [lastIncompleteFileUrl, setLastIncompleteFileUrl] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, processingStatus]);

  useEffect(() => {
    const handleSimulatedReply = (e: any) => {
      const msg = e.detail || 'Nova Mensagem Recebida do NIR!';
      setNotification(msg);
      setExpression('alert');
      setMessages(prev => [...prev, { text: `🔔 Urgente chefe: ${msg}`, sender: 'ai' }]);
      setTimeout(() => {
        setNotification(null);
        setExpression('neutral');
      }, 10000);
    };
    const handleToggle = () => setIsMinimized(prev => !prev);
    
    const handleScoreAlert = (e: any) => {
      const num = e.detail;
      const msg = `⚠️ **ALERTA CLÍNICO MÁXIMO:** Detectei **${num}** paciente(s) na fila com Score elevadíssimo (acima do teto de 35 pontos ou com status de Vaga Zero Pura). A prioridade clínica está em vermelho. Recomendo abrir o modo de "Disparo de E-mail Único" na fila imediatamente, vou coordenar com as unidades conveniadas.`;
      
      setExpression('alert');
      setMessages(prev => {
         if (prev[prev.length - 1]?.text === msg) return prev;
         return [...prev, { text: msg, sender: 'ai' }];
      });
      setNotification(`ALERTA: SCORE ELEVADO DETECTADO`);
      setTimeout(() => {
        setNotification(null);
        setExpression('neutral');
      }, 15000);
      window.dispatchEvent(new CustomEvent('CIRILA_BADGE', { detail: true }));
    };

    window.addEventListener('CIRILA_CRITICAL_ALERT', handleScoreAlert);
    window.addEventListener('NIR_WEBHOOK_REPLY', handleSimulatedReply);
    window.addEventListener('TOGGLE_CIRILA', handleToggle);
    return () => {
      window.removeEventListener('CIRILA_CRITICAL_ALERT', handleScoreAlert);
      window.removeEventListener('NIR_WEBHOOK_REPLY', handleSimulatedReply);
      window.removeEventListener('TOGGLE_CIRILA', handleToggle);
    };
  }, []);

  async function handleSend(textOverride?: string, isSilent: boolean = false) {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    if (!isSilent) {
      setMessages(prev => [...prev, { text: textToSend, sender: 'user' }]);
      setInput('');
    }
    
    setLoading(true);
    setExpression('thinking');

    try {
      // Prioridade: anexo que acabou de ser feito (window) ou anexo persistido de uma query incompleta
      const fileUrl = (window as any).lastCirilaFileUrl || lastIncompleteFileUrl;
      
      // Se houver uma query incompleta (ex: aguardando hospital), combina com a resposta atual
      let processedQuery = textToSend;
      if (lastIncompleteQuery && !textToSend.toLowerCase().includes(lastIncompleteQuery.toLowerCase())) {
        processedQuery = `${lastIncompleteQuery} ${textToSend}`;
      }

      const finalQuery = fileUrl ? `${processedQuery} [file_url:${fileUrl}]` : processedQuery;
      
      console.log(`[CIRILA_WIDGET] Enviando query: "${processedQuery}" | Anexo: ${fileUrl || 'nenhum'}`);
      
      const reply = await askCirila(finalQuery);
      
      // Se a resposta for uma pergunta sobre hospital ou assinatura, persiste o contexto
      const isAwaitingInfo = reply.text.includes('qual o Hospital de Origem') || reply.text.includes('Quem assina pela DCRAA');
      
      if (isAwaitingInfo) {
        setLastIncompleteQuery(processedQuery);
        if (fileUrl) setLastIncompleteFileUrl(fileUrl);
      } else {
        // Se concluiu ou mudou de assunto, limpa o contexto
        console.log('[CIRILA_WIDGET] Fluxo concluído. Limpando contexto de arquivo.');
        setLastIncompleteQuery(null);
        setLastIncompleteFileUrl(null);
        if ((window as any).lastCirilaFileUrl) (window as any).lastCirilaFileUrl = null;
      }

      setMessages(prev => [...prev, reply]);
    } catch (err) {
      setMessages(prev => [...prev, { text: '❌ Erro ao conectar com o servidor da Cirila.', sender: 'ai' }]);
    } finally {
      setLoading(false);
      setExpression('neutral');
    }
  }

  const handleActionClick = (payload: string) => {
    handleSend(payload);
  };

  const getActionIcon = (payload: string) => {
    if (payload.includes('relatorio')) return <BarChart3 size={14} />;
    if (payload.includes('DOWNLOAD_DOCX') || payload.includes('DOWNLOAD_ETIQUETA')) return <FileText size={14} />;
    if (payload.includes('protocolo')) return <Bot size={14} />;
    if (payload.includes('ajuda') || payload.includes('comandos')) return <Sparkles size={14} />;
    return null;
  };

  return (
    <div className="card cirila-chat-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '85vh', 
      width: '80vw',
      maxWidth: '900px',
      padding: 0, 
      overflow: 'hidden', 
      position: 'fixed', 
      top: '50%',
      left: '50%',
      transform: isMinimized ? 'translate(-50%, -50%) scale(0.95)' : 'translate(-50%, -50%) scale(1)',
      zIndex: isMinimized ? -1 : 9999,
      opacity: isMinimized ? 0 : 1,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 100vw rgba(15,23,42,0.6)',
      pointerEvents: isMinimized ? 'none' : 'auto',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #020617, #0f172a)', padding: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', position: 'relative' }}>
            <CirilaAvatar expression={expression} size="100%" showAura={false} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>CIRILA</h3>
              <span style={{ fontSize: '0.6rem', background: expression === 'alert' ? '#ef4444' : 'rgba(0,216,255,0.15)', color: expression === 'alert' ? 'white' : '#00d8ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, transition: 'all 0.5s' }}>
                {expression === 'alert' ? 'ALERTA' : 'V.2 PIXAR'}
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: expression === 'alert' ? '#ef4444' : '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: expression === 'alert' ? '0 0 8px #ef4444' : '0 0 8px #10b981', transition: 'all 0.5s' }}></span> 
              {expression === 'alert' ? 'Status Crítico' : 'Ativa e Monitorando'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {notification && (
            <div style={{ animation: 'pulse 2s infinite', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dc2626', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
              <Bell size={14} /> ALERTA NIR
            </div>
          )}
          
          <button 
            onClick={() => setIsMinimized(true)}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.6rem', borderRadius: '12px', transition: 'all 0.2s' }}
          >
            <ChevronDown size={22} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            
            {m.sender === 'ai' && (
              <div style={{ width: '36px', height: '36px', flexShrink: 0, marginBottom: '4px' }}>
                <img src="/cirila_3D_neutral.png" alt="Cirila Pixar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain', border: '2px solid #e2e8f0' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ 
                background: m.sender === 'user' ? '#0f172a' : 'white', 
                color: m.sender === 'user' ? 'white' : '#1e293b',
                padding: '1.25rem 1.5rem',
                borderRadius: m.sender === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                fontSize: '1rem',
                lineHeight: '1.6',
                fontWeight: 500
              }}>
                <span dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                
                {(m as CirilaResponse).file && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    background: m.sender === 'user' ? 'rgba(255,255,255,0.1)' : '#f1f5f9', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    border: m.sender === 'user' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      background: m.sender === 'user' ? 'rgba(255,255,255,0.2)' : 'white', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: m.sender === 'user' ? 'white' : '#0f172a'
                    }}>
                      {m.file?.type?.includes('pdf') ? <FileText size={20} /> : <Paperclip size={20} />}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.file?.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        {m.file && m.file.size ? `${(m.file.size / 1024).toFixed(1)} KB` : 'Arquivo anexado'}
                      </div>
                    </div>
                    <CheckCircle2 size={16} color="#10b981" />
                  </div>
                )}

                {m.payload?.type === 'CIRILA_DASHBOARD' && (
                  <CirilaDashboard 
                    data={m.payload.data} 
                    period={m.payload.period} 
                    examType={m.payload.examType} 
                  />
                )}
              </div>

              {/* PROJEÇÃO HOLOGRÁFICA DE EMERGÊNCIA */}
              {m.text.includes('ALERTA CLÍNICO MÁXIMO') && (
                <div style={{ 
                  marginTop: '1rem', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  position: 'relative',
                  animation: 'hologram-flicker 0.2s infinite alternate',
                  filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))'
                }}>
                  <div style={{ width: '280px', height: '280px', position: 'relative', opacity: 0.85 }}>
                    <CirilaAvatar expression="alert" size="100%" showAura={true} />
                    {/* Efeito de Scanlines Digitais */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
                      backgroundSize: '100% 2px, 3px 100%',
                      pointerEvents: 'none',
                      zIndex: 10,
                      borderRadius: '50%'
                    }} />
                  </div>
                </div>
              )}

              {m.actions && m.actions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {m.actions.map(act => (
                        <button 
                          key={act.label}
                          onClick={() => handleActionClick(act.payload)}
                          className="cirila-action-btn"
                          style={{ 
                            background: '#f8fafc', 
                            color: '#64748b', 
                            border: '1px solid #f1f5f9', 
                            padding: '0.35rem 0.7rem', 
                            borderRadius: '10px', 
                            fontSize: '0.6rem', 
                            fontWeight: 800, 
                            cursor: 'pointer', 
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: 'none',
                            textTransform: 'uppercase',
                            letterSpacing: '0.6px'
                          }}
                        >
                          {getActionIcon(act.payload)}
                          {act.label}
                        </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {processingStatus && (
           <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px' }}>
              <CirilaAvatar expression="thinking" size="100%" showAura={false} />
            </div>
            <div style={{ background: '#eff6ff', padding: '1rem 1.5rem', borderRadius: '24px', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <Loader2 className="animate-spin" size={18} />
              {processingStatus}
            </div>
          </div>
        )}

        {loading && !processingStatus && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px' }}>
              <CirilaAvatar expression="thinking" size="100%" showAura={false} />
            </div>
            <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div className="spinner" style={{ width: '18px', height: '18px', border: '3px solid #f1f5f9', borderTopColor: '#00d8ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              Cirila está processando dados reais...
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '1.5rem 2rem', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Pergunte à Cirila..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, padding: '1rem 1.5rem', border: '1px solid #e2e8f0', borderRadius: '999px', outline: 'none', fontSize: '1rem', backgroundColor: '#f8fafc', fontWeight: 500 }}
        />

        <input 
          type="file" 
          id="cirila-file-upload" 
          hidden 
          accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setLoading(true);
            setExpression('thinking');
            setProcessingStatus(`📂 Enviando arquivo: ${file.name}...`);
            
            try {
              // 1. Realiza o upload real para o servidor
              const formData = new FormData();
              formData.append('file', file);
              
              const uploadRes = await fetch('/api/cirila/upload', {
                method: 'POST',
                body: formData
              });
              const uploadData = await uploadRes.json();

              if (!uploadRes.ok) throw new Error(uploadData.error || 'Erro no upload');

              // Adiciona o arquivo visualmente no chat com confirmação de "Recebido"
              setMessages(prev => [...prev, { 
                text: `Documento **${file.name}** recebido chefe! Ele será usado como **Template Visual**. \n\nAgora me diga: **Qual paciente e qual exame devo regular nele?**`, 
                sender: 'ai',
                file: {
                  name: uploadData.name,
                  size: uploadData.size,
                  type: uploadData.type
                }
              }]);

              // 🔥 LIMPEZA CRÍTICA: Garante que o novo arquivo mate qualquer contexto anterior
              setLastIncompleteFileUrl(null);
              (window as any).lastCirilaFileUrl = uploadData.url;
              console.log(`[CIRILA_WIDGET] Novo anexo pronto (Cache Buster): ${uploadData.url}`);

            } catch (err: any) {
              console.error('Erro no anexo:', err);
              setMessages(prev => [...prev, { text: `❌ Erro no anexo: ${err.message || 'Erro desconhecido'}`, sender: 'ai' }]);
            } finally {
              setProcessingStatus(null);
              setLoading(false);
              setExpression('neutral');
              e.target.value = '';
            }
          }}
        />


        <button 
          onClick={() => document.getElementById('cirila-file-upload')?.click()}
          style={{ background: '#f1f5f9', border: 'none', color: '#64748b', width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
          title="Anexar Pedido (PDF, Imagem ou Word)"
        >
          <Paperclip size={22} />
        </button>

        <button 
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          style={{ background: input.trim() ? '#0f172a' : '#cbd5e1', border: 'none', color: 'white', width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.3s' }}
        >
          {loading ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
        </button>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes hologram-flicker {
          0% { opacity: 0.8; transform: skewY(0deg) scale(1); }
          5% { opacity: 0.9; transform: skewY(1deg) scale(1.01); }
          10% { opacity: 0.7; transform: skewY(-1deg) scale(0.99); }
          15% { opacity: 1; transform: skewY(0deg) scale(1); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        .cirila-action-btn:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          transform: translateY(-1.5px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
        }
        .cirila-action-btn:active {
          transform: translateY(0) scale(0.96);
          box-shadow: none !important;
        }
        @media (max-width: 768px) {
          .cirila-chat-container { width: 100vw !important; height: 100vh !important; max-width: none !important; border-radius: 0 !important; top: 0 !important; left: 0 !important; transform: none !important; }
        }
      `}} />
    </div>
  );
}
