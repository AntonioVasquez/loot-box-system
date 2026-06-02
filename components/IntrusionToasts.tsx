'use client';

/**
 * IntrusionToasts
 * ────────────────
 * Top-right stacked toasts triggered by 'hacker-appear' event.
 * Sequence of 5 toasts fires over 7 seconds (breach → countermeasure).
 * Each toast auto-dismisses after 4s with a slide-out animation.
 * Pure CSS animations — no framer-motion required.
 */

import { useEffect, useRef, useState } from 'react';

type ToastType = 'breach' | 'warning' | 'info' | 'success';

interface Toast {
  id:      string;
  type:    ToastType;
  title:   string;
  msg:     string;
  leaving: boolean;
}

const TYPE_STYLE: Record<ToastType, { border: string; titleColor: string; icon: string; glow: string }> = {
  breach:  { border: 'rgba(239,68,68,0.55)',  titleColor: '#f87171', icon: '⚠', glow: 'rgba(239,68,68,0.20)' },
  warning: { border: 'rgba(249,115,22,0.50)', titleColor: '#fb923c', icon: '!', glow: 'rgba(249,115,22,0.15)' },
  info:    { border: 'rgba(59,130,246,0.45)',  titleColor: '#60a5fa', icon: '●', glow: 'rgba(59,130,246,0.12)' },
  success: { border: 'rgba(34,197,94,0.45)',   titleColor: '#4ade80', icon: '✓', glow: 'rgba(34,197,94,0.12)'  },
};

const SEQUENCE: { delay: number; toast: Omit<Toast, 'id' | 'leaving'> }[] = [
  { delay:   400, toast: { type: 'breach',  title: '⚠ BREACH DETECTED',       msg: 'PORT 22 — SSH unauthorized entry'        }},
  { delay:  1600, toast: { type: 'breach',  title: '⚠ UNAUTHORIZED ACCESS',   msg: '185.220.101.47 → NEXUS-CORE'             }},
  { delay:  3100, toast: { type: 'warning', title: '! FIREWALL BYPASSED',      msg: 'ZONE DMZ perimeter compromised'           }},
  { delay:  5600, toast: { type: 'success', title: '✓ COUNTERMEASURE ACTIVE',  msg: 'Blocking 185.220.101.47...'               }},
  { delay:  7200, toast: { type: 'info',    title: '✓ SYSTEM RECOVERING',      msg: 'Services restoring to normal state'       }},
];

let uid = 0;

export default function IntrusionToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dismiss = (id: string) => {
    /* Mark as leaving → CSS slide-out plays */
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    /* Remove after animation (260ms) */
    const t = setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280);
    timers.current.push(t);
  };

  const addToast = (toast: Omit<Toast, 'id' | 'leaving'>) => {
    const id = `toast-${uid++}`;
    setToasts(prev => [...prev.slice(-3), { ...toast, id, leaving: false }]); // max 4
    /* Auto-dismiss */
    const t = setTimeout(() => dismiss(id), 4200);
    timers.current.push(t);
  };

  useEffect(() => {
    const onAttack = () => {
      SEQUENCE.forEach(({ delay, toast }) => {
        const t = setTimeout(() => addToast(toast), delay);
        timers.current.push(t);
      });
    };

    window.addEventListener('hacker-appear', onAttack);
    return () => {
      window.removeEventListener('hacker-appear', onAttack);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes intrusion-toast-in {
          from { transform: translateX(115%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes intrusion-toast-out {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(115%); opacity: 0; }
        }
      `}</style>

      <div style={{
        position:      'fixed',
        top:           40,          /* below vitals bar */
        right:         16,
        zIndex:        9400,
        pointerEvents: 'none',
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
        width:         320,
      }}>
        {toasts.map(toast => {
          const s = TYPE_STYLE[toast.type];
          return (
            <div key={toast.id} style={{
              background:    `rgba(2,1,10,0.95)`,
              border:        `1px solid ${s.border}`,
              borderRadius:  6,
              padding:       '10px 14px',
              boxShadow:     `0 0 24px ${s.glow}, inset 0 0 16px ${s.glow}`,
              backdropFilter: 'blur(12px)',
              fontFamily:    '"Courier New",monospace',
              animation:     toast.leaving
                ? 'intrusion-toast-out 0.26s ease-in forwards'
                : 'intrusion-toast-in  0.30s cubic-bezier(0.34,1.56,0.64,1) forwards',
              position:      'relative',
              overflow:      'hidden',
            }}>
              {/* Top accent line */}
              <div style={{
                position:   'absolute',
                top:        0, left: 0, right: 0,
                height:     1,
                background: `linear-gradient(90deg, transparent, ${s.border}, transparent)`,
              }} />

              {/* Left status bar */}
              <div style={{
                position:     'absolute',
                left:         0, top: 0, bottom: 0,
                width:        3,
                background:   s.border,
                boxShadow:    `0 0 8px ${s.border}`,
                borderRadius: '3px 0 0 3px',
              }} />

              <div style={{ paddingLeft: 8 }}>
                <div style={{
                  fontSize:      10,
                  fontWeight:    'bold',
                  color:         s.titleColor,
                  letterSpacing: '0.15em',
                  textShadow:    `0 0 8px ${s.titleColor}`,
                  marginBottom:  3,
                }}>
                  {toast.title}
                </div>
                <div style={{
                  fontSize:      9,
                  color:         'rgba(200,200,220,0.65)',
                  letterSpacing: '0.08em',
                }}>
                  {toast.msg}
                </div>
              </div>

              {/* Scanline */}
              <div style={{
                position:   'absolute',
                inset:      0,
                background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)',
                pointerEvents: 'none',
              }} />
            </div>
          );
        })}
      </div>
    </>
  );
}
