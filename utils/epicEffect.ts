import { RarityType } from '@/types';

/* ─── Color palettes by rarity ──────────────────────────────────── */
const PALETTES: Record<RarityType, [number, number, number][]> = {
  basico:      [[148,163,184],[203,213,225],[226,232,240]],
  medio:       [[14,165,233],[56,189,248],[125,211,252],[255,255,255]],
  valioso:     [[168,85,247],[192,132,252],[216,180,254],[255,255,255]],
  'muy-valioso':[[244,63,94],[251,113,133],[253,164,175],[255,255,255],[236,72,153]],
  legendario:  [[234,179,8],[250,204,21],[253,224,71],[255,255,255],[245,158,11],[251,191,36]],
};

/* ─── Types ──────────────────────────────────────────────────────── */
type RGB = [number, number, number];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; decay: number;
  size: number; color: RGB;
  shape: 'circle' | 'star' | 'diamond' | 'spark';
  glow: boolean;
  trail: { x: number; y: number }[];
}

interface Shockwave {
  x: number; y: number;
  radius: number; maxRadius: number;
  opacity: number; color: RGB;
  lineWidth: number; speed: number;
}

interface LightningBolt {
  pts: { x: number; y: number }[];
  color: RGB;
  life: number;  // 0..1
  width: number;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function rgba(c: RGB, a: number) {
  return `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;
}

function rndColor(palette: RGB[]): RGB {
  return palette[Math.floor(Math.random() * palette.length)];
}

function mkParticle(cx: number, cy: number, palette: RGB[], speed: number, spread = 1): Particle {
  const angle = Math.random() * Math.PI * 2;
  const spd   = speed * (0.4 + Math.random());
  return {
    x: cx + (Math.random() - 0.5) * 30 * spread,
    y: cy + (Math.random() - 0.5) * 30 * spread,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd - Math.random() * speed * 0.5,
    life: 1,
    decay: 0.006 + Math.random() * 0.012,
    size: 2 + Math.random() * 7,
    color: rndColor(palette),
    shape: (['circle','star','diamond','spark'] as const)[Math.floor(Math.random() * 4)],
    glow: Math.random() > 0.35,
    trail: [],
  };
}

function mkLightning(cx: number, cy: number, angle: number, length: number, color: RGB, segs = 10): LightningBolt {
  const pts: { x: number; y: number }[] = [{ x: cx, y: cy }];
  let x = cx, y = cy;
  const dx = Math.cos(angle) * length / segs;
  const dy = Math.sin(angle) * length / segs;
  for (let i = 0; i < segs; i++) {
    const jitter = (length / segs) * 0.7;
    x += dx + (Math.random() - 0.5) * jitter;
    y += dy + (Math.random() - 0.5) * jitter;
    pts.push({ x, y });
  }
  return { pts, color, life: 1, width: 1 + Math.random() * 2.5 };
}

/* ─── Draw shapes ────────────────────────────────────────────────── */
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n = 5) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    i === 0 ? ctx.moveTo(x + rad * Math.cos(a), y + rad * Math.sin(a))
             : ctx.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
  }
  ctx.closePath();
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x,     y - r);
  ctx.lineTo(x + r * 0.55, y);
  ctx.lineTo(x,     y + r);
  ctx.lineTo(x - r * 0.55, y);
  ctx.closePath();
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6);
  }
}

/* ─── Main export ────────────────────────────────────────────────── */
export function triggerEpicEffect(rarity: RarityType) {
  if (rarity === 'basico') return;

  const palette = PALETTES[rarity];

  /* Config by rarity tier */
  const cfg = {
    medio:        { pCount: 60,  pSpeed: 5,  waves: 1, boltCount: 0,  flash: false, flashColor: palette[0], dur: 2800 },
    valioso:      { pCount: 120, pSpeed: 8,  waves: 1, boltCount: 6,  flash: false, flashColor: palette[0], dur: 3500 },
    'muy-valioso':{ pCount: 180, pSpeed: 10, waves: 2, boltCount: 10, flash: true,  flashColor: palette[0] as RGB, dur: 4500 },
    legendario:   { pCount: 300, pSpeed: 14, waves: 3, boltCount: 16, flash: true,  flashColor: palette[0] as RGB, dur: 6500 },
  }[rarity] ?? { pCount: 30, pSpeed: 4, waves: 0, boltCount: 0, flash: false, flashColor: [148,163,184] as RGB, dur: 1800 };

  /* Canvas setup */
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  /* ── Particles ────────────────────────────────────────────────── */
  const particles: Particle[] = Array.from({ length: cfg.pCount }, () =>
    mkParticle(cx, cy, palette, cfg.pSpeed)
  );

  /* ── Shockwaves ───────────────────────────────────────────────── */
  const shockwaves: Shockwave[] = Array.from({ length: cfg.waves }, (_, i) => ({
    x: cx, y: cy,
    radius: 0,
    maxRadius: 220 + i * 140,
    opacity: 0.9,
    color: palette[i % palette.length] as RGB,
    lineWidth: 3.5 - i * 0.5,
    speed: 6 + i * 3,
  }));

  /* ── Lightning bolts ──────────────────────────────────────────── */
  const bolts: LightningBolt[] = Array.from({ length: cfg.boltCount }, (_, i) => {
    const angle  = (i / cfg.boltCount) * Math.PI * 2 + Math.random() * 0.4;
    const length = 160 + Math.random() * 220;
    return mkLightning(cx, cy, angle, length, rndColor(palette), 8 + Math.floor(Math.random() * 5));
  });

  /* ── Screen flash ─────────────────────────────────────────────── */
  let flashA = cfg.flash ? 0.65 : 0;
  const [fr, fg, fb] = cfg.flashColor;

  /* ── Secondary ring burst (legendary only) ────────────────────── */
  const extraRings: { r: number; maxR: number; op: number }[] = rarity === 'legendario'
    ? [0.3, 0.6, 0.9].map(delay => ({ r: 0, maxR: canvas.width * 0.7, op: 0, _delay: delay } as any))
    : [];

  const t0 = Date.now();

  /* ── Animate ──────────────────────────────────────────────────── */
  const animate = () => {
    const elapsed = Date.now() - t0;
    const progress = elapsed / cfg.dur;

    if (elapsed > cfg.dur) { canvas.remove(); return; }
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Screen flash */
    if (flashA > 0.001) {
      ctx.fillStyle = `rgba(${fr},${fg},${fb},${flashA})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flashA *= 0.88;
    }

