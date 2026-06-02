import { RarityType } from '@/types';

type RGB = [number, number, number];

const RARITY_RGB: Record<RarityType, RGB> = {
  basico:        [148, 163, 184],
  medio:         [14,  165, 233],
  valioso:       [168, 85,  247],
  'muy-valioso': [244, 63,  94 ],
  legendario:    [234, 179, 8  ],
};

/* ─── Recursive midpoint displacement ─────────────────────────────── */
function zigzag(
  x1: number, y1: number,
  x2: number, y2: number,
  roughness: number,
  depth: number,
): [number, number][] {
  if (depth === 0) return [[x1, y1], [x2, y2]];

  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1.5) return [[x1, y1], [x2, y2]];

  const mx  = (x1 + x2) / 2;
  const my  = (y1 + y2) / 2;
  const nx  = -(y2 - y1) / len;
  const ny  =  (x2 - x1) / len;
  const d   = (Math.random() - 0.5) * roughness * len;

  const left  = zigzag(x1,       y1,       mx + nx * d, my + ny * d, roughness * 0.62, depth - 1);
  const right = zigzag(mx + nx * d, my + ny * d, x2, y2, roughness * 0.62, depth - 1);
  return [...left, ...right.slice(1)];
}

/* ─── Stroke a poly-line ───────────────────────────────────────────── */
function strokePoly(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  lw: number,
  blur: number,
  blurColor: string,
  alpha: number,
) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  if (blur > 0) { ctx.shadowBlur = blur; ctx.shadowColor = blurColor; }
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════
   LAUNCH LIGHTNING — single bolt, used for each card in a sequence
   ═══════════════════════════════════════════════════════════════════ */
