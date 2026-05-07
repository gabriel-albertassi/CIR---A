'use client';

import React, { useState, useEffect } from 'react';
import CirilaAvatar from './CirilaAvatar';

export default function InteractiveCirilaPanel() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [expression, setExpression] = useState<'neutral' | 'smiling' | 'thinking' | 'alert'>('neutral');

  const dashboardPhrases = [
    "Monitorando fluxos clínicos em tempo real...",
    "Rede de Volta Redonda 100% online.",
    "Tudo sob controle! Como posso ajudar?",
    "Fila de pacientes estável agora.",
    "Bom trabalho hoje, Regulação!",
    "IA sincronizada com os hospitais."
  ];

  useEffect(() => {
    const handleGlobalAlert = (e: any) => {
      setExpression('alert');
      setDisplayedText(`⚠️ ALERTA CRÍTICO: ${e.detail || 'Verifique a fila!'}`);
      setTimeout(() => setExpression('neutral'), 15000);
    };

    window.addEventListener('CIRILA_CRITICAL_ALERT', handleGlobalAlert);
    return () => window.removeEventListener('CIRILA_CRITICAL_ALERT', handleGlobalAlert);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (expression === 'alert') return; // Não rotaciona se estiver em alerta
      setPhraseIndex((prev) => (prev + 1) % dashboardPhrases.length);
      setExpression('neutral');
    }, 10000);
    return () => clearInterval(interval);
  }, [expression]);

  useEffect(() => {
    if (expression === 'alert') return; // O texto de alerta é fixo
    let currentText = '';
    let charIndex = 0;
    setDisplayedText('');

    const typeInterval = setInterval(() => {
      if (charIndex < dashboardPhrases[phraseIndex].length) {
        currentText += dashboardPhrases[phraseIndex].charAt(charIndex);
        setDisplayedText(currentText);
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [phraseIndex, expression]);

  return (
    <div
      onClick={() => window.dispatchEvent(new CustomEvent('TOGGLE_CIRILA'))}
      title="Abrir Assistente Cirila"
      className="interactive-cirila-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1.25rem 1.5rem',
        cursor: 'pointer',
        background: expression === 'alert' ? '#450a0a' : '#0b192c',
        borderRadius: '16px',
        border: expression === 'alert' ? '2px solid #ef4444' : '1px solid #1e3a8a',
        transition: 'all 0.2s ease',
        minHeight: '110px',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        if (expression !== 'alert') {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#00b4d8';
          (e.currentTarget as HTMLDivElement).style.background = '#0f223b';
        }
      }}
      onMouseLeave={e => {
        if (expression !== 'alert') {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#1e3a8a';
          (e.currentTarget as HTMLDivElement).style.background = '#0b192c';
        }
      }}
    >
      {/* AVATAR PIXAR */}
      <div style={{ width: '85px', flexShrink: 0 }}>
        <CirilaAvatar
          expression={expression}
          size="100%"
          showAura={false}
        />
      </div>

      {/* TEXTOS DINÂMICOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
            CIR-A
          </h3>
          <span style={{ fontSize: '0.65rem', background: '#1e40af', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
            Assistente IA
          </span>
        </div>

        <div style={{ minHeight: '1.5rem' }}>
          <span style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: 500, lineHeight: 1.3, display: 'block' }}>
            {displayedText}
          </span>
        </div>

        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Clique para abrir o painel ›
        </span>
      </div>
    </div>

  );
}
