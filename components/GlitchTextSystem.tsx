'use client';

/**
 * GlitchTextSystem
 * ─────────────────
 * Randomly selects leaf-text elements and applies two effects:
 *   1. CSS glitch class  → transform + filter + opacity distortion
 *   2. Character scramble → text content briefly corrupted then restored
 *
 * Also fires occasional full-viewport scan-line sweeps.
 *
 * No React state — all animations use direct DOM manipulation so there
 * are zero re-renders from this component.
 */

import { useEffect, useRef } from 'react';

/* ── Char pools ────────────────────────────────────────────────────── */
const POOL_SYM  = '!<>-_\\/[]{}=+*^?#░▒▓■□▪◆○●⌬⌭⌮⌖⌗';
const POOL_HEX  = 'ABCDEFabcdef0123456789';
const POOL_ALL  = POOL_SYM + POOL_HEX;

/* ── Selectors to search for glitch candidates ─────────────────── */
const QUERY = '.font-mono, .font-display';

/* ── Exclusion checks ──────────────────────────────────────────── */
function isSafe(el: HTMLElement): boolean {
  if (el.childElementCount > 0) return false;                         // has child elements
  const text = el.textContent?.trim() ?? '';
  if (text.length < 2 || text.length > 40) return false;             // too short / too long
  if (el.classList.contains('material-icons-outlined')) return false;  // icon font
  if (el.closest('.card-destroy, .card-materialize, .card-materialize-fast')) return false;
  if (el.closest('input, textarea, select, form')) return false;       // form fields
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  return true;
}

function getCandidates(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(QUERY)).filter(isSafe);
}

/* ── Text scramble ─────────────────────────────────────────────── */
function scramble(el: HTMLElement, ms: number) {
  const original = el.textContent ?? '';
  if (!original.trim()) return;

  const t0 = performance.now();
  let raf  = 0;

  const tick = (now: number) => {
    const progress = Math.min((now - t0) / ms, 1);
    const pivot    = Math.floor(progress * original.length);

    el.textContent = original
      .split('')
      .map((ch, i) => {
        if (ch === ' ' || ch === '\n' || ch === ':' || ch === '%') return ch;
        if (i < pivot) return ch;   // already restored
        // Use hex-heavy pool for numbers, symbol pool for letters
        const pool = /\d/.test(ch) ? POOL_HEX : POOL_ALL;
        return pool[Math.floor(Math.random() * pool.length)];
      })
      .join('');

    if (progress < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      el.textContent = original;
    }
  };

  raf = requestAnimationFrame(tick);

  // Safety: always restore even if rAF was cancelled by browser
  setTimeout(() => {
    cancelAnimationFrame(raf);
    el.textContent = original;
  }, ms + 120);
}

/* ── CSS class helpers ─────────────────────────────────────────── */
function applyGlitch(el: HTMLElement, heavy: boolean) {
  const cls      = heavy ? 'sys-glitch-heavy' : 'sys-glitch';
  const duration = heavy ? 560 : 320;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), duration);
}

/* ── Scan-line sweep ───────────────────────────────────────────── */
function fireScanLine(lineEl: HTMLDivElement) {
  const DURATION = 750;
  const t0 = performance.now();

  lineEl.style.display   = 'block';
  lineEl.style.transform = 'translateY(-4px)';
  lineEl.style.opacity   = '0';

  const tick = (now: number) => {
    const t = (now - t0) / DURATION;
    if (t >= 1) { lineEl.style.display = 'none'; return; }
    lineEl.style.transform = `translateY(${t * 100}vh)`;
    lineEl.style.opacity   = (t < 0.04 || t > 0.96) ? `${Math.min(t / 0.04, (1 - t) / 0.04)}` : '1';
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function GlitchTextSystem() {
  const lineRef   = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /* ── Main glitch loop ──────────────────────────────────────── */
    const scheduleGlitch = () => {
      const delay = 1_400 + Math.random() * 4_200;   // 1.4 s – 5.6 s
      timerRef.current = setTimeout(() => {
        const candidates = getCandidates();
        if (candidates.length > 0) {
          /* Pick 1–4 random elements, staggered slightly */
          const count   = 1 + Math.floor(Math.random() * 3);
          const picked  = [...candidates]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(count, candidates.length));

          picked.forEach((el, i) => {
            setTimeout(() => {
              const heavy = Math.random() < 0.22;     // 22% chance of heavy glitch
              applyGlitch(el, heavy);

              // ~65% chance of also scrambling the text
              if (Math.random() < 0.65) {
                const scrambleDur = 140 + Math.random() * 220;
                setTimeout(() => scramble(el, scrambleDur), 30);
              }
            }, i * (70 + Math.random() * 50));
          });
        }
        scheduleGlitch();   // queue next
      }, delay);
    };

    /* ── Scan-line loop ────────────────────────────────────────── */
    const scheduleScan = () => {
      const delay = 6_000 + Math.random() * 14_000;   // 6 s – 20 s
      scanTimer.current = setTimeout(() => {
        if (lineRef.current) fireScanLine(lineRef.current);
        scheduleScan();
      }, delay);
    };

    /* Stagger initial starts */
    timerRef.current  = setTimeout(scheduleGlitch, 2_000 + Math.random() * 2_000);
    scanTimer.current = setTimeout(scheduleScan,   5_000 + Math.random() * 5_000);

    return () => {
      if (timerRef.current)  clearTimeout(timerRef.current);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, []);

  return (
    /* Scan line element — hidden by default, shown by fireScanLine() */
    <div
      ref={lineRef}
      aria-hidden
      style={{
        display:       'none',
        position:      'fixed',
        inset:         '0 0 auto',
        height:        '2px',
        pointerEvents: 'none',
        zIndex:        9999,
        background:    'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.9) 20%, rgba(6,182,212,0.7) 50%, rgba(168,85,247,0.9) 80%, transparent 100%)',
        boxShadow:     '0 0 18px rgba(168,85,247,0.7), 0 0 36px rgba(168,85,247,0.3)',
        filter:        'blur(0.5px)',
      }}
    />
  );
}
