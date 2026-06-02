'use client';

/**
 * GlitchTextSystem  —  v2  (más visible, más lento, más agresivo)
 * ────────────────────────────────────────────────────────────────
 * Efectos:
 *   1. CSS class  sys-glitch / sys-glitch-heavy  — distorsión visual larga
 *   2. Scramble con 3 fases:
 *        Phase-1 (25%)  → corrupción rápida de todos los chars
 *        Phase-2 (40%)  → "hold" — texto roto visible y fluctuando
 *        Phase-3 (35%)  → recuperación progresiva izq→der
 *   3. Scan-line que cruza la pantalla cada 5-14 s
 *   4. "Cascade mode" (8%) → glitch masivo de todo en pantalla
 *
 * Sin re-renders: toda animación es DOM directo + rAF.
 */

import { useEffect, useRef } from 'react';

/* ── Char pools ────────────────────────────────────────────────── */
const POOL_SYM = '!<>_\\/[]{}=+*^?#░▒▓■□▪◆○●⌬⌭⌮⌖⌗×÷±≈≠∞';
const POOL_HEX = 'ABCDEFabcdef0123456789';
const POOL_ALL = POOL_SYM + POOL_HEX;

/* ── Target selectors ──────────────────────────────────────────── */
const QUERY = '.font-mono, .font-display';

/* ── Safety filter ─────────────────────────────────────────────── */
function isSafe(el: HTMLElement): boolean {
  if (el.childElementCount > 0) return false;
  const text = el.textContent?.trim() ?? '';
  if (text.length < 2 || text.length > 45) return false;
  if (el.classList.contains('material-icons-outlined')) return false;
  if (el.closest('.card-destroy, .card-materialize, .card-materialize-fast')) return false;
  if (el.closest('input, textarea, select, form')) return false;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  return true;
}

/**
 * Pure-numeric / counter elements (e.g. "5", "5/10", "25%", "1,234")
 * change dynamically via React state.  Scrambling them breaks React's
 * internal text-node reference, causing stale/wrong values to persist.
 * Only apply CSS glitch on these — never textNode scramble.
 */
function isSafeToScramble(text: string): boolean {
  return !/^[\d\s,./:%]+$/.test(text.trim());
}

function getCandidates(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(QUERY)).filter(isSafe);
}

/* ─────────────────────────────────────────────────────────────────
   SCRAMBLE  —  3-phase text corruption
   Phase 1  (0–25%)   : todos los chars se corrompen rápido
   Phase 2  (25–65%)  : HOLD roto  —  sigue fluctuando
   Phase 3  (65–100%) : recuperación progresiva izq → der

   ⚠ CRÍTICO: usamos `textNode.nodeValue` en lugar de `el.textContent`.
   `el.textContent = ...` destruye el nodo de texto y crea uno nuevo,
   invalidando la referencia interna de React → React no puede actualizar
   contadores dinámicos después.  `textNode.nodeValue` solo cambia el
   valor sin tocar el nodo → React sigue funcionando correctamente.
   ───────────────────────────────────────────────────────────────── */
function scramble(el: HTMLElement, totalMs: number) {
  // Buscar el nodo de texto que React gestiona (preserva su referencia)
  const textNode = Array.from(el.childNodes).find(
    n => n.nodeType === Node.TEXT_NODE && (n as Text).nodeValue?.trim(),
  ) as Text | undefined;
  if (!textNode) return;

  const original = textNode.nodeValue ?? '';
  if (!original.trim()) return;

  const PHASE1_END = 0.25;
  const PHASE2_END = 0.65;

  const t0 = performance.now();
  let raf = 0;
  let running = true;

  const corrupt = (ch: string) => {
    if (ch === ' ' || ch === '\n' || ch === ':' || ch === '%') return ch;
    const pool = /\d/.test(ch) ? POOL_HEX : POOL_ALL;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const tick = (now: number) => {
    if (!running) return;
    const p = Math.min((now - t0) / totalMs, 1);

    if (p < PHASE1_END) {
      // Phase 1: entrada rápida de corrupción
      const corruptRatio = p / PHASE1_END;
      textNode.nodeValue = original
        .split('').map(ch => (Math.random() > corruptRatio ? ch : corrupt(ch))).join('');

    } else if (p < PHASE2_END) {
      // Phase 2: HOLD — todos corruptos, fluctuando
      textNode.nodeValue = original.split('').map(corrupt).join('');

    } else {
      // Phase 3: recuperación izq→der
      const pivot = Math.floor(((p - PHASE2_END) / (1 - PHASE2_END)) * original.length);
      textNode.nodeValue = original
        .split('').map((ch, i) => (i < pivot ? ch : corrupt(ch))).join('');
    }

    if (p < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      textNode.nodeValue = original;
    }
  };

  raf = requestAnimationFrame(tick);

  // Safety: solo restaurar si el nodo sigue conteniendo chars de scramble
  // (si React lo actualizó a un nuevo valor no lo pisamos)
  setTimeout(() => {
    running = false;
    cancelAnimationFrame(raf);
    const cur = textNode.nodeValue ?? '';
    const isStillScrambled = POOL_SYM.split('').some(ch => cur.includes(ch));
    if (isStillScrambled || cur === original) {
      textNode.nodeValue = original;
    }
    // Si no tiene chars de scramble y es distinto de original → React lo actualizó → no tocar
  }, totalMs + 150);
}

/* ── CSS glitch class ──────────────────────────────────────────── */
function applyGlitch(el: HTMLElement, heavy: boolean) {
  const cls = heavy ? 'sys-glitch-heavy' : 'sys-glitch';
  // duración debe coincidir con la del keyframe (ver globals.css)
  const duration = heavy ? 1_450 : 870;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), duration);
}

