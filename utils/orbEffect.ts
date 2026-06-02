import { RarityType, RARITY_CONFIG } from '@/types';

type RGB = [number, number, number];

const RARITY_RGB: Record<RarityType, RGB> = {
  basico:       [148, 163, 184],
  medio:        [14,  165, 233],
  valioso:      [168, 85,  247],
  'muy-valioso':[244, 63,  94 ],
  legendario:   [234, 179, 8  ],
};

/* ─── Bezier quadrática ──────────────────────────────────────────── */
function bezierPt(t: number, p0x: number, p0y: number, p1x: number, p1y: number, p2x: number, p2y: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x,
    y: mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y,
  };
}

/* ─── Ease in-out cúbico ─────────────────────────────────────────── */
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ─── Derivada del bézier → dirección del trail ─────────────────── */
function bezierDir(t: number, p0x: number, p0y: number, p1x: number, p1y: number, p2x: number, p2y: number) {
  const mt = 1 - t;
  return {
    dx: 2 * mt * (p1x - p0x) + 2 * t * (p2x - p1x),
    dy: 2 * mt * (p1y - p0y) + 2 * t * (p2y - p1y),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   LAUNCH ORB — entry point
   ═══════════════════════════════════════════════════════════════════ */
export function launchOrb(
  fromRect: DOMRect,
  toRect:   DOMRect,
  rarity:   RarityType,
  onComplete: () => void,
) {
  const color = RARITY_RGB[rarity] ?? [168, 85, 247];
  const [r, g, b] = color;
  const css       = `rgb(${r},${g},${b})`;
  const cssA      = (a: number) => `rgba(${r},${g},${b},${a})`;
  const label     = RARITY_CONFIG[rarity].label.toUpperCase();

  /* Canvas overlay */
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8888;';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  /* Source / destination centres */
  const sx = fromRect.left + fromRect.width  / 2;
  const sy = fromRect.top  + fromRect.height / 2;
  const ex = toRect.left   + toRect.width    / 2;
  const ey = toRect.top    + toRect.height   / 2;

  /* Bezier control point — arc upward, height proportional to dist */
  const dist = Math.hypot(ex - sx, ey - sy);
  const cpx  = (sx + ex) / 2 + (Math.random() - 0.5) * 60;
  const cpy  = Math.min(sy, ey) - Math.max(120, dist * 0.35);

  /* Trail buffer */
  const trail: { x: number; y: number }[] = [];
  const TRAIL_LEN = 28;

  /* Spark particles orbiting the orb */
  const SPARK_COUNT = 4;
  const sparkAngles = Array.from({ length: SPARK_COUNT }, (_, i) => (i / SPARK_COUNT) * Math.PI * 2);
  const sparkR      = Array.from({ length: SPARK_COUNT }, () => 14 + Math.random() * 6);

  const DURATION = 820;
  const t0       = performance.now();   // ← MUST match rAF timestamp (not Date.now)

  /* ── Phase 1: launch ring ─────────────────────────────────────── */
  let launchRing = 0;
  const drawLaunchRing = () => {
    if (launchRing > 50) return;
    launchRing += 4;
    const a = Math.max(0, 1 - launchRing / 50);
    ctx.beginPath();
    ctx.arc(sx, sy, launchRing, 0, Math.PI * 2);
    ctx.strokeStyle = cssA(a * 0.9);
    ctx.lineWidth   = 3;
    ctx.shadowBlur  = 16;
    ctx.shadowColor = css;
    ctx.stroke();
    ctx.shadowBlur  = 0;
  };

  /* ── Label on the orb ─────────────────────────────────────────── */
  const drawLabel = (x: number, y: number, alpha: number, t: number) => {
    if (t > 0.75 || t < 0.1) return;
    ctx.save();
    ctx.globalAlpha = alpha * (1 - (t - 0.1) / 0.65);
    ctx.font        = '700 10px "Orbitron", monospace';
    ctx.textAlign   = 'center';
    ctx.fillStyle   = cssA(0.9);
    ctx.shadowBlur  = 8;
    ctx.shadowColor = css;
    ctx.fillText(label, x, y - 22);
    ctx.restore();
  };

  /* ── Main flight loop ─────────────────────────────────────────── */
  const animate = (now: number) => {
    const elapsed = now - t0;
    const rawT    = Math.min(elapsed / DURATION, 1);
    const t       = easeInOut(rawT);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Launch ring (first 15% of flight) */
    if (rawT < 0.15) drawLaunchRing();

    const pos = bezierPt(t, sx, sy, cpx, cpy, ex, ey);

    /* --- Trail ---------------------------------------------------- */
    trail.push({ x: pos.x, y: pos.y });
    if (trail.length > TRAIL_LEN) trail.shift();

    if (trail.length > 2) {
      /* Draw trail as a tapered glowing ribbon */
      for (let i = 1; i < trail.length; i++) {
        const frac  = i / trail.length;
        const width = frac * 6;
        const alpha = frac * 0.55;

        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x,     trail[i].y);
        ctx.strokeStyle = cssA(alpha);
        ctx.lineWidth   = width;
        ctx.lineCap     = 'round';
        ctx.shadowBlur  = frac * 12;
        ctx.shadowColor = css;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      /* Energy sparks scattered along the trail */
      if (trail.length > 6 && Math.random() > 0.4) {
        const tp = trail[Math.floor(trail.length * 0.3 + Math.random() * trail.length * 0.4)];
        ctx.beginPath();
        ctx.arc(
          tp.x + (Math.random() - 0.5) * 12,
          tp.y + (Math.random() - 0.5) * 12,
          Math.random() * 3 + 1,
          0, Math.PI * 2,
        );
        ctx.fillStyle = cssA(Math.random() * 0.5);
        ctx.fill();
      }
    }

    /* --- Orbiting sparks ---------------------------------------- */
    const orbitSpeed = elapsed * 0.004;
    sparkAngles.forEach((baseA, i) => {
      const angle = baseA + orbitSpeed + (i % 2 === 0 ? 0 : Math.PI);
      const or    = sparkR[i];
      const sx2   = pos.x + Math.cos(angle) * or;
      const sy2   = pos.y + Math.sin(angle) * or;

      /* Spark streak (mini trail) */
      const prevA = angle - 0.35;
      ctx.beginPath();
      ctx.moveTo(pos.x + Math.cos(prevA) * or, pos.y + Math.sin(prevA) * or);
      ctx.lineTo(sx2, sy2);
      ctx.strokeStyle = cssA(0.55);
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx2, sy2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle   = cssA(0.85);
      ctx.shadowBlur  = 8;
      ctx.shadowColor = css;
      ctx.fill();
      ctx.shadowBlur  = 0;
    });

    /* --- Orb outer glow ----------------------------------------- */
    const glowR  = 28;
    const gGlow  = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
    gGlow.addColorStop(0.0, cssA(0.5));
    gGlow.addColorStop(0.5, cssA(0.25));
    gGlow.addColorStop(1.0, cssA(0.0));
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle  = gGlow;
    ctx.shadowBlur = 40;
    ctx.shadowColor= css;
    ctx.fill();
    ctx.shadowBlur = 0;

    /* --- Orb core ----------------------------------------------- */
    const coreG = ctx.createRadialGradient(pos.x - 2.5, pos.y - 2.5, 0, pos.x, pos.y, 10);
    coreG.addColorStop(0.0, 'rgba(255,255,255,1)');
    coreG.addColorStop(0.4, cssA(1));
    coreG.addColorStop(1.0, cssA(0.7));
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle  = coreG;
    ctx.shadowBlur = 20;
    ctx.shadowColor= css;
    ctx.fill();
    ctx.shadowBlur = 0;

    /* --- Energy ring (pulsing) ---------------------------------- */
    const pulseR = 18 + Math.sin(elapsed * 0.015) * 4;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = cssA(0.35 + Math.sin(elapsed * 0.015) * 0.15);
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    /* --- Rarity label ------------------------------------------- */
    drawLabel(pos.x, pos.y, 0.85, rawT);

    if (rawT < 1) {
      requestAnimationFrame(animate);
    } else {
      /* ── Phase 2: impact at destination ─────────────────────── */
      playImpact(ctx, canvas, pos.x, pos.y, color, () => {
        canvas.remove();
        onComplete();
      });
    }
  };

  requestAnimationFrame(animate);
}

/* ═══════════════════════════════════════════════════════════════════
   IMPACT BURST  — time-based (consistent at any frame rate)
   ═══════════════════════════════════════════════════════════════════ */
function playImpact(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number, y: number,
  color: RGB,
  onDone: () => void,
) {
  const [r, g, b] = color;
  const cssA = (a: number) => `rgba(${r},${g},${b},${Math.max(0, a)})`;

  const IMPACT_DURATION = 600;   // ms — fixed regardless of frame rate
  const impactT0 = performance.now();

  /* More sparks, wider spread */
  const sparks = Array.from({ length: 22 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 3 + Math.random() * 7;
    return {
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      decay: 0.03 + Math.random() * 0.02,
      size: 2 + Math.random() * 4,
    };
  });

  /* Expanding energy rings */
  const rings = [
    { r: 0, speed: 9,  maxR: 110, lw: 5,   white: false },
    { r: 0, speed: 13, maxR: 150, lw: 2.5, white: true  },
    { r: 0, speed: 6,  maxR: 80,  lw: 3,   white: false },
  ];

  let flashA = 0.9;

  const burst = (now: number) => {
    const elapsed = now - impactT0;
    const t = Math.min(elapsed / IMPACT_DURATION, 1);

    if (t >= 1) { onDone(); return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* ── White flash ──────────────────────────────────────────────── */
    if (flashA > 0.01) {
      const gr = ctx.createRadialGradient(x, y, 0, x, y, 55 * (1 - t * 0.5));
      gr.addColorStop(0,   `rgba(255,255,255,${flashA})`);
      gr.addColorStop(0.5, cssA(flashA * 0.7));
      gr.addColorStop(1,   cssA(0));
      ctx.beginPath();
      ctx.arc(x, y, 55 * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
      flashA *= 0.68;
    }

    /* ── Expanding shockwave rings ────────────────────────────────── */
    rings.forEach((ring, i) => {
      if (elapsed < i * 80) return;   // stagger ring launches
      ring.r = Math.min(ring.r + ring.speed, ring.maxR);
      const alpha = Math.max(0, 1 - ring.r / ring.maxR);
      ctx.beginPath();
      ctx.arc(x, y, ring.r, 0, Math.PI * 2);
      if (ring.white) {
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.6})`;
      } else {
        ctx.strokeStyle = cssA(alpha * 0.95);
        ctx.shadowBlur  = 22;
        ctx.shadowColor = `rgb(${r},${g},${b})`;
      }
      ctx.lineWidth = ring.lw;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    /* ── Sparks with gravity ──────────────────────────────────────── */
    sparks.forEach(s => {
      s.x   += s.vx;
      s.y   += s.vy;
      s.vy  += 0.15;           // gravity
      s.vx  *= 0.98;           // drag
      s.life = Math.max(0, s.life - s.decay);
      if (s.life <= 0) return;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fillStyle   = cssA(s.life * 0.95);
      ctx.shadowBlur  = 10;
      ctx.shadowColor = `rgb(${r},${g},${b})`;
      ctx.fill();
      ctx.shadowBlur  = 0;
    });

    /* ── Cross arms (first 40% of impact) ─────────────────────────── */
    if (t < 0.4) {
      const progress = 1 - t / 0.4;
      const armLen   = 28 * progress;
      ctx.shadowBlur  = 18;
      ctx.shadowColor = `rgb(${r},${g},${b})`;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * armLen, y - Math.sin(angle) * armLen);
        ctx.lineTo(x + Math.cos(angle) * armLen, y + Math.sin(angle) * armLen);
        ctx.strokeStyle = cssA(0.9 * progress);
        ctx.lineWidth   = 2.5;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(burst);
  };

  requestAnimationFrame(burst);
}
