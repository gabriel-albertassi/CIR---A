'use client'

import React, { useState, useRef, useEffect } from 'react';

export default function CallCirilaButton() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasBadge, setHasBadge] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Captura apenas do botão esquerdo/toque inicial
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    startPos.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    setIsDragging(true);
    hasDragged.current = false;
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - startPos.current.x;
      const newY = e.clientY - startPos.current.y;
      
      if (Math.abs(newX - offset.x) > 3 || Math.abs(newY - offset.y) > 3) {
        hasDragged.current = true;
      }
      setOffset({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      // Evita rolagem no mobile durante o drag
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, offset.x, offset.y]);

  useEffect(() => {
    const handleBadge = (e: any) => setHasBadge(!!e.detail);
    window.addEventListener('CIRILA_BADGE', handleBadge);
    return () => window.removeEventListener('CIRILA_BADGE', handleBadge);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      return; 
    }
    setHasBadge(false);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('TOGGLE_CIRILA'));
  };

  return (
    <div 
      className="cirila-trigger-btn"
      style={{ 
        position: 'fixed', 
        bottom: '2rem', 
        left: '50%', 
        transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)`, 
        zIndex: 9000, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '0.5rem',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none' // Important to prevent touch scroll on the element
      }}
      onPointerDown={handlePointerDown}
    >
      <div style={{ 
        background: 'rgba(255,255,255,0.9)', 
        backdropFilter: 'blur(8px)', 
        padding: '0.5rem', 
        borderRadius: '50%', 
        boxShadow: isDragging ? '0 15px 35px rgba(37,99,235,0.4)' : '0 10px 25px rgba(37,99,235,0.3)', 
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
        display: 'flex'
      }}>
        <button 
          onClick={handleClick}
          title="Chamar Cirila"
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: isDragging ? 'grabbing' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            transition: 'transform 0.2s', 
            padding: 0, 
            outline: 'none',
            position: 'relative'
          }}
          onMouseOver={(e:any) => { if(!isDragging) e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseOut={(e:any) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img src="/cirila_3D_neutral.png" alt="Chamar Cirila" style={{ width: '48px', height: '48px', objectFit: 'contain', pointerEvents: 'none', borderRadius: '50%' }} />
          {hasBadge && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px', background: '#dc2626', color: 'white', borderRadius: '50%', border: '3px solid white', animation: 'pulse 1.5s infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>!</span>
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .cirila-trigger-btn {
            left: auto !important;
            right: 1.5rem !important;
            bottom: 1.5rem !important;
            transform: translate(${offset.x}px, ${offset.y}px) !important;
          }
        }
      `}} />
    </div>
  );
}
