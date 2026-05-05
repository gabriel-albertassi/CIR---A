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
        background: expression === 'alert' ? 'rgba(69, 10, 10, 0.9)' : 'rgba(4, 12, 28, 0.85)',
        borderRadius: '24px',
        border: expression === 'alert' ? '1px solid #ef4444' : '1px solid rgba(0, 216, 255, 0.35)',
        boxShadow: expression === 'alert' ? '0 0 50px rgba(239, 68, 68, 0.3)' : '0 0 40px rgba(0, 216, 255, 0.08), inset 0 0 30px rgba(0,0,0,0.2)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '120px',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        if (expression !== 'alert') {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,216,255,0.6)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 60px rgba(0,216,255,0.18), inset 0 0 30px rgba(0,0,0,0.2)';
        }
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        if (expression !== 'alert') {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,216,255,0.35)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 40px rgba(0, 216, 255, 0.08), inset 0 0 30px rgba(0,0,0,0.2)';
        }
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* AVATAR PIXAR */}
      <div style={{ width: '90px', flexShrink: 0 }}>
        <CirilaAvatar
          expression={expression}
          size="100%"
          showAura={expression === 'alert'}
        />
      </div>

      {/* TEXTOS DINÂMICOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
            CIR-A
          </h3>
          <span style={{ fontSize: '0.65rem', background: 'rgba(0,229,255,0.15)', color: '#00e5ff', padding: '2px 8px', borderRadius: '999px', fontWeight: 800, textTransform: 'uppercase' }}>
            Cirila I.A
          </span>
        </div>

        <div style={{ minHeight: '1.5rem' }}>
          <span style={{ fontSize: '1rem', color: '#f1f5f9', fontWeight: 600, lineHeight: 1.2, display: 'block' }}>
            {displayedText}
          </span>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'rgba(0,216,255,0.6)', fontWeight: 500, marginTop: '0.5rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Clique para abrir o terminal ›
        </span>
      </div>

      {/* Decorativo */}
      <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(0,216,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
    </div>
  );
}
