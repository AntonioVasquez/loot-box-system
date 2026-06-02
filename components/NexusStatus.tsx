'use client';

/**
 * NexusStatus
 * ───────────
 * Fixed bottom-right HUD panel showing 5 fake system services.
 * In idle: all operational (1 naturally degraded for realism).
 * When 'hacker-appear' fires, services fail in sequence:
 *   +0.6s  IDS/IPS    → OFFLINE
 *   +1.8s  FIREWALL   → COMPROMISED
 *   +3.2s  ENCRYPTION → DEGRADED
 * Then recovers gradually after the hacker leaves.
 * Has a minimize toggle.
 */

import { useEffect, useRef, useState } from 'react';

type Status = 'operational' | 'degraded' | 'compromised' | 'offline';

interface Service {
  id:     string;
  name:   string;
  status: Status;
  bars:   boolean[];   // 14 mini uptime segments
}

const STATUS_CFG: Record<Status, { color: string; label: string; symbol: string }> = {
  operational: { color: '#22c55e', label: 'ONLINE',      symbol: '●' },
  degraded:    { color: '#eab308', label: 'DEGRADED',    symbol: '◐' },
  compromised: { color: '#f97316', label: 'COMPROMISED', symbol: '◉' },
  offline:     { color: '#ef4444', label: 'OFFLINE',     symbol: '✗' },
};

function makeBars(glitches = 0): boolean[] {
  const b = Array(14).fill(true);
  for (let i = 0; i < glitches; i++) {
    b[Math.floor(Math.random() * 14)] = false;
  }
  return b;
}

const INITIAL: Service[] = [
  { id: 'fw',  name: 'FIREWALL',    status: 'operational', bars: makeBars(0) },
  { id: 'enc', name: 'ENCRYPTION',  status: 'operational', bars: makeBars(0) },
  { id: 'ids', name: 'IDS/IPS',     status: 'degraded',    bars: makeBars(2) },
  { id: 'db',  name: 'DATABASE',    status: 'operational', bars: makeBars(0) },
  { id: 'api', name: 'LOOTBOX API', status: 'operational', bars: makeBars(1) },
];

export default function NexusStatus() {
  const [services,   setServices]   = useState<Service[]>(INITIAL);
  const [minimized,  setMinimized]  = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const patch = (id: string, status: Status) =>
    setServices(prev => prev.map(s =>
      s.id === id
        ? { ...s, status, bars: [...s.bars.slice(1), status === 'operational' || status === 'degraded'] }
        : s,
    ));

  useEffect(() => {
    const onAttack = () => {
      const push = (ms: number, fn: () => void) => {
        const t = setTimeout(fn, ms);
        timers.current.push(t);
      };
      /* Attack sequence */
      push(600,   () => patch('ids', 'offline'));
      push(1800,  () => patch('fw',  'compromised'));
      push(3200,  () => patch('enc', 'degraded'));
      /* Recovery sequence */
      push(8200,  () => patch('enc', 'operational'));
      push(9400,  () => patch('fw',  'degraded'));
      push(11000, () => patch('fw',  'operational'));
      push(11800, () => patch('ids', 'degraded'));
      push(13500, () => patch('ids', 'operational'));
    };

    window.addEventListener('hacker-appear', onAttack);
    return () => {
      window.removeEventListener('hacker-appear', onAttack);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const criticalCount = services.filter(s => s.status === 'offline' || s.status === 'compromised').length;
  const headerColor   = criticalCount > 0 ? '#ef4444' : '#a855f7';

  return (
    <div style={{
      position:       'fixed',
      bottom:         20,
      right:          16,
      zIndex:         100,
      width:          215,
      fontFamily:     '"Courier New",monospace',
      userSelect:     'none',
    }}>
      {/* ── Panel ──────────────────────────────────────────────── */}
      <div style={{
        background:    'rgba(2,1,10,0.94)',
        border:        `1px solid ${criticalCount > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(168,85,247,0.20)'}`,
        borderRadius:  6,
        overflow:      'hidden',
        boxShadow:     criticalCount > 0
          ? '0 0 28px rgba(239,68,68,0.10)'
          : '0 0 20px rgba(168,85,247,0.07)',
        transition:    'border-color 500ms, box-shadow 500ms',
      }}>

        {/* Header bar */}
        <div
          onClick={() => setMinimized(m => !m)}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '6px 10px',
            borderBottom:   minimized ? 'none' : `1px solid rgba(168,85,247,0.10)`,
            cursor:         'pointer',
            background:     'rgba(168,85,247,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width:      6, height: 6, borderRadius: '50%',
              background: headerColor,
              boxShadow:  `0 0 6px ${headerColor}`,
              flexShrink: 0,
              animation:  criticalCount > 0 ? 'delete-warning-pulse 0.7s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: 8, color: 'rgba(168,85,247,0.6)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              NEXUS STATUS
            </span>
          </div>
          <span style={{ fontSize: 8, color: 'rgba(168,85,247,0.35)' }}>
            {minimized ? '▲' : '▼'}
          </span>
        </div>

        {/* Service rows */}
        {!minimized && (
          <div style={{ padding: '6px 0 4px' }}>
            {services.map(svc => {
              const cfg = STATUS_CFG[svc.status];
              const pulse = svc.status === 'offline' || svc.status === 'compromised';
              return (
                <div key={svc.id} style={{
                  display:    'flex',
                  alignItems: 'center',
                  padding:    '4px 10px',
                  gap:        6,
                  transition: 'background 300ms',
                  background: pulse ? `rgba(239,68,68,0.03)` : 'transparent',
                }}>
                  {/* Status dot */}
                  <span style={{
                    fontSize:  9,
                    color:     cfg.color,
                    textShadow:`0 0 6px ${cfg.color}`,
                    animation:  pulse ? 'delete-warning-pulse 0.8s ease-in-out infinite' : 'none',
                    width:     10,
                    flexShrink: 0,
                  }}>
                    {cfg.symbol}
                  </span>

                  {/* Name */}
                  <span style={{ fontSize: 8, color: 'rgba(200,200,220,0.55)', letterSpacing: '0.12em', flex: 1 }}>
                    {svc.name}
                  </span>

                  {/* Status label */}
                  <span style={{
                    fontSize:    7,
                    fontWeight:  'bold',
                    color:       cfg.color,
                    letterSpacing:'0.1em',
                    minWidth:    64,
                    textAlign:   'right',
                    textShadow:  pulse ? `0 0 8px ${cfg.color}` : 'none',
                    animation:   pulse ? 'delete-warning-pulse 0.8s ease-in-out infinite' : 'none',
                  }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}

            {/* Uptime bars row */}
            <div style={{
              padding:    '5px 10px 2px',
              borderTop:  '1px solid rgba(168,85,247,0.07)',
              display:    'flex',
              gap:        3,
              alignItems: 'flex-end',
            }}>
              {services.map(svc => {
                const cfg = STATUS_CFG[svc.status];
                return (
                  <div key={svc.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ display: 'flex', gap: 1 }}>
                      {svc.bars.map((up, i) => (
                        <div key={i} style={{
                          flex:         1,
                          height:       6,
                          borderRadius: 1,
                          background:   up ? `${cfg.color}70` : '#ef444470',
                          transition:   'background 400ms',
                        }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding:       '3px 10px 0',
              display:       'flex',
              justifyContent:'space-between',
            }}>
              {services.map(svc => (
                <span key={svc.id} style={{
                  fontSize: 6,
                  color:    'rgba(200,200,220,0.22)',
                  letterSpacing: '0.05em',
                  flex: 1,
                  textAlign: 'center',
                }}>
                  {svc.name.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
