'use client';

import { BoxItem, RarityType, RARITY_CONFIG } from '@/types';
import Image from 'next/image';
import { useRef, useState } from 'react';

type ScanState = 'idle' | 'scanning' | 'secure' | 'vuln';

const VULN_IDS = ['CVE-2024-3882','CVE-2024-1971','CVE-2023-44487','CVE-2024-6387'];


interface BoxCardProps {
  item: BoxItem;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
  isResult?: boolean;
}

const RARITY_VISUAL: Record<RarityType, {
  bg: string; shimmer: boolean; legendaryPulse: boolean; icon: string; tier: number;
}> = {
  'basico':      { bg: 'linear-gradient(145deg,#111026 0%,#0b0920 100%)', shimmer: false, legendaryPulse: false, icon: '○', tier: 1 },
  'medio':       { bg: 'linear-gradient(145deg,#080e22 0%,#050b18 100%)', shimmer: false, legendaryPulse: false, icon: '◇', tier: 2 },
  'valioso':     { bg: 'linear-gradient(145deg,#130820 0%,#0c0518 100%)', shimmer: true,  legendaryPulse: false, icon: '◆', tier: 3 },
  'muy-valioso': { bg: 'linear-gradient(145deg,#200810 0%,#140508 100%)', shimmer: true,  legendaryPulse: false, icon: '★', tier: 4 },
  'legendario':  { bg: 'linear-gradient(145deg,#1c1100 0%,#120b00 100%)', shimmer: true,  legendaryPulse: true,  icon: '⬡', tier: 5 },
};

