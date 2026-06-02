'use client';

import { useEffect, useRef } from 'react';

type Column = {
  y: number;
  speed: number;
  color: string;
  chars: string[];   // history of drawn chars for colored trail
  trailLen: number;
};

const THEME_COLORS = [
  [168, 85, 247],   // purple
  [139, 92, 246],   // violet
  [6, 182, 212],    // cyan
  [59, 130, 246],   // blue
  [99, 102, 241],   // indigo
];

// Binary + hex + symbols — data / cyber feel
const CHAR_POOL =
  '01001101 01000001 01010100 01010010 01001001 01011000 ' +
  'ABCDEF0123456789 ▓░▒█◆◇★⬡◉⊕⊗■□▲△✦✧⬠⬡◈';

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const FONT_SIZE = 13;
    const COL_GAP  = 20;
    const chars = CHAR_POOL.replace(/ /g, '').split('');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const makeCol = (offsetY = 0): Column => {
      const ci = Math.floor(Math.random() * THEME_COLORS.length);
      return {
        y:        -(Math.random() * canvas.height) + offsetY,
        speed:    FONT_SIZE * (0.3 + Math.random() * 0.8),
        color:    `rgb(${THEME_COLORS[ci].join(',')})`,
        chars:    [],
        trailLen: 8 + Math.floor(Math.random() * 12),
      };
    };

    let cols: Column[] = [];
    const initCols = () => {
      const count = Math.floor(canvas.width / COL_GAP) + 2;
      cols = Array.from({ length: count }, () => makeCol());
    };
    initCols();
    window.addEventListener('resize', initCols);

    let animId: number;
    let lastT = 0;

    const draw = (t: number) => {
      animId = requestAnimationFrame(draw);
      if (t - lastT < 50) return; // ~20fps — lightweight
      lastT = t;

      // Very slow fade — leaves long glowing trails
      ctx.fillStyle = 'rgba(7, 5, 26, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;

      cols.forEach((col, ci) => {
        const x = ci * COL_GAP;

        // Draw historical trail chars with decreasing opacity
        const trailColor = THEME_COLORS[THEME_COLORS.findIndex(c =>
          `rgb(${c.join(',')})` === col.color
        ) >= 0
          ? THEME_COLORS.findIndex(c => `rgb(${c.join(',')})` === col.color)
          : 0];

        col.chars.forEach((ch, idx) => {
          const trailY = col.y - (col.chars.length - idx) * FONT_SIZE;
          const opacity = (idx / col.chars.length) * 0.55;
          if (trailColor) {
            ctx.fillStyle = `rgba(${trailColor.join(',')},${opacity})`;
          } else {
            ctx.fillStyle = `rgba(168,85,247,${opacity})`;
          }
          ctx.fillText(ch, x, trailY);
        });

        // Draw leading char (bright / near-white)
        const newChar = chars[Math.floor(Math.random() * chars.length)];
        col.chars.push(newChar);
        if (col.chars.length > col.trailLen) col.chars.shift();

        // Leading glow
        ctx.shadowBlur  = 8;
        ctx.shadowColor = col.color;
        ctx.fillStyle   = 'rgba(230, 220, 255, 0.9)';
        ctx.fillText(newChar, x, col.y);
        ctx.shadowBlur  = 0;

        col.y += col.speed;

        // Reset column when off-screen
        if (col.y > canvas.height + FONT_SIZE * 5) {
          if (Math.random() > 0.7) {
            Object.assign(col, makeCol(-FONT_SIZE * 2));
          } else {
            col.y = -FONT_SIZE * (3 + Math.random() * 8);
            col.chars = [];
          }
        }
      });
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', initCols);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.14, mixBlendMode: 'screen' }}
    />
  );
}
