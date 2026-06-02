'use client';

import { useEffect, useState } from 'react';
import { BoxItem, RARITY_CONFIG } from '@/types';

interface Props {
  item: BoxItem;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ item, onConfirm, onCancel }: Props) {
  const conf = RARITY_CONFIG[item.rarity];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 12);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(false);
      if (e.key === 'Enter')  dismiss(true);
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (confirm: boolean) => {
    setVisible(false);
    setTimeout(() => (confirm ? onConfirm() : onCancel()), 270);
  };

  /* ── corner bracket helper ──────────────────────────────────── */
  const corner = (pos: React.CSSProperties) => (
    <span style={{
      position: 'absolute', width: 22, height: 22, zIndex: 10,
      pointerEvents: 'none', borderStyle: 'solid', borderColor: '#ef4444',
      ...pos,
    }} />
  );

  return (
    <div
      className={`fixed inset-0 z-[9500] flex items-center justify-center px-4
        transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(2,1,12,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={() => dismiss(false)}
    >
      <div
        className={`relative w-full transition-all duration-300 ${
          visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-5'}`}
        style={{ maxWidth: 440 }}
        onClick={e => e.stopPropagation()}
      >
        {/* HUD corner brackets — red */}
        {corner({ top: -3, left: -3,   borderWidth: '2px 0 0 2px', borderRadius: '5px 0 0 0' })}
        {corner({ top: -3, right: -3,  borderWidth: '2px 2px 0 0', borderRadius: '0 5px 0 0' })}
        {corner({ bottom: -3, left: -3,  borderWidth: '0 0 2px 2px', borderRadius: '0 0 0 5px' })}
        {corner({ bottom: -3, right: -3, borderWidth: '0 2px 2px 0', borderRadius: '0 0 5px 0' })}

        {/* Scan-line texture overlay */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.013) 2px, rgba(239,68,68,0.013) 4px)',
          zIndex: 20,
        }} />

        <div className="rounded-xl overflow-hidden" style={{
          background: 'rgba(6,2,16,0.98)',
          border: '1px solid rgba(239,68,68,0.22)',
          boxShadow: '0 0 80px rgba(239,68,68,0.13), 0 0 160px rgba(239,68,68,0.05), inset 0 0 60px rgba(239,68,68,0.03)',
        }}>

          {/* ── Alert header strip ───────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b" style={{
            borderColor: 'rgba(239,68,68,0.18)',
            background: 'rgba(239,68,68,0.07)',
          }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-[8px] tracking-[0.3em] text-red-500 uppercase font-black">
                ⚠ ALERTA CRÍTICA — OPERACIÓN DESTRUCTIVA
              </span>
            </div>
            <span className="font-mono text-[8px] text-red-900 tracking-widest">v2.0</span>
          </div>

          <div className="px-8 pt-8 pb-7">

            {/* ── Warning icon ─────────────────────────────────────── */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                  background: 'radial-gradient(circle, rgba(239,68,68,0.22) 0%, transparent 70%)',
                  transform: 'scale(2.8)',
                  animation: 'delete-warning-pulse 1.1s ease-in-out infinite',
                }} />
                <div className="relative flex items-center justify-center rounded-2xl p-5" style={{
                  background: 'rgba(239,68,68,0.09)',
                  border: '1px solid rgba(239,68,68,0.32)',
                  boxShadow: '0 0 30px rgba(239,68,68,0.12)',
                }}>
                  <span className="material-icons-outlined" style={{
                    fontSize: '46px', color: '#ef4444',
                    animation: 'delete-warning-pulse 1.1s ease-in-out infinite',
                  }}>
                    dangerous
                  </span>
                </div>
              </div>
            </div>

            {/* ── Title ────────────────────────────────────────────── */}
            <h2 className="text-center font-display font-black text-xl uppercase tracking-widest text-red-400 mb-1">
              ELIMINACIÓN PERMANENTE
            </h2>
            <p className="text-center font-mono text-[8px] tracking-[0.38em] text-red-900 uppercase mb-7">
              // ACCIÓN IRREVERSIBLE //
            </p>

            {/* ── Item preview ─────────────────────────────────────── */}
            <div className="rounded-lg px-5 py-4 mb-5" style={{
              background: `${conf.color}0c`,
              border: `1px solid ${conf.color}22`,
            }}>
              <div className="text-[7px] font-mono tracking-[0.3em] text-gray-600 uppercase mb-3">
                OBJETO OBJETIVO
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display font-black text-2xl truncate" style={{
                    color: conf.color,
                    textShadow: `0 0 22px ${conf.color}55`,
                  }}>
                    {item.identifier}
                  </div>
                  <div className="font-mono text-[8px] text-gray-700 mt-1 tracking-widest">
                    UID: {item.id.slice(-10).toUpperCase()}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded font-mono" style={{
                    color: conf.color,
                    background: `${conf.color}18`,
                    border: `1px solid ${conf.color}30`,
                  }}>
                    {conf.label}
                  </span>
                  <span className="font-mono text-[10px] font-bold" style={{ color: `${conf.color}70` }}>
                    {item.percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* ── Warning message ──────────────────────────────────── */}
            <div className="rounded-lg p-4 mb-8" style={{
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.11)',
            }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1 h-1 rounded-full bg-red-700 shrink-0" />
                <span className="font-mono text-[8px] tracking-[0.25em] text-red-700 uppercase font-bold">
                  ADVERTENCIA DEL SISTEMA
                </span>
              </div>
              <p className="font-mono text-[10px] text-gray-500 leading-relaxed">
                Esta operación <span className="text-red-400 font-bold">destruirá permanentemente</span> el
                objeto del banco de datos. No existe ninguna forma de{' '}
                <span className="text-red-500 font-bold">recuperar</span> el elemento eliminado.
              </p>
            </div>

            {/* ── Action buttons ───────────────────────────────────── */}
            <div className="flex gap-3">
              <button
                onClick={() => dismiss(false)}
                className="flex-1 py-3.5 rounded-xl font-display font-black text-xs uppercase tracking-widest
                  transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: 'rgba(6,182,212,0.07)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.22)' }}
                onMouseEnter={e => {
                  const b = e.currentTarget;
                  b.style.background  = 'rgba(6,182,212,0.18)';
                  b.style.boxShadow   = '0 0 22px rgba(6,182,212,0.22)';
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget;
                  b.style.background = 'rgba(6,182,212,0.07)';
                  b.style.boxShadow  = 'none';
                }}
              >
                ← ABORTAR
              </button>

              <button
                onClick={() => dismiss(true)}
                className="flex-1 py-3.5 rounded-xl font-display font-black text-xs uppercase tracking-widest
                  transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: 'rgba(239,68,68,0.09)', color: '#f87171', border: '1px solid rgba(239,68,68,0.28)' }}
                onMouseEnter={e => {
                  const b = e.currentTarget;
                  b.style.background = '#ef4444';
                  b.style.color      = '#fff';
                  b.style.boxShadow  = '0 0 32px rgba(239,68,68,0.45)';
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget;
                  b.style.background = 'rgba(239,68,68,0.09)';
                  b.style.color      = '#f87171';
                  b.style.boxShadow  = 'none';
                }}
              >
                ⚡ DESTRUIR
              </button>
            </div>

            {/* ESC hint */}
            <p className="text-center font-mono text-[8px] text-gray-800 mt-4 tracking-widest">
              ESC para cancelar · ENTER para confirmar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