    /* Edge glow (legendary) */
    if (rarity === 'legendario' && progress < 0.5) {
      const edgeA = (1 - progress / 0.5) * 0.35;
      const grad = ctx.createRadialGradient(cx, cy, canvas.width * 0.3, cx, cy, canvas.width * 0.75);
      grad.addColorStop(0, 'rgba(234,179,8,0)');
      grad.addColorStop(1, `rgba(234,179,8,${edgeA})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /* Shockwaves */
    shockwaves.forEach(sw => {
      if (sw.radius >= sw.maxRadius) return;
      sw.radius += sw.speed;
      sw.opacity = Math.max(0, (1 - sw.radius / sw.maxRadius) ** 0.7);

      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(sw.color, sw.opacity * 0.85);
      ctx.lineWidth   = sw.lineWidth;
      ctx.shadowBlur  = 28;
      ctx.shadowColor = rgba(sw.color, 0.8);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    /* Extra rings (legendary) */
    extraRings.forEach((ring: any) => {
      if (elapsed < ring._delay * 1000) return;
      ring.r  += 9;
      ring.op  = Math.max(0, 1 - ring.r / ring.maxR);
      if (ring.r > ring.maxR) return;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(palette[0] as RGB, ring.op * 0.5);
      ctx.lineWidth   = 1.5;
      ctx.shadowBlur  = 20;
      ctx.shadowColor = rgba(palette[0] as RGB, 0.6);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    /* Lightning bolts */
    const boltFade = Math.max(0, 1 - elapsed / 900);
    if (boltFade > 0.01) {
      bolts.forEach(bolt => {
        if (bolt.pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(bolt.pts[0].x, bolt.pts[0].y);
        bolt.pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = rgba(bolt.color, boltFade * 0.9);
        ctx.lineWidth   = bolt.width;
        ctx.shadowBlur  = 18;
        ctx.shadowColor = rgba(bolt.color, 0.9);
        ctx.stroke();

        /* Secondary thinner bolt */
        ctx.strokeStyle = rgba([255,255,255] as RGB, boltFade * 0.7);
        ctx.lineWidth   = bolt.width * 0.4;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      });
    }

    /* Particles */
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      /* Save trail point every N steps */
      if (p.trail.length === 0 || Math.hypot(p.x - p.trail[p.trail.length - 1].x, p.y - p.trail[p.trail.length - 1].y) > 3) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 6) p.trail.shift();
      }

      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.07;   // gravity
      p.vx *= 0.985;  // drag

      /* Draw trail */
      if (p.trail.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        p.trail.forEach(tp => ctx.lineTo(tp.x, tp.y));
        ctx.strokeStyle = rgba(p.color, p.life * 0.3);
        ctx.lineWidth   = p.size * 0.4;
        ctx.stroke();
      }

      /* Draw particle */
      ctx.globalAlpha = p.life;
      if (p.glow) { ctx.shadowBlur = 12; ctx.shadowColor = rgba(p.color, 0.9); }
      ctx.fillStyle = rgba(p.color, 1);

      ctx.beginPath();
      if (p.shape === 'star')    { drawStar(ctx, p.x, p.y, p.size); ctx.fill(); }
      else if (p.shape === 'diamond') { drawDiamond(ctx, p.x, p.y, p.size); ctx.fill(); }
      else if (p.shape === 'spark')   { drawSpark(ctx, p.x, p.y, p.size); ctx.strokeStyle = rgba(p.color, p.life); ctx.lineWidth = 1.5; ctx.stroke(); }
      else                       { ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }

      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }
  };

  animate();
}
