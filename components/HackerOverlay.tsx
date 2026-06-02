'use client';

/**
 * HackerOverlay
 * ─────────────
 * Renders a dramatic hooded-hacker silhouette on a fixed canvas.
 * Appears randomly (own timer) AND when GlitchTextSystem dispatches
 * a 'hacker-appear' CustomEvent (cascade glitch mode).
 *
 * Visual features:
 *  • Large pointed-hood cloak drawn with bézier paths
 *  • Black face shadow with two pulsing cyan eyes
 *  • Purple neon outline glow + background aura
 *  • Horizontal scanlines through the figure
 *  • Random slice-displacement glitch frames
 *  • Floating matrix symbols rising from the figure
 *  • Full master-opacity fade-in / hold / fade-out envelope
 */

import { useEffect, useRef } from 'react';

/* ── Matrix symbols that float around the hacker ─────────────── */
const HACKER_CHARS = '01▓░▒█◆◇⌬⌭⊕⊗■□ABCDEFabcdef0x{}[]<>/\\'.split('');

interface FloatSymbol {
  x: number; y: number;
  vy: number; vx: number;
  char: string;
  life: number; decay: number;
  color: string;
}

/* ── Falling code rain effect ───────────────────────────────── */
interface CodeRain {
  x: number; y: number;
  speed: number;
  char: string;
  color: string;
}

const codeRainList: CodeRain[] = [];

function drawCodeRain(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
) {
  // Spawn new rain
  if (Math.random() < 0.35 && codeRainList.length < 120) {
    codeRainList.push({
      x:     Math.random() * vw,
      y:     -20,
      speed: 0.8 + Math.random() * 1.2,
      char:  HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)],
      color: ['rgba(6,182,212,0.5)', 'rgba(168,85,247,0.4)', 'rgba(59,130,246,0.45)'][
        Math.floor(Math.random() * 3)
      ],
    });
  }

  // Update & draw rain
  for (let i = codeRainList.length - 1; i >= 0; i--) {
    const r = codeRainList[i];
    r.y += r.speed;

    if (r.y > vh) {
      codeRainList.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = masterOpacity * 0.6;
    ctx.font        = '12px "Courier New", monospace';
    ctx.fillStyle   = r.color;
    ctx.shadowBlur  = 4;
    ctx.shadowColor = r.color;
    ctx.fillText(r.char, r.x, r.y);
    ctx.shadowBlur  = 0;
  }
  ctx.globalAlpha = 1;
}