export default function BoxCard({ item, onDelete, showDelete = false, isResult = false }: BoxCardProps) {
  const conf    = RARITY_CONFIG[item.rarity];
  const visual  = RARITY_VISUAL[item.rarity];
  const isImage = item.identifierType === 'imagen' && item.imageUrl;
  const cardRef = useRef<HTMLDivElement>(null);

  /* ── Scan overlay state ────────────────────────────────────────── */
  const [scan, setScan]       = useState<ScanState>('idle');
  const scanTimers            = useRef<ReturnType<typeof setTimeout>[]>([]);
  const vulnId                = useRef(VULN_IDS[Math.floor(Math.random() * VULN_IDS.length)]);


  const onMouseEnter = () => {
    if (scan !== 'idle' || isResult || Math.random() > 0.28) return;
    setScan('scanning');
    const t1 = setTimeout(() => {
      const isVuln = Math.random() < 0.18;
      if (isVuln) vulnId.current = VULN_IDS[Math.floor(Math.random() * VULN_IDS.length)];
      setScan(isVuln ? 'vuln' : 'secure');
      const t2 = setTimeout(() => setScan('idle'), 1300);
      scanTimers.current.push(t2);
    }, 950);
    scanTimers.current.push(t1);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current;
    if (!r) return;
    const rect = r.getBoundingClientRect();
    r.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    r.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };
  const onMouseLeave = () => {
    cardRef.current?.style.setProperty('--mx', '50%');
    cardRef.current?.style.setProperty('--my', '50%');
  };

  const cornerStyle = (extra: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute', width: 10, height: 10, pointerEvents: 'none', zIndex: 20,
    borderColor: isResult ? conf.color : `${conf.color}70`,
    borderStyle: 'solid', ...extra,
  });

  return (
    <div
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={[
        'relative rounded-xl overflow-hidden cursor-pointer select-none',
        'transition-all duration-300 group',
        isResult
          ? `animate-result-float ${visual.legendaryPulse ? 'border-pulse-gold' : ''}`
          : 'hover:-translate-y-1.5 hover:scale-[1.03]',
      ].join(' ')}
      style={{
        background: visual.bg,
        border: `1px solid ${isResult ? conf.color : `${conf.color}28`}`,
        boxShadow: isResult
          ? `0 0 28px ${conf.color}70, 0 0 56px ${conf.color}22, inset 0 0 20px ${conf.color}0a`
          : `0 4px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {/* ── Node scan overlay ──────────────────────────────────── */}
      {scan !== 'idle' && (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-xl">
          {/* Scan sweep line */}
          {scan === 'scanning' && (
            <div className="node-scan-line" style={{
              position:   'absolute',
              left: 0, right: 0,
              height:     2,
              background: `linear-gradient(90deg, transparent, ${conf.color}, white, ${conf.color}, transparent)`,
              boxShadow:  `0 0 10px ${conf.color}, 0 0 20px ${conf.color}60`,
            }} />
          )}
          {/* SCANNING label */}
          {scan === 'scanning' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.30)',
            }}>
              <span style={{
                fontFamily:    '"Courier New",monospace',
                fontSize:      9,
                fontWeight:    'bold',
                letterSpacing: '0.3em',
                color:         conf.color,
                textShadow:    `0 0 12px ${conf.color}`,
                textTransform: 'uppercase',
                animation:     'delete-warning-pulse 0.6s ease-in-out infinite',
              }}>
                SCANNING NODE…
              </span>
            </div>
          )}
          {/* Result overlay */}
          {(scan === 'secure' || scan === 'vuln') && (
            <div style={{
              position:   'absolute', inset: 0,
              display:    'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              background: scan === 'vuln' ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.10)',
              border:     `1px solid ${scan === 'vuln' ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.4)'}`,
              borderRadius: 12,
            }}>
              <span style={{
                fontFamily:    '"Courier New",monospace',
                fontSize:      10,
                fontWeight:    'bold',
                letterSpacing: '0.25em',
                color:         scan === 'vuln' ? '#f87171' : '#4ade80',
                textShadow:    `0 0 14px ${scan === 'vuln' ? '#ef4444' : '#22c55e'}`,
                textTransform: 'uppercase',
              }}>
                {scan === 'vuln' ? '⚠ VULN FOUND' : '✓ NODE SECURED'}
              </span>
              {scan === 'vuln' && (
                <span style={{
                  fontFamily:    '"Courier New",monospace',
                  fontSize:      8,
                  color:         'rgba(248,113,113,0.7)',
                  letterSpacing: '0.15em',
                }}>
                  {vulnId.current}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* HUD corners */}
      <span style={cornerStyle({ top: -1, left: -1,  borderWidth: '1.5px 0 0 1.5px', borderRadius: '3px 0 0 0' })} />
      <span style={cornerStyle({ top: -1, right: -1, borderWidth: '1.5px 1.5px 0 0', borderRadius: '0 3px 0 0' })} />
      <span style={cornerStyle({ bottom: -1, left: -1,  borderWidth: '0 0 1.5px 1.5px', borderRadius: '0 0 0 3px' })} />
      <span style={cornerStyle({ bottom: -1, right: -1, borderWidth: '0 1.5px 1.5px 0', borderRadius: '0 0 3px 0' })} />

      {/* Mouse spotlight */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{ background: `radial-gradient(circle 80px at var(--mx,50%) var(--my,50%), ${conf.color}18, transparent 70%)` }} />

      {/* Holographic sweep */}
      {visual.shimmer && <div className="card-holo-sweep z-10" />}

      {/* Top accent bar */}
      <div className="absolute top-0 inset-x-0 h-[2px] bar-shimmer z-20"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${conf.color}90 20%, ${conf.color} 50%, ${conf.color}90 80%, transparent 100%)` }} />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-10 pointer-events-none z-0"
        style={{ background: `linear-gradient(to top, ${conf.color}15, transparent)` }} />

      {/* Rarity badge */}
      <div className="absolute top-2 left-2 z-20">
        <span className="text-[7px] font-black uppercase tracking-[0.18em] px-1.5 py-[3px] rounded font-mono"
          style={{ color: conf.color, backgroundColor: `${conf.color}18`, border: `1px solid ${conf.color}30` }}>
          {conf.label}
        </span>
      </div>

      {/* Delete */}
      {showDelete && onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(item.id); }}
          className="absolute top-2 right-2 p-[5px] rounded-lg opacity-0 group-hover:opacity-100 transition-all z-30 hover:scale-110"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}>
          <span className="material-icons-outlined" style={{ fontSize: '13px' }}>delete</span>
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-3 pt-8 pb-3 min-h-[130px]">
        {isImage ? (
          <div className="relative w-14 h-14 mb-2">
            <div className="absolute inset-0 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity scale-125"
              style={{ backgroundColor: conf.color }} />
            <Image src={item.imageUrl!} alt={item.identifier} fill className="object-contain relative z-10 drop-shadow-lg" />
          </div>
        ) : (
          <div className="relative mb-1 flex items-center justify-center">
            <div className="absolute blur-2xl opacity-12 group-hover:opacity-30 transition-opacity scale-[2.5]"
              style={{ width: 36, height: 36, backgroundColor: conf.color }} />
            <span className="relative font-display font-black leading-none group-hover:scale-110 transition-transform duration-300 block"
              style={{
                fontSize: item.identifier.length > 3 ? '1.6rem' : '2.4rem',
                color: conf.color,
                textShadow: `0 0 16px ${conf.color}90, 0 0 32px ${conf.color}35`,
              }}>
              {item.identifier}
            </span>
          </div>
        )}

        {/* Tier dots */}
        <div className="flex gap-[3px] mt-2 mb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i < visual.tier ? conf.color : `${conf.color}20`,
                boxShadow: i < visual.tier ? `0 0 4px ${conf.color}80` : 'none',
              }} />
          ))}
        </div>

        {/* Probability */}
        <div className="flex items-center gap-1.5 mt-1 w-full justify-center">
          <div className="flex-1 h-px max-w-[20px]" style={{ background: `linear-gradient(to right, transparent, ${conf.color}50)` }} />
          <span className="text-[9px] font-black tracking-widest font-mono" style={{ color: `${conf.color}80` }}>
            {item.percentage}%
          </span>
          <div className="flex-1 h-px max-w-[20px]" style={{ background: `linear-gradient(to left, transparent, ${conf.color}50)` }} />
        </div>

        {/* Corner glyph */}
        <span className="absolute bottom-2 right-2 text-[9px] opacity-15 group-hover:opacity-40 transition-opacity font-mono"
          style={{ color: conf.color }}>{visual.icon}</span>
      </div>

      {/* Result extra info */}
      {isResult && (
        <div className="relative z-10 px-3 pb-3">
          <div className="border-t pt-2 text-center" style={{ borderColor: `${conf.color}25` }}>
            <div className="text-[9px] text-gray-600 uppercase tracking-[0.18em] mb-0.5 font-mono">Probabilidad</div>
            <div className="font-black text-sm font-display" style={{ color: conf.color }}>{item.percentage}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
