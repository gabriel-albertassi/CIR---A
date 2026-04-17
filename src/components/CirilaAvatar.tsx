'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

type CirilaExpression = 'neutral' | 'smiling' | 'thinking' | 'alert';

interface CirilaAvatarProps {
  expression?: CirilaExpression;
  size?: number | string;
  showAura?: boolean;
  className?: string;
}

export default function CirilaAvatar({
  expression = 'neutral',
  size = '100%',
  showAura = true,
  className = ''
}: CirilaAvatarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Cores da Aura baseadas no estado
  const auraColors: Record<CirilaExpression, string> = {
    neutral: 'rgba(0, 216, 255, 0.15)',
    smiling: 'rgba(16, 185, 129, 0.2)', // Verde
    thinking: 'rgba(0, 216, 255, 0.3)', // Ciano mais forte
    alert: 'rgba(245, 158, 11, 0.25)' // Laranja/Ambar
  };

  const images = [
    { key: 'neutral', src: '/cirila_3D_neutral.png' },
    { key: 'smiling', src: '/cirila_3D_smiling.png' },
    { key: 'thinking', src: '/cirila_3D_thinking.png' },
    { key: 'alert', src: '/cirila_3D_alert.png' }
  ];

  return (
    <div className={`cirila-avatar-wrapper ${className}`} style={{
      position: 'relative',
      width: size,
      height: 'auto',
      aspectRatio: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible'
    }}>
      {/* Conjunto de Imagens com Cross-Fade Otimizado */}
      {images.map((img) => (
        <div 
          key={img.key}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: expression === img.key ? 1 : 0,
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: expression === img.key ? 2 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            willChange: 'opacity'
          }}
        >
          <Image
            src={img.src}
            alt={`Cirila ${img.key}`}
            width={500}
            height={500}
            priority={img.key === 'neutral'}
            style={{
              width: '85%',
              height: '85%',
              objectFit: 'contain',
              filter: expression === img.key ? `drop-shadow(0 0 20px ${auraColors[expression]})` : 'none',
              transition: 'filter 0.5s ease'
            }}
          />
        </div>
      ))}

      <style jsx>{`
        .cirila-avatar-wrapper {
          user-select: none;
          pointer-events: none;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
