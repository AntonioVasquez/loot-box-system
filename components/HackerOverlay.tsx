'use client';

/**
 * HackerOverlay
 * ─────────────
 * Renders a dramatic hacker silhouette image with epic effects.
 * Appears randomly (own timer) AND when GlitchTextSystem dispatches
 * a 'hacker-appear' CustomEvent (cascade glitch mode).
 *
 * Visual features:
 *  • High-quality PNG hacker image as background
 *  • Animated code rain with cyan/purple glow
 *  • Scanline overlay with neon glow
 *  • Glitch effect with glow pulses
 *  • Full master-opacity fade-in / hold / fade-out envelope
 */

import { useEffect, useRef, useState } from 'react';

/* ── Matrix symbols that fall around the hacker ──────────────── */
const HACKER_CHARS = '01▓░▒█◆◇⌬⌭⊕⊗■□ABCDEFabcdef0x{}[]<>/\\'.split('');

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
    ctx.shadowBlur  = 6;
    ctx.shadowColor = r.color;
    ctx.fillText(r.char, r.x, r.y);
    ctx.shadowBlur  = 0;
  }
  ctx.globalAlpha = 1;
}

/* ── Draw scanlines overlay ────────────────────────────────── */
function drawScanlines(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
) {
  ctx.globalAlpha = masterOpacity * 0.12;
  ctx.fillStyle   = '#000';
  for (let ly = 0; ly < vh; ly += 4) {
    ctx.fillRect(0, ly, vw, 2);
  }
  ctx.globalAlpha = 1;
}

/* ── Draw vertical glitch bars ────────────────────────────── */
function drawGlitchBars(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
  time:          number,
) {
  if (Math.random() > 0.15) return;
  
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const barW = 2 + Math.random() * 8;
    const barX = Math.random() * vw;
    const barH = 50 + Math.random() * 150;
    const barY = Math.random() * (vh - barH);

    const colors = [
      `rgba(6,182,212,${0.4 * masterOpacity})`,
      `rgba(168,85,247,${0.3 * masterOpacity})`,
      `rgba(59,130,246,${0.35 * masterOpacity})`,
    ];
    
    ctx.globalAlpha = masterOpacity * 0.5;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function HackerOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

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
    const TOTAL   = 6_000;     // ms total (fade-in 0.5s + hold 4.5s + fade-out 1s)

    const animate = (now: number) => {
      const vw  = canvas.width;
      const vh  = canvas.height;

      const elapsed = now - startTime;
      const t       = Math.min(elapsed / TOTAL, 1);

      /* Opacity envelope */
      let masterOpacity: number;
      if      (t < 0.08) masterOpacity = t / 0.08;
      else if (t < 0.75) masterOpacity = 1;
      else               masterOpacity = 1 - (t - 0.75) / 0.25;

      setOpacity(masterOpacity);

      ctx.clearRect(0, 0, vw, vh);

      /* Draw effects layers */
      drawCodeRain(ctx, vw, vh, masterOpacity);
      drawScanlines(ctx, vw, vh, masterOpacity);
      drawGlitchBars(ctx, vw, vh, masterOpacity, elapsed);

      if (t < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        running = false;
        codeRainList.length = 0;
        ctx.clearRect(0, 0, vw, vh);
        setIsVisible(false);
        setOpacity(0);
      }
    };

    const show = () => {
      if (running) return;   // don't interrupt current appearance
      running   = true;
      startTime = performance.now();
      codeRainList.length = 0;
      setIsVisible(true);
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(animate);
    };

    /* Listen for cascade-glitch event from GlitchTextSystem */
    window.addEventListener('hacker-appear', show);

    /* Own random timer — every 30–80 s */
    let ownTimer: ReturnType<typeof setTimeout>;
    const scheduleOwn = () => {
      ownTimer = setTimeout(() => {
        show();
        scheduleOwn();
      }, 30_000 + Math.random() * 50_000);
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
    <>
      {/* PNG Image background — behind everything */}
      {isVisible && (
        <div
          style={{
            position:      'fixed',
            inset:         0,
            pointerEvents: 'none',
            zIndex:        0,
            opacity:       opacity,
            transition:    'opacity 150ms ease-out',
            overflow:      'hidden',
            background:    'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
          }}
        >
          <img
            src="/img/hacker.png"
            alt="hacker"
            style={{
              width:     '100%',
              height:    '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter:    `brightness(1.15) contrast(1.2) drop-shadow(0 0 40px rgba(168,85,247,${opacity * 0.7})) drop-shadow(0 0 80px rgba(6,182,212,${opacity * 0.5}))`,
            }}
          />
        </div>
      )}

      {/* Canvas for effects (scanlines, code rain, glitch bars) — on top of image */}
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position:      'fixed',
          inset:         0,
          pointerEvents: 'none',
          zIndex:        1,
        }}
      />
    </>
  );
}
