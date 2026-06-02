/**
 * osEffect — OS-themed rarity reveal effect
 * ──────────────────────────────────────────
 * Replaces the heavy canvas epicEffect with DOM + CSS animations.
 *
 * Zero canvas → no rAF loop, no shadowBlur, no per-frame JS.
 * All animation runs on the CSS compositor thread.
 *
 * Visuals (scale with rarity):
 *  • Radial flash from card position
 *  • Expanding shockwave ring(s)
 *  • Horizontal glitch strips across viewport
 *  • Floating status-terminal lines drifting upward
 *  • Large center OS-breach banner
 *  • Viewport border flash (muy-valioso+)
 *  • Corner breach indicators (legendario)
 *
 * Duration: 1.8s (basico) → 2.8s (legendario)
 */

import { RarityType, RARITY_CONFIG } from '@/types';

/* ── Inject keyframes once ────────────────────────────────────────── */
let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes os-flash {
      0%   { opacity: 0; }
      8%   { opacity: 1; }
      30%  { opacity: 0.55; }
      100% { opacity: 0; }
    }
    @keyframes os-ring {
      0%   { transform: scale(1);   opacity: 0.95; }
      100% { transform: scale(6);   opacity: 0;    }
    }
    @keyframes os-strip {
      0%   { transform: translateX(0);    opacity: 0; }
      10%  { opacity: 0.85; }
      30%  { transform: translateX(-14px); }
      55%  { transform: translateX(10px); }
      80%  { transform: translateX(-3px);  opacity: 0.5; }
      100% { transform: translateX(0);    opacity: 0; }
    }
    @keyframes os-line-up {
      0%   { transform: translateX(-50%) translateY(0px);   opacity: 0; }
      12%  { opacity: 1; }
      80%  { opacity: 0.75; }
      100% { transform: translateX(-50%) translateY(-72px); opacity: 0; }
    }
    @keyframes os-banner {
      0%   { opacity:0; transform:translate(-50%,-50%) scale(.65) skewX(-6deg); filter:blur(12px); }
      14%  { opacity:1; transform:translate(-50%,-50%) scale(1.06) skewX(-1deg); filter:blur(0); }
      72%  { opacity:1; transform:translate(-50%,-50%) scale(1) skewX(0);        filter:blur(0); }
      100% { opacity:0; transform:translate(-50%,-50%) scale(.92) skewX(4deg);   filter:blur(6px); }
    }
    @keyframes os-sub-banner {
      0%   { opacity:0; transform:translate(-50%,-50%) translateY(38px); }
      20%  { opacity:0.7; }
      75%  { opacity:0.7; }
      100% { opacity:0; transform:translate(-50%,-50%) translateY(30px); }
    }
    @keyframes os-border-flash {
      0%   { opacity:0; }
      10%  { opacity:1; }
      45%  { opacity:0.6; }
      100% { opacity:0; }
    }
    @keyframes os-corner-blink {
      0%,49% { opacity:1; }
      50%,100%{ opacity:0.15; }
    }
  `;
  document.head.appendChild(style);
}

/* ── Per-rarity config ────────────────────────────────────────────── */
interface RarityConfig {
  banner:     string;
  subBanner?: string;
  lines:      string[];
  rings:      number;
  strips:     number;
  borderFlash: boolean;
  corners:    boolean;
  duration:   number;   // ms
}

const CFG: Record<RarityType, RarityConfig> = {
  basico: {
    banner:      'FILE RETRIEVED',
    lines:       ['ASSET EXTRACTED', 'CHECKSUM: OK', 'TRANSFER COMPLETE'],
    rings:       1, strips: 2,
    borderFlash: false, corners: false, duration: 1800,
  },
  medio: {
    banner:      'ACCESS GRANTED',
    lines:       ['FIREWALL BYPASSED', 'DECRYPTION: COMPLETE', 'NODE UNLOCKED', 'AUTH LEVEL: 2'],
    rings:       2, strips: 3,
    borderFlash: false, corners: false, duration: 2000,
  },
  valioso: {
    banner:      'SYSTEM PENETRATED',
    lines:       ['ROOT ACCESS OBTAINED', 'PRIVILEGE ESCALATION: OK', 'FIREWALL DOWN', 'INTEGRITY: BREACHED'],
    rings:       2, strips: 4,
    borderFlash: false, corners: false, duration: 2200,
  },
  'muy-valioso': {
    banner:      'CRITICAL BREACH',
    lines:       ['KERNEL EXPLOIT: SUCCESS', 'SYSTEM OVERRIDE ACTIVE', 'ALL DEFENSES DOWN', 'MAXIMUM ACCESS LEVEL', 'ASSET SECURED'],
    rings:       3, strips: 5,
    borderFlash: true, corners: false, duration: 2500,
  },
  legendario: {
    banner:      '⚠ NEXUS COMPROMISED ⚠',
    subBanner:   'ALL DEFENSIVE SYSTEMS ELIMINATED',
    lines:       ['CATASTROPHIC BREACH', 'ALL SYSTEMS COMPROMISED', 'NEXUS CORE: EXPOSED', 'ENCRYPTION: NULL', 'ADMIN OVERRIDE: ACTIVE', 'THREAT LEVEL: OMEGA'],
    rings:       3, strips: 6,
    borderFlash: true, corners: true, duration: 2800,
  },
};

/* ── Helpers ──────────────────────────────────────────────────────── */
function div(css: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = css;
  return el;
}

/* ── Main entry ───────────────────────────────────────────────────── */
export function triggerOsEffect(
  rarity:   RarityType,
  sourceEl?: HTMLElement | HTMLDivElement | null,
): void {
  injectStyles();

  const color = RARITY_CONFIG[rarity].color;
  const cfg   = CFG[rarity];
  const vw    = window.innerWidth;
  const vh    = window.innerHeight;

  /* Origin point — prefer result element center, fallback to 40% vh */
  const rect  = sourceEl?.getBoundingClientRect();
  const ox    = rect ? rect.left + rect.width  / 2 : vw * 0.5;
  const oy    = rect ? rect.top  + rect.height / 2 : vh * 0.4;

  /* Root container */
  const root = div('position:fixed;inset:0;pointer-events:none;z-index:8500;overflow:hidden;');
  document.body.appendChild(root);

  /* 1 ── Radial flash from origin ──────────────────────────────── */
  root.appendChild(div(`
    position:absolute; inset:0;
    background: radial-gradient(circle at ${ox}px ${oy}px,
      ${color}50 0%, ${color}20 30%, transparent 65%);
    animation: os-flash ${cfg.duration * 0.8}ms ease-out forwards;
  `));

  /* 2 ── Viewport border flash (muy-valioso+) ─────────────────── */
  if (cfg.borderFlash) {
    root.appendChild(div(`
      position:absolute; inset:0;
      border: 2px solid ${color};
      box-shadow: inset 0 0 40px ${color}40, 0 0 40px ${color}40;
      animation: os-border-flash ${cfg.duration * 0.75}ms ease-out forwards;
      border-radius: 0;
    `));
  }

  /* 3 ── Corner breach indicators (legendario) ─────────────────── */
  if (cfg.corners) {
    const corners = [
      'top:0;left:0;border-width:3px 0 0 3px;border-radius:0',
      'top:0;right:0;border-width:3px 3px 0 0;border-radius:0',
      'bottom:0;left:0;border-width:0 0 3px 3px;border-radius:0',
      'bottom:0;right:0;border-width:0 3px 3px 0;border-radius:0',
    ];
    corners.forEach(pos => {
      root.appendChild(div(`
        position:absolute; ${pos};
        width:40px; height:40px;
        border-style:solid; border-color:${color};
        box-shadow: 0 0 18px ${color};
        animation: os-corner-blink 0.35s step-end ${cfg.duration * 0.1}ms
                   ${Math.ceil(cfg.duration * 0.75 / 350)} forwards;
      `));
    });
  }

  /* 4 ── Shockwave rings ───────────────────────────────────────── */
  const RING_SIZE = 60;
  for (let i = 0; i < cfg.rings; i++) {
    const delay    = i * 160;
    const ringDur  = 700 + i * 100;
    root.appendChild(div(`
      position:absolute;
      left:${ox - RING_SIZE / 2}px; top:${oy - RING_SIZE / 2}px;
      width:${RING_SIZE}px; height:${RING_SIZE}px;
      border-radius:50%;
      border:2px solid ${color};
      box-shadow: 0 0 14px ${color}, 0 0 28px ${color}60;
      animation: os-ring ${ringDur}ms ease-out ${delay}ms forwards;
      opacity:0;
    `));
  }

  /* 5 ── Horizontal glitch strips ─────────────────────────────── */
  for (let i = 0; i < cfg.strips; i++) {
    const sy    = Math.random() * vh;
    const sh    = 2 + Math.random() * 6;
    const delay = i * 55 + Math.random() * 40;
    const dur   = 220 + Math.random() * 120;
    root.appendChild(div(`
      position:absolute;
      left:0; right:0;
      top:${sy}px; height:${sh}px;
      background:linear-gradient(90deg, transparent 0%, ${color}70 20%,
        ${color} 50%, ${color}70 80%, transparent 100%);
      box-shadow: 0 0 8px ${color}60;
      animation: os-strip ${dur}ms ease-in-out ${delay}ms forwards;
      opacity:0;
    `));
  }

  /* 6 ── Floating terminal status lines ───────────────────────── */
  cfg.lines.forEach((line, i) => {
    /* Scatter around origin */
    const lx    = ox + (Math.random() - 0.5) * Math.min(vw * 0.5, 280);
    const ly    = oy + (Math.random() - 0.5) * 90;
    const delay = i * 170 + Math.random() * 80;
    const dur   = 1100 + Math.random() * 300;
    root.appendChild(div(`
      position:absolute;
      left:${lx}px; top:${ly}px;
      transform:translateX(-50%);
      font-family:"Courier New",monospace;
      font-size:9px; font-weight:bold;
      letter-spacing:0.22em;
      text-transform:uppercase;
      white-space:nowrap;
      color:${color};
      text-shadow:0 0 10px ${color}, 0 0 20px ${color}70;
      animation:os-line-up ${dur}ms ease-out ${delay}ms forwards;
      opacity:0;
    `));
    const el = root.lastChild as HTMLDivElement;
    el.textContent = line;
  });

  /* 7 ── Center OS breach banner ───────────────────────────────── */
  const banner = div(`
    position:absolute;
    left:50%; top:50%;
    transform:translate(-50%,-50%);
    font-family:"Orbitron","Courier New",monospace;
    font-size:clamp(16px, 3.5vw, 36px);
    font-weight:900;
    letter-spacing:0.18em;
    text-transform:uppercase;
    text-align:center;
    white-space:nowrap;
    color:${color};
    text-shadow:0 0 28px ${color}, 0 0 56px ${color}60;
    animation:os-banner ${cfg.duration * 0.9}ms ease-out forwards;
    opacity:0;
  `);
  banner.textContent = cfg.banner;
  root.appendChild(banner);

  /* 7b ── Sub-banner (legendario only) ─────────────────────────── */
  if (cfg.subBanner) {
    const sub = div(`
      position:absolute;
      left:50%; top:50%;
      transform:translate(-50%,-50%) translateY(38px);
      font-family:"Courier New",monospace;
      font-size:10px; font-weight:bold;
      letter-spacing:0.3em;
      text-transform:uppercase;
      text-align:center;
      white-space:nowrap;
      color:${color};
      text-shadow:0 0 12px ${color};
      animation:os-sub-banner ${cfg.duration * 0.85}ms ease-out 0.1s forwards;
      opacity:0;
    `);
    sub.textContent = cfg.subBanner;
    root.appendChild(sub);
  }

  /* ── Cleanup ─────────────────────────────────────────────────── */
  setTimeout(() => root.remove(), cfg.duration + 200);
}
