'use client';

import React, { useState, useEffect, useRef } from 'react';
import { askCirila, CirilaResponse } from '@/app/api/cirilaActions';
import { Send, Paperclip, Bot, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CirilaBotWidget() {
  const router = useRouter();
  const [messages, setMessages] = useState<CirilaResponse[]>([
    { text: 'Olá! Eu sou a Cirila, sua IA da SMSVR. Como posso agilizar a regulação hoje?', sender: 'ai', image: '/cirila_1.png' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Começa fechada
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    // Escuta global para simular recebimento do Webhook imaginário se o usuário emitir um CustomEvent.
    // Para simplificar a simulação no projeto sem Socket.io, a gente cria um timeout imaginário
    // após o primeiro uso agressivo do chat, só para o Pitch dar certo.
    const handleSimulatedReply = (e: any) => {
      const msg = e.detail || 'Nova Mensagem Recebida do NIR!';
      setNotification(msg);
      setMessages(prev => [...prev, { text: `🔔 Urgente chefe: ${msg}`, sender: 'ai' }]);
      setTimeout(() => setNotification(null), 8000);
    };
    const handleToggle = () => setIsMinimized(prev => !prev);
    
    const handleScoreAlert = (e: any) => {
      const num = e.detail;
      const msg = `⚠️ **ALERTA CLÍNICO MÁXIMO:** Detectei **${num}** paciente(s) na fila com Score elevadíssimo (acima do teto de 35 pontos ou com status de Vaga Zero Pura). A prioridade clínica está em vermelho. Recomendo abrir o modo de "Disparo de E-mail Único" na fila imediatamente, vou coordenar com as unidades conveniadas.`;
      
      setMessages(prev => {
         if (prev[prev.length - 1]?.text === msg) return prev;
         return [...prev, { text: msg, sender: 'ai', image: '/cirila_1.png' }];
      });
      setNotification(`ALERTA: SCORE ELEVADO DETECTADO`);
      setTimeout(() => setNotification(null), 10000);
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

  async function handleSend(textOverride?: string) {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { text: textToSend, sender: 'user' }]);
    setLoading(true);

    const reply = await askCirila(textToSend);
    setMessages(prev => [...prev, reply]);
    setLoading(false);
  }

  function handleActionClick(payload: string) {
    if (payload === 'NAV_QUEUE') router.push('/patients');
    if (payload === 'QUERY_QUEUE') handleSend('quantos pacientes na fila vermelha e normal?');
    if (payload === 'QUERY_ABOUT') handleSend('o que você sabe fazer?');
    if (payload === 'TRIGGER_CHARGE' || payload === 'TRIGGER_BLAST') {
      router.push('/patients');
      // Na tela de pacientes é onde instanciamos as ações para pacientes ativos, 
      // então direcionamos para lá pedindo para que eles usem o botão.
      setTimeout(() => alert('Acesso transferido para a Fila Dinâmica.\n\nSimulação: Use os botões das linhas do paciente para disparar.'), 500);
    }
  }

  return (
    <div className="card cirila-chat-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: isMinimized ? '0' : '85vh', 
      width: isMinimized ? '0' : '80vw',
      maxWidth: isMinimized ? '0' : '900px',
      padding: 0, 
      overflow: 'hidden', 
      position: isMinimized ? 'absolute' : 'fixed', 
      top: isMinimized ? 'auto' : '50%',
      left: isMinimized ? 'auto' : '50%',
      transform: isMinimized ? 'none' : 'translate(-50%, -50%)',
      zIndex: isMinimized ? -1 : 9999,
      opacity: isMinimized ? 0 : 1,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 100vw rgba(15,23,42,0.6)',
      pointerEvents: isMinimized ? 'none' : 'auto'
    }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(59,130,246,0.5)', overflow: 'hidden' }}>
            <img src="/cirila_icone_chat.png" alt="A.I Cirila" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.5px' }}>Assistente CIRILA</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Online (Modelo Avançado)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {notification && (
            <div style={{ animation: 'pulse 2s infinite', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dc2626', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
              <Bell size={14} /> NOVO E-MAIL NIR
            </div>
          )}
          
          <button 
            onClick={() => setIsMinimized(true)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Fechar Chat"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            
            <div style={{ 
              background: m.sender === 'user' ? '#2563eb' : 'white', 
              color: m.sender === 'user' ? 'white' : '#334155',
              padding: '1rem 1.25rem',
              borderRadius: m.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
              border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              {m.image && (
                 <img src={m.image} alt="Cirila Stance" style={{ width: '100%', maxWidth: '250px', borderRadius: '8px', marginBottom: '8px', objectFit: 'contain' }} />
              )}
              {/* Parse bold text hack */}
              <span dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>

            {m.actions && m.actions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {m.actions.map(act => (
                  <button 
                    key={act.label}
                    onClick={() => handleActionClick(act.payload)}
                    style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '0.5rem 0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e:any) => e.target.style.background = '#c7d2fe'}
                    onMouseOut={(e:any) => e.target.style.background = '#e0e7ff'}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'white', padding: '1rem 1.25rem', borderRadius: '16px 16px 16px 0', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            Cirila está analisando dados complexos...
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '1rem 1.5rem', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        
        <button 
          onClick={() => handleSend('[Arquivo PDF: Laudo_Paciente_HSC.pdf] anexado para análise.')}
          style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.75rem', borderRadius: '50%', transition: 'background 0.2s' }}
          title="Anexar Laudo/Evolução (Simulação)"
        >
          <Paperclip size={22} />
        </button>

        <input 
          type="text" 
          placeholder="Pergunte à Cirila sobre a fila ou anexe um documento..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, padding: '0.85rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '24px', outline: 'none', fontSize: '1rem', backgroundColor: '#f8fafc', transition: 'border-color 0.2s' }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
        />

        <button 
          onClick={() => handleSend()}
          disabled={!input.trim()}
          style={{ background: input.trim() ? '#2563eb' : '#cbd5e1', border: 'none', color: 'white', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', transform: input.trim() ? 'scale(1.05)' : 'scale(1)' }}
        >
          <Send size={20} style={{ marginLeft: '2px' }} />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .cirila-chat-container {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            border-radius: 0 !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            height: 100dvh !important; /* Dynamic viewport height for mobile browsers */
          }
        }
      `}} />
    </div>
  );
}
