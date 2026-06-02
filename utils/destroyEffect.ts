import { RarityType } from '@/types';

type RGB = [number, number, number];

const RARITY_RGB: Record<RarityType, RGB> = {
  basico:        [148, 163, 184],
  medio:         [14,  165, 233],
  valioso:       [168, 85,  247],
  'muy-valioso': [244, 63,  94 ],
  legendario:    [234, 179, 8  ],
};

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; decay: number;
  size: number;
  shape: 'circle' | 'square';
  rot: number; rotSpeed: number;
}

export function triggerDestruction(rect: DOMRect, rarity: RarityType): void {
  const [r, g, b] = RARITY_RGB[rarity] ?? [239, 68, 68];
  const css       = `rgb(${r},${g},${b})`;
  const cssA      = (a: number) => `rgba(${r},${g},${b},${Math.max(0, a)})`;

  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const hw = Math.max(rect.width  / 2, 30);
  const hh = Math.max(rect.height / 2, 30);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9100;';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  /* ── Particles ──────────────────────────────────────────────────── */
  const particles: Particle[] = [
    /* Core burst from card interior */
    ...Array.from({ length: 38 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 1.5 + Math.random() * 9;
      return {
        x: cx + (Math.random() - 0.5) * hw * 1.4,
        y: cy + (Math.random() - 0.5) * hh * 1.4,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.8,
        life: 1,
        decay: 0.016 + Math.random() * 0.018,
        size: 2.5 + Math.random() * 5.5,
        shape: (Math.random() > 0.45 ? 'square' : 'circle') as 'circle' | 'square',
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.18,
      };
    }),
    /* Edge sparks — launch from card perimeter */
    ...Array.from({ length: 28 }, (_, i) => {
      const edge   = i % 4;
      const margin = Math.random();
      let x = cx, y = cy;
      if (edge === 0) { x = rect.left  + margin * rect.width;  y = rect.top;    }
      if (edge === 1) { x = rect.right;                         y = rect.top  + margin * rect.height; }
      if (edge === 2) { x = rect.left  + margin * rect.width;  y = rect.bottom; }
      if (edge === 3) { x = rect.left;                          y = rect.top  + margin * rect.height; }
      const angle = Math.atan2(y - cy, x - cx);
      const spd   = 4 + Math.random() * 7;
      return {
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 0.5,
        life: 1,
        decay: 0.022 + Math.random() * 0.022,
        size: 1.5 + Math.random() * 3.5,
        shape: 'circle' as const,
        rot: 0, rotSpeed: 0,
      };
    }),
  ];

  /* ── Shockwave rings ────────────────────────────────────────────── */
  const rings = [
    { r: 0, speed: 11, maxR: 140, lw: 5,   white: false, delay: 0   },
    { r: 0, speed: 16, maxR: 200, lw: 2,   white: true,  delay: 70  },
    { r: 0, speed:  7, maxR:  95, lw: 3,   white: false, delay: 150 },
  ];

  const DURATION = 1050;
  const t0 = performance.now();
  let flashA = 1;

  const animate = (now: number) => {
    const elapsed = now - t0;
    const t = Math.min(elapsed / DURATION, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* ── Radial flash ───────────────────────────────────────────── */
    if (flashA > 0.01) {
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 65);
      gr.addColorStop(0,   `rgba(255,255,255,${flashA})`);
      gr.addColorStop(0.35, cssA(flashA * 0.85));
      gr.addColorStop(1,   cssA(0));
      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
      flashA *= 0.60;
    }

    /* ── Shockwaves ─────────────────────────────────────────────── */
    rings.forEach(ring => {
      if (elapsed < ring.delay) return;
      ring.r = Math.min(ring.r + ring.speed, ring.maxR);
      const alpha = Math.max(0, 1 - ring.r / ring.maxR);
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      if (ring.white) {
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
        ctx.lineWidth   = ring.lw;
      } else {
        ctx.strokeStyle = cssA(alpha * 0.92);
        ctx.lineWidth   = ring.lw;
        ctx.shadowBlur  = 24;
        ctx.shadowColor = css;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    /* ── Particles ──────────────────────────────────────────────── */
    particles.forEach(p => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += 0.19;      // gravity
      p.vx  *= 0.974;     // air drag
      p.rot += p.rotSpeed;
      p.life = Math.max(0, p.life - p.decay);
      if (p.life <= 0) return;

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.shadowBlur  = 9;
      ctx.shadowColor = css;

      if (p.shape === 'square') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = cssA(0.9);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = cssA(0.95);
        ctx.fill();
      }
      ctx.restore();
    });

    /* ── Cross burst at center (first 30%) ──────────────────────── */
    if (t < 0.3) {
      const prog   = 1 - t / 0.3;
      const armLen = 38 * prog;
      ctx.shadowBlur  = 22;
      ctx.shadowColor = css;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(angle) * armLen, cy - Math.sin(angle) * armLen);
        ctx.lineTo(cx + Math.cos(angle) * armLen, cy + Math.sin(angle) * armLen);
        ctx.strokeStyle = cssA(0.9 * prog);
        ctx.lineWidth   = 3;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(animate);
}