export function launchLightning(
  fromRect: DOMRect,
  toRect:   DOMRect,
  rarity:   RarityType,
  onComplete: () => void,
): void {
  const [r, g, b] = RARITY_RGB[rarity] ?? [168, 85, 247];
  const css  = `rgb(${r},${g},${b})`;
  const cssA = (a: number) => `rgba(${r},${g},${b},${Math.max(0, a)})`;

  /* Canvas overlay — z-index between orb (8888) and modal (9500) */
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8889;';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  /* Source = button center, destination = card center */
  const sx = fromRect.left + fromRect.width  / 2;
  const sy = fromRect.top  + fromRect.height / 2;
  const ex = toRect.left   + toRect.width    / 2;
  const ey = toRect.top    + toRect.height   / 2;

  const FLIGHT   = 260;   // ms for bolt to travel from source to dest
  const t0       = performance.now();
  let   done     = false;

  const animate = (now: number) => {
    const elapsed = now - t0;
    const rawT    = Math.min(elapsed / FLIGHT, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Bolt grows from source → destination over FLIGHT ms */
    const px = sx + (ex - sx) * rawT;
    const py = sy + (ey - sy) * rawT;

    /* Flicker: fast sinusoidal brightness variation */
    const flicker = 0.55 + 0.45 * Math.abs(Math.sin(elapsed * 0.21));

    /* ── Main bolt ─────────────────────────────────────────────── */
    const bolt = zigzag(sx, sy, px, py, 0.42, 5);

    strokePoly(ctx, bolt, css,                     8, 32, css, 0.28 * flicker);  // outer glow
    strokePoly(ctx, bolt, css,                     3.5, 14, css, 0.6 * flicker); // mid glow
    strokePoly(ctx, bolt, 'rgba(255,255,255,0.95)', 1.3, 0, '',  flicker);        // white core

    /* ── Side branches (appear after bolt is 35% of the way) ──── */
    if (rawT > 0.35) {
      const defs = [
        { tAlong: 0.35, side:  1, lenMult: 1.0, roughness: 0.55 },
        { tAlong: 0.55, side: -1, lenMult: 0.75, roughness: 0.6 },
        { tAlong: 0.72, side:  1, lenMult: 0.5,  roughness: 0.65 },
      ];
      const mainAngle = Math.atan2(ey - sy, ex - sx);

      defs.forEach(def => {
        if (rawT < def.tAlong) return;
        const bIdx = Math.floor(def.tAlong * bolt.length);
        const [bx, by] = bolt[bIdx] ?? [px, py];
        const bAngle   = mainAngle + def.side * (0.55 + Math.random() * 0.3);
        const bLen     = (28 + Math.random() * 28) * def.lenMult;
        const bPts     = zigzag(bx, by, bx + Math.cos(bAngle) * bLen, by + Math.sin(bAngle) * bLen, def.roughness, 3);

        strokePoly(ctx, bPts, css,                     2.5, 10, css, 0.20 * flicker);
        strokePoly(ctx, bPts, 'rgba(255,255,255,0.85)', 0.8, 0,  '',  0.65 * flicker);
      });
    }

    /* ── Source glow (pulsing orb at button) ────────────────────── */
    {
      const gr  = 16 + Math.sin(elapsed * 0.13) * 4;
      const glr = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
      glr.addColorStop(0,   `rgba(255,255,255,${0.55 * flicker})`);
      glr.addColorStop(0.4, cssA(0.38 * flicker));
      glr.addColorStop(1,   cssA(0));
      ctx.beginPath();
      ctx.arc(sx, sy, gr, 0, Math.PI * 2);
      ctx.fillStyle = glr;
      ctx.fill();
    }

    /* ── Tip glow (grows as bolt approaches destination) ──────────── */
    if (rawT > 0.08) {
      const tipR = 5 + rawT * 14;
      ctx.beginPath();
      ctx.arc(px, py, tipR, 0, Math.PI * 2);
      ctx.fillStyle   = cssA(0.45 * rawT * flicker);
      ctx.shadowBlur  = 22;
      ctx.shadowColor = css;
      ctx.fill();
      ctx.shadowBlur  = 0;
    }

    if (rawT < 1) {
      requestAnimationFrame(animate);
    } else if (!done) {
      done = true;
      playImpact(ctx, canvas, ex, ey, [r, g, b], () => {
        canvas.remove();
        onComplete();
      });
    }
  };

  requestAnimationFrame(animate);
}

/* ═══════════════════════════════════════════════════════════════════
   IMPACT — quick electric burst at the card position
   ═══════════════════════════════════════════════════════════════════ */
function playImpact(
  ctx:    CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x:      number,
  y:      number,
  color:  RGB,
  onDone: () => void,
) {
  const [r, g, b] = color;
  const css  = `rgb(${r},${g},${b})`;
  const cssA = (a: number) => `rgba(${r},${g},${b},${Math.max(0, a)})`;

  const DURATION = 200;   // ms — quick flash, not the full orb-style impact
  const t0 = performance.now();

  let ring = 0;
  const sparks = Array.from({ length: 12 }, () => {
    const ang = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 5;
    return { x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 1 };
  });

  const burst = (now: number) => {
    const elapsed = now - t0;
    const t = Math.min(elapsed / DURATION, 1);
    if (t >= 1) { onDone(); return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* White flash */
    const flashA = Math.max(0, 1 - t * 5);
    if (flashA > 0.01) {
      const gr = ctx.createRadialGradient(x, y, 0, x, y, 40);
      gr.addColorStop(0,   `rgba(255,255,255,${flashA})`);
      gr.addColorStop(0.4, cssA(flashA * 0.75));
      gr.addColorStop(1,   cssA(0));
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
    }

    /* Ring */
    ring = Math.min(ring + 10, 95);
    const a1 = Math.max(0, 1 - ring / 95);
    ctx.beginPath();
    ctx.arc(x, y, ring, 0, Math.PI * 2);
    ctx.strokeStyle = cssA(a1 * 0.9);
    ctx.lineWidth   = 3.5;
    ctx.shadowBlur  = 18;
    ctx.shadowColor = css;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    /* Sparks */
    sparks.forEach(s => {
      s.x += s.vx; s.y += s.vy; s.vy += 0.14; s.life -= 0.07;
      if (s.life <= 0) return;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.5 * s.life, 0, Math.PI * 2);
      ctx.fillStyle   = cssA(s.life * 0.9);
      ctx.shadowBlur  = 8;
      ctx.shadowColor = css;
      ctx.fill();
      ctx.shadowBlur  = 0;
    });

    requestAnimationFrame(burst);
  };

  requestAnimationFrame(burst);
}