/* ── Scan-line sweep ───────────────────────────────────────────── */
function fireScanLine(lineEl: HTMLDivElement) {
  const DURATION = 900;
  const t0 = performance.now();

  lineEl.style.display   = 'block';
  lineEl.style.transform = 'translateY(-4px)';
  lineEl.style.opacity   = '0';

  const tick = (now: number) => {
    const t = (now - t0) / DURATION;
    if (t >= 1) { lineEl.style.display = 'none'; return; }
    lineEl.style.transform = `translateY(${t * 100}vh)`;
    lineEl.style.opacity   = t < 0.05 || t > 0.92
      ? `${Math.min(t / 0.05, (1 - t) / 0.08).toFixed(2)}`
      : '1';
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function GlitchTextSystem() {
  const lineRef   = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {

    /* ── Main glitch loop ────────────────────────────────────── */
    const scheduleGlitch = () => {
      // Dispara cada 0.7s – 3s (más frecuente que antes)
      const delay = 700 + Math.random() * 2_300;

      timerRef.current = setTimeout(() => {
        const candidates = getCandidates();
        if (candidates.length === 0) { scheduleGlitch(); return; }

        const shuffled = [...candidates].sort(() => Math.random() - 0.5);

        // 8% chance → cascade mode: golpea TODO en pantalla
        const cascade  = Math.random() < 0.08;
        const count    = cascade
          ? shuffled.length
          : 3 + Math.floor(Math.random() * 5);   // 3–7 elementos normalmente

        const picked = shuffled.slice(0, Math.min(count, shuffled.length));

        // Trigger hacker overlay on cascade mode
        if (cascade) {
          window.dispatchEvent(new CustomEvent('hacker-appear'));
        }

        // Stagger entre cada elemento para que se vea la propagación
        const stagger = cascade ? 25 : 80 + Math.random() * 60;

        picked.forEach((el, i) => {
          setTimeout(() => {
            const heavy = cascade || Math.random() < 0.40;
            applyGlitch(el, heavy);

            // Scramble solo en texto estático (nunca en contadores numéricos)
            // Los contadores usan solo dígitos/% → isSafeToScramble = false
            // → solo reciben el efecto CSS, no el reemplazo de caracteres
            const text = el.textContent?.trim() ?? '';
            if (Math.random() < 0.90 && isSafeToScramble(text)) {
              const ms = 500 + Math.random() * 500;
              setTimeout(() => scramble(el, ms), 20);
            }
          }, i * stagger);
        });

        scheduleGlitch();
      }, delay);
    };

    /* ── Scan-line loop ──────────────────────────────────────── */
    const scheduleScan = () => {
      const delay = 5_000 + Math.random() * 9_000;   // 5 s – 14 s
      scanTimer.current = setTimeout(() => {
        if (lineRef.current) fireScanLine(lineRef.current);
        scheduleScan();
      }, delay);
    };

    timerRef.current  = setTimeout(scheduleGlitch, 1_500 + Math.random() * 1_500);
    scanTimer.current = setTimeout(scheduleScan,   4_000 + Math.random() * 3_000);

    return () => {
      if (timerRef.current)  clearTimeout(timerRef.current);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, []);

  return (
    <div
      ref={lineRef}
      aria-hidden
      style={{
        display:       'none',
        position:      'fixed',
        inset:         '0 0 auto',
        height:        '3px',
        pointerEvents: 'none',
        zIndex:        9999,
        background:    'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.95) 15%, rgba(255,255,255,0.8) 50%, rgba(6,182,212,0.95) 85%, transparent 100%)',
        boxShadow:     '0 0 22px rgba(168,85,247,0.8), 0 0 45px rgba(168,85,247,0.35), 0 0 8px rgba(255,255,255,0.6)',
        filter:        'blur(0.3px)',
      }}
    />
  );
}
