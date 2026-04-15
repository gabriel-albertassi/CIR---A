'use client';
import React from 'react';

export default function InteractiveCirilaPanel() {
  return (
    <div
      onClick={() => window.dispatchEvent(new CustomEvent('TOGGLE_CIRILA'))}
      title="Abrir Assistente Cirila"
      className="interactive-cirila-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1.5rem',
        cursor: 'pointer',
        background: 'rgba(4, 12, 28, 0.85)',
        borderRadius: '20px',
        border: '1px solid rgba(0, 216, 255, 0.35)',
        boxShadow: '0 0 40px rgba(0, 216, 255, 0.08), inset 0 0 30px rgba(0,0,0,0.2)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        minHeight: '110px',
        gap: '1rem',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,216,255,0.6)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 60px rgba(0,216,255,0.18), inset 0 0 30px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,216,255,0.35)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 40px rgba(0,216,255,0.08), inset 0 0 30px rgba(0,0,0,0.2)';
      }}
    >
      {/* ÍCONE */}
      <div style={{
        width: '88px',
        height: '88px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,216,255,0.06)',
        borderRadius: '50%',
        border: '1.5px solid rgba(0,216,255,0.25)',
        boxShadow: '0 0 28px rgba(0,216,255,0.18)',
        padding: '10px',
      }}>
        <img
          src="/cirila_icone.png"
          alt="Cirila Avatar"
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(0,216,255,0.65))' }}
        />
      </div>

      {/* TEXTOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.1, textShadow: '0 2px 16px rgba(255,255,255,0.2)' }}>
          CIR-A
        </h3>
        <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, lineHeight: 1.2 }}>
          A inteligência que regula.
        </span>
        <span style={{ fontSize: '0.95rem', color: '#00e5ff', fontWeight: 700, lineHeight: 1.2, textShadow: '0 0 16px rgba(0,229,255,0.6)' }}>
          Cirila: A inteligência que cuida.
        </span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(0,216,255,0.5)', fontWeight: 500, marginTop: '0.25rem', letterSpacing: '0.05em' }}>
          Clique para abrir o assistente ›
        </span>
      </div>
    </div>
  );
}
