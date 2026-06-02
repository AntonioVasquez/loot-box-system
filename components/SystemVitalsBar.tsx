'use client';

/**
 * SystemVitalsBar
 * ───────────────
 * Fixed top strip showing CPU / MEM / NET / THREAT LEVEL.
 * Values fluctuate gently in idle mode.
 * When 'hacker-appear' fires, spikes progressively to critical,
 * then normalises after ~7 seconds.
 */

import { useEffect, useRef, useState } from 'react';

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type Threat = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface Vitals { cpu: number; mem: number; net: number; threat: Threat }

const THREAT_COLOR: Record<Threat, string> = {
  LOW:      '#22c55e',
  MEDIUM:   '#eab308',
  HIGH:     '#f97316',
  CRITICAL: '#ef4444',
};

function miniBar(pct: number, color: string) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 44, height: 3,
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          width:      `${pct}%`,
          height:     '100%',
          background: color,
          boxShadow:  `0 0 5px ${color}`,
          borderRadius: 2,
          transition: 'width 700ms ease, background 400ms ease',
        }} />
      </div>
      <span style={{
        fontFamily: '"Courier New",monospace',
        fontSize:   9,
        color,
        minWidth:   24,
        textAlign:  'right',
        transition: 'color 400ms',
      }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export default function SystemVitalsBar() {
  const [vitals, setVitals] = useState<Vitals>({ cpu: 34, mem: 28, net: 22, threat: 'LOW' });
  const [clock,  setClock]  = useState('');
  const attackRef = useRef(false);
  const timers    = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Clock — updates every second */
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US',
      { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Idle fluctuation + attack response */
  useEffect(() => {
    const idle = setInterval(() => {
      if (attackRef.current) return;
      setVitals(p => ({
        cpu:    clamp(p.cpu    + (Math.random() - 0.5) * 7,  12, 52),
        mem:    clamp(p.mem    + (Math.random() - 0.5) * 4,  18, 44),
        net:    clamp(p.net    + (Math.random() - 0.5) * 10,  5, 38),
        threat: 'LOW',
      }));
    }, 1800);

    const onAttack = () => {
      attackRef.current = true;
      const push = (delay: number, v: Vitals) => {
        const t = setTimeout(() => setVitals(v), delay);
        timers.current.push(t);
      };
      push(0,    { cpu: 68, mem: 55, net: 78, threat: 'HIGH'     });
      push(900,  { cpu: 88, mem: 72, net: 95, threat: 'CRITICAL' });
      push(1800, { cpu: 97, mem: 84, net: 99, threat: 'CRITICAL' });
      const rec = setTimeout(() => {
        attackRef.current = false;
        setVitals({ cpu: 42, mem: 31, net: 25, threat: 'LOW' });
      }, 7500);
      timers.current.push(rec);
    };

    window.addEventListener('hacker-appear', onAttack);
    return () => {
      clearInterval(idle);
      window.removeEventListener('hacker-appear', onAttack);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const cpuC = vitals.cpu > 80 ? '#ef4444' : vitals.cpu  > 60 ? '#f97316' : '#22c55e';
  const memC = vitals.mem > 75 ? '#ef4444' : vitals.mem  > 55 ? '#eab308' : '#22c55e';
  const netC = vitals.net > 85 ? '#ef4444' : vitals.net  > 65 ? '#f97316' : '#06b6d4';
  const tc   = THREAT_COLOR[vitals.threat];
  const crit = vitals.threat === 'CRITICAL';

  return (
    <div style={{
      position:       'fixed',
      inset:          '0 0 auto',
      zIndex:         100,
      pointerEvents:  'none',
      display:        'flex',
      alignItems:     'center',
      gap:            16,
      padding:        '3px 14px',
      background:     'rgba(2,1,10,0.92)',
      borderBottom:   `1px solid ${crit ? 'rgba(239,68,68,0.25)' : 'rgba(168,85,247,0.10)'}`,
      backdropFilter: 'blur(8px)',
      transition:     'border-color 600ms',
      userSelect:     'none',
    }}>
      {/* Identifier */}
      <span style={{
        fontFamily:    '"Courier New",monospace',
        fontSize:      8,
        color:         'rgba(168,85,247,0.45)',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        marginRight:   2,
      }}>
        NEXUS·SYS
      </span>

      {[
        { label: 'CPU', val: vitals.cpu, color: cpuC },
        { label: 'MEM', val: vitals.mem, color: memC },
        { label: 'NET', val: vitals.net, color: netC },
      ].map(({ label, val, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontFamily:    '"Courier New",monospace',
            fontSize:      8,
            color:         'rgba(255,255,255,0.22)',
            letterSpacing: '0.15em',
          }}>
            {label}
          </span>
          {miniBar(val, color)}
        </div>
      ))}

      {/* Threat badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
        <span style={{
          width:      5, height: 5, borderRadius: '50%',
          background: tc,
          boxShadow:  `0 0 6px ${tc}`,
          flexShrink: 0,
          animation:  crit ? 'delete-warning-pulse 0.55s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          fontFamily:    '"Courier New",monospace',
          fontSize:      8,
          fontWeight:    'bold',
          color:         tc,
          letterSpacing: '0.18em',
          transition:    'color 400ms',
          animation:     crit ? 'delete-warning-pulse 0.55s ease-in-out infinite' : 'none',
        }}>
          THREAT:{vitals.threat}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <span style={{
        fontFamily:    '"Courier New",monospace',
        fontSize:      8,
        color:         'rgba(168,85,247,0.28)',
        letterSpacing: '0.10em',
      }}>
        {clock}
      </span>
    </div>
  );
}
