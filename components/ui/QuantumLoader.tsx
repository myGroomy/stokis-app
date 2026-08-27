'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface QuantumLoaderProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function QuantumLoader({ text = 'Loading', className, size = 'md' }: QuantumLoaderProps) {
  const letters = text.split('');
  const sizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="generating-loader-wrapper">
        <div className="generating-loader-text">
          {letters.map((letter, i) => (
            <span
              key={i}
              className="generating-loader-letter"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>
        <div className="generating-loader-bar" />
      </div>
    </div>
  );
}

// Full-page loader overlay
export function QuantumLoaderFull({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
      <QuantumLoader text={text || 'Memuat'} size="md" />
    </div>
  );
}

// Inline mini loader (replaces Loader2 in buttons etc.)
export function QuantumLoaderMini() {
  return (
    <div className="quantum-mini-loader">
      <span />
      <span />
      <span />
    </div>
  );
}
