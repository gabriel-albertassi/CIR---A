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
  showAura = false,
  className = ''
}: CirilaAvatarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // No estilo institucional, usamos o ícone flat original
  const iconSrc = '/cirila_icone.png';

  // Cores de status sutis para a borda
  const statusColors: Record<CirilaExpression, string> = {
    neutral: '#e2e8f0',
    smiling: '#10b981',
    thinking: '#0ea5e9',
    alert: '#ef4444'
  };

  return (
    <div className={`cirila-avatar-wrapper ${className}`} style={{
      position: 'relative',
      width: size,
      height: 'auto',
      aspectRatio: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
      background: 'white',
      borderRadius: '50%',
      padding: '4px',
      border: `2px solid ${statusColors[expression]}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease'
    }}>
      <Image
        src={iconSrc}
        alt="Cirila"
        width={128}
        height={128}
        priority
        style={{
          width: '80%',
          height: '80%',
          objectFit: 'contain',
        }}
      />

      <style jsx>{`
        .cirila-avatar-wrapper {
          user-select: none;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
