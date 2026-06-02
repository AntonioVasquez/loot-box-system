'use client';

import React from 'react';

interface HudPanelProps {
  children: React.ReactNode;
  className?: string;
  /** Color principal de los corners / borde */
  accentColor?: string;
  /** Etiqueta flotante top-left */
  label?: string;
  /** ID técnico top-right */
  tag?: string;
  /** Muestra línea de scan animada */
  scanLine?: boolean;
}

/**
 * Panel con estética HUD futurista:
 * - Corners brackets decorativos
 * - Etiqueta flotante superior
 * - Scan line opcional
 * - Fondo glass oscuro
 */
export default function HudPanel({
  children,
  className = '',
  accentColor = '#a855f7',
  label,
  tag,
  scanLine = false,
}: HudPanelProps) {
  const cornerStyle = (borders: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    width: 16,
    height: 16,
    pointerEvents: 'none',
    zIndex: 10,
    ...borders,
    borderColor: accentColor,
    borderStyle: 'solid',
  });

  return (
    <div
      className={`relative overflow-visible ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(10,8,28,0.88) 0%, rgba(7,5,20,0.92) 100%)',
        backdropFilter: 'blur(16px)',
        borderRadius: 14,
        border: `1px solid ${accentColor}1a`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 0 ${accentColor}`,
      }}
    >
      {/* ── Corner brackets ──────────────────────────────────── */}
      <span style={cornerStyle({ top: -1, left: -1,  borderWidth: '2px 0 0 2px', borderRadius: '5px 0 0 0' })} />
      <span style={cornerStyle({ top: -1, right: -1, borderWidth: '2px 2px 0 0', borderRadius: '0 5px 0 0' })} />
      <span style={cornerStyle({ bottom: -1, left: -1,  borderWidth: '0 0 2px 2px', borderRadius: '0 0 0 5px' })} />
      <span style={cornerStyle({ bottom: -1, right: -1, borderWidth: '0 2px 2px 0', borderRadius: '0 0 5px 0' })} />

      {/* ── Labels ───────────────────────────────────────────── */}
      {label && (
        <div
          className="absolute -top-[11px] left-5 px-2 text-[8px] font-bold uppercase tracking-[0.22em] font-mono z-20"
          style={{ color: accentColor, background: '#07051a' }}
        >
          {label}
        </div>
      )}
      {tag && (
        <div
          className="absolute -top-[11px] right-5 px-2 text-[8px] font-bold uppercase tracking-[0.22em] font-mono z-20 opacity-35"
          style={{ color: accentColor, background: '#07051a' }}
        >
          {tag}
        </div>
      )}

      {/* ── Scan line ────────────────────────────────────────── */}
      {scanLine && <div className="scan-line-anim" style={{ overflow: 'hidden' }} />}

      {children}
    </div>
  );
}