/* ── Draw the hooded-figure silhouette ────────────────────────── */
function drawFigure(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  time:          number,
  masterOpacity: number,
  symbols:       FloatSymbol[],
) {
  const cx   = vw * 0.50;
  const cy   = vh * 0.50;
  const figH = Math.min(vh * 0.58, 430);
  const figW = figH * 0.56;

  /* top / bottom anchors */
  const top       = cy - figH * 0.53;
  const bottom    = cy + figH * 0.47;
  const shoulderY = cy - figH * 0.04;
  const cloakHW   = figW * 0.50;   // cloak half-width at bottom
  const hoodHW    = figW * 0.30;   // hood half-width at peak
  const peakY     = top;

  /* ── 1. Background aura ──────────────────────────────────────── */
  const aura = ctx.createRadialGradient(cx, cy - figH * 0.05, 0, cx, cy, figW * 1.4);
  aura.addColorStop(0,   `rgba(168,85,247,${0.14 * masterOpacity})`);
  aura.addColorStop(0.5, `rgba(168,85,247,${0.06 * masterOpacity})`);
  aura.addColorStop(1,   'rgba(168,85,247,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, figW * 1.4, 0, Math.PI * 2);
  ctx.fillStyle = aura;
  ctx.fill();

  /* ── 2. Cloak silhouette path ───────────────────────────────── */
  ctx.save();
  ctx.globalAlpha = masterOpacity;

  ctx.beginPath();

  // bottom-left
  ctx.moveTo(cx - cloakHW * 1.18, bottom);

  // left side up to shoulder
  ctx.bezierCurveTo(
    cx - cloakHW * 1.28, bottom - figH * 0.12,
    cx - cloakHW * 1.12, shoulderY + figH * 0.08,
    cx - cloakHW,        shoulderY,
  );

  // left shoulder up into hood
  ctx.bezierCurveTo(
    cx - cloakHW * 0.88, shoulderY - figH * 0.09,
    cx - hoodHW  * 1.55, peakY + figH * 0.28,
    cx - hoodHW  * 0.28, peakY,     // left of peak
  );

  // hood peak — slightly pointed
  ctx.bezierCurveTo(
    cx - hoodHW * 0.08, peakY - figH * 0.055,
    cx + hoodHW * 0.08, peakY - figH * 0.055,
    cx + hoodHW * 0.28, peakY,     // right of peak
  );

  // right hood down to shoulder (mirror)
  ctx.bezierCurveTo(
    cx + hoodHW  * 1.55, peakY + figH * 0.28,
    cx + cloakHW * 0.88, shoulderY - figH * 0.09,
    cx + cloakHW,        shoulderY,
  );

  // right side down to bottom
  ctx.bezierCurveTo(
    cx + cloakHW * 1.12, shoulderY + figH * 0.08,
    cx + cloakHW * 1.28, bottom - figH * 0.12,
    cx + cloakHW * 1.18, bottom,
  );

  ctx.closePath();

  // Fill — almost black
  ctx.fillStyle = 'rgba(1,1,7,0.95)';
  ctx.shadowBlur  = 55;
  ctx.shadowColor = 'rgba(168,85,247,0.55)';
  ctx.fill();
  ctx.shadowBlur  = 0;

  // Purple neon edge
  ctx.strokeStyle = `rgba(168,85,247,${0.72 * masterOpacity})`;
  ctx.lineWidth   = 1.8;
  ctx.shadowBlur  = 22;
  ctx.shadowColor = '#a855f7';
  ctx.stroke();
  ctx.shadowBlur  = 0;

  /* ── 3. Face shadow ellipse ─────────────────────────────────── */
  const faceTop = shoulderY - figH * 0.41;
  const faceBot = shoulderY - figH * 0.10;
  const faceCY  = (faceTop + faceBot) / 2;
  const faceRX  = figW * 0.155;
  const faceRY  = (faceBot - faceTop) / 2;

  ctx.beginPath();
  ctx.ellipse(cx, faceCY, faceRX, faceRY, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.98)';
  ctx.fill();

  /* ── 4. Pulsing cyan eyes ────────────────────────────────────── */
  const pulse    = 0.68 + 0.32 * Math.sin(time * 0.004);
  const eyeY     = faceCY - faceRY * 0.12;
  const eyeXOff  = faceRX * 0.50;

  for (const ex of [-eyeXOff, eyeXOff]) {
    const ex2 = cx + ex;

    // Soft outer halo
    const halo = ctx.createRadialGradient(ex2, eyeY, 0, ex2, eyeY, faceRX * 0.55);
    halo.addColorStop(0, `rgba(0,240,200,${0.38 * pulse})`);
    halo.addColorStop(1, 'rgba(0,240,200,0)');
    ctx.beginPath();
    ctx.arc(ex2, eyeY, faceRX * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();

    // Bright core
    const core = ctx.createRadialGradient(ex2, eyeY - 1, 0, ex2, eyeY, faceRX * 0.22);
    core.addColorStop(0,   `rgba(200,255,245,${pulse})`);
    core.addColorStop(0.35,`rgba(0,230,185,${0.9 * pulse})`);
    core.addColorStop(1,   'rgba(0,210,170,0)');
    ctx.beginPath();
    ctx.arc(ex2, eyeY, faceRX * 0.22, 0, Math.PI * 2);
    ctx.fillStyle   = core;
    ctx.shadowBlur  = 35;
    ctx.shadowColor = '#00f0c8';
    ctx.fill();
    ctx.shadowBlur  = 0;
  }

  /* ── 5. Scanlines across figure ────────────────────────────────*/
  ctx.globalAlpha = masterOpacity * 0.07;
  ctx.fillStyle   = '#000';
  for (let ly = top; ly < bottom; ly += 8) {
    ctx.fillRect(cx - cloakHW * 1.2, ly, cloakHW * 2.4, 4);
  }
  ctx.globalAlpha = masterOpacity;

  /* ── 6. Floating matrix symbols ─────────────────────────────── */
  symbols.forEach(s => {
    ctx.globalAlpha = masterOpacity * s.life * 0.8;
    ctx.font        = '11px "Courier New", monospace';
    ctx.fillStyle   = s.color;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = s.color;
    ctx.fillText(s.char, s.x, s.y);
    ctx.shadowBlur  = 0;
  });

  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ── Slice-displacement glitch frame ─────────────────────────── */
function applyGlitch(
  ctx:  CanvasRenderingContext2D,
  vw:   number,
  cx:   number,
  cy:   number,
  figH: number,
  figW: number,
) {
  if (Math.random() > 0.18) return;
  const count = 1 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const sy  = cy - figH * 0.5 + Math.random() * figH;
    const sh  = 3  + Math.random() * 14;
    const sw  = figW * 2.6;
    const sx  = cx  - sw / 2;
    if (sy < 0 || sy + sh > window.innerHeight || sx < 0 || sx + sw > vw) continue;
    try {
      const img = ctx.getImageData(sx, sy, sw, sh);
      ctx.clearRect(sx, sy, sw, sh);
      ctx.putImageData(img, sx + (Math.random() - 0.5) * 32, sy);
    } catch { /* cross-origin guard */ }
  }
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function HackerOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* Animation state */
    let animId    = 0;
    let startTime = 0;
    let running   = false;
    const TOTAL   = 5_000;     // ms total (fade-in 0.4s + hold 3.8s + fade-out 0.8s)

    const symbols: FloatSymbol[] = [];

    const spawnSymbol = (cx: number, cy: number, figW: number, figH: number) => {
      if (symbols.length > 30) return;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 0.3 + Math.random() * 0.6;
      const colors = ['rgba(168,85,247,0.9)', 'rgba(6,182,212,0.9)', 'rgba(139,92,246,0.9)'];
      symbols.push({
        x:     cx + (Math.random() - 0.5) * figW * 2.2,
        y:     cy - figH * 0.1 + (Math.random() - 0.5) * figH * 0.3,
        vx:    Math.cos(angle) * speed * 0.4,
        vy:    Math.sin(angle) * speed,
        char:  HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)],
        life:  1,
        decay: 0.008 + Math.random() * 0.008,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    const animate = (now: number) => {
      const vw  = canvas.width;
      const vh  = canvas.height;
      const figH = Math.min(vh * 0.58, 430);
      const figW = figH * 0.56;
      const cx   = vw * 0.50;
      const cy   = vh * 0.50;

      const elapsed = now - startTime;
      const t       = Math.min(elapsed / TOTAL, 1);

      /* Opacity envelope */
      let masterOpacity: number;
      if      (t < 0.08) masterOpacity = t / 0.08;
      else if (t < 0.84) masterOpacity = 1;
      else               masterOpacity = 1 - (t - 0.84) / 0.16;

      ctx.clearRect(0, 0, vw, vh);

      /* Draw constant code rain background — more intense during hacker */
      const rainIntensity = running ? 0.8 : 0.3;
      drawCodeRain(ctx, vw, vh, rainIntensity * masterOpacity);

      /* Spawn floating symbols */
      if (Math.random() < (running ? 0.45 : 0.15)) spawnSymbol(cx, cy, figW, figH);

      /* Update symbols */
      for (let i = symbols.length - 1; i >= 0; i--) {
        const s = symbols[i];
        s.x    += s.vx;
        s.y    += s.vy;
        s.life -= s.decay;
        s.char  = Math.random() < 0.08
          ? HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)]
          : s.char;
        if (s.life <= 0) symbols.splice(i, 1);
      }

      drawFigure(ctx, vw, vh, elapsed, masterOpacity, symbols);
      applyGlitch(ctx, vw, cx, cy, figH, figW);

      if (t < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        running = false;
        symbols.length = 0;
        ctx.clearRect(0, 0, vw, vh);
      }
    };

    const show = () => {
      if (running) return;   // don't interrupt current appearance
      running   = true;
      startTime = performance.now();
      symbols.length = 0;
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(animate);
    };

    /* Listen for cascade-glitch event from GlitchTextSystem */
    window.addEventListener('hacker-appear', show);

    /* Own random timer — every 25–70 s */
    let ownTimer: ReturnType<typeof setTimeout>;
    const scheduleOwn = () => {
      ownTimer = setTimeout(() => {
        show();
        scheduleOwn();
      }, 25_000 + Math.random() * 45_000);
    };
    scheduleOwn();

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(ownTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('hacker-appear', show);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        1,           // above matrix (0) but behind all UI (10+)
      }}
    />
  );
}
