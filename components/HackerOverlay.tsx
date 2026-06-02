'use client';

/**
 * HackerOverlay  —  v2
 * ────────────────────
 * • PNG hacker image con efectos canvas (code rain, scanlines, glitch)
 * • Terminal siempre visible con typewriter efecto real (carácter a carácter)
 * • Dual-mode: MONITORING (verde) → DANGER (rojo) con IP de intruso
 * • Triggered por 'hacker-appear' event + timer propio cada 30-80s
 *
 * Fixes v2:
 *  - codeRainList / warningTexts → useRef (no module globals)
 *  - setOpacity/setIsDanger fuera del rAF (sin re-renders a 60fps)
 *  - imageOpacity: CSS transition, solo 2 updates por animación
 *  - isDanger: ref para canvas, state solo en cambio de fase
 *  - Typewriter real (carácter a carácter) en lugar de líneas instantáneas
 *  - Red tint reducido a 0.05-0.09 (no tapa la UI)
 *  - IPs de intrusos en modo DANGER
 */

import { useEffect, useRef, useState } from 'react';

/* ── Char / word pools ─────────────────────────────────────────────── */
const HACKER_CHARS = '01▓░▒█◆◇⌬⌭⊕⊗■□ABCDEFabcdef0x{}[]<>/\\'.split('');
const DANGER_WORDS = ['⚠ PELIGRO ⚠', '⚠ DANGER ⚠', 'ALERTA', 'ALERT', '🚨 INTRUSO 🚨'];

/* ── Terminal command pools — OUTSIDE component (no recreación en render) */
const MONITORING_COMMANDS = [
  '$ tail -f /var/log/syslog',
  '> [INFO] System nominal',
  '$ systemctl status firewall',
  '> ● firewall.service - running',
  '$ netstat -an | wc -l',
  '> Active connections: 847',
  '$ df -h / | tail -1',
  '> /dev/sda1 12G 8.2G 2.1G 82%',
  '$ ps aux | wc -l',
  '> Running processes: 234',
  '$ uptime',
  '> up 45 days, 12:34, 3 users',
  '$ du -sh /var/log',
  '> 2.3G /var/log',
  '$ who',
  '> root pts/0 2026-06-02 08:14',
  '$ last -n 3',
  '> root tty1 Sat Jun  1 23:11',
];

const DEFENSE_COMMANDS = [
  /* Intrusion alerts con IPs reales de Tor exit nodes */
  '> ALERT: SSH attempt from 185.220.101.47',
  '> ALERT: Port scan detected 45.153.160.2',
  '> CRITICAL: Unauthorized access port 22',
  '> WARNING: 847 pkts from unknown source',
  '> ALERT: Brute-force: 23.129.64.190',
  /* Respuestas defensivas */
  '$ sudo iptables -A INPUT -s 185.220.101.47 -j DROP',
  '> Blocking 185.220.101.47... [██████████]',
  '$ fail2ban-client set sshd banip 185.220.101.47',
  '> IP 185.220.101.47 banned permanently',
  '$ arp-scan --interface=eth0 --localnet',
  '> Scanning network... [████████░░] 78%',
  '$ grep -r "intrusion" /var/log/auth',
  '> Found 12 unauthorized attempts',
  '$ iptables -A INPUT -j DROP',
  '> Blocking incoming traffic... done',
  '$ tcpdump -i eth0 -w capture.pcap',
  '> Capturing packets... [███████░░░] 65%',
  '$ fail2ban-client status',
  '> Status: 3 jails active, 18 banned',
  '$ systemctl restart ssh',
  '> SSH service restarted.',
  '$ ufw enable',
  '> Firewall enabled [██████████] 100%',
  '$ traceroute 185.220.101.47',
  '> Tracing... 15 hops detected',
  '$ ssh-keygen -t ed25519',
  '> Generating keys... [██████████] 100%',
];

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface CodeRain {
  x: number; y: number;
  speed: number; char: string; color: string;
}
interface WarningText {
  x: number; y: number;
  text: string; life: number; decay: number;
}

/* ══════════════════════════════════════════════════════════════════════
   CANVAS DRAW HELPERS
   ══════════════════════════════════════════════════════════════════════ */

function drawCodeRain(
  ctx: CanvasRenderingContext2D, vw: number, vh: number,
  rain: CodeRain[], masterOpacity: number, isDanger: boolean,
) {
  if (Math.random() < 0.35 && rain.length < (isDanger ? 180 : 120)) {
    const dc = ['rgba(255,50,50,0.7)',   'rgba(255,100,0,0.6)',   'rgba(255,200,0,0.65)'];
    const nc = ['rgba(6,182,212,0.5)',   'rgba(168,85,247,0.4)',  'rgba(59,130,246,0.45)'];
    rain.push({
      x:     Math.random() * vw,
      y:     -20,
      speed: isDanger ? 1.2 + Math.random() * 1.8 : 0.8 + Math.random() * 1.2,
      char:  HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)],
      color: (isDanger ? dc : nc)[Math.floor(Math.random() * 3)],
    });
  }
  for (let i = rain.length - 1; i >= 0; i--) {
    const r = rain[i];
    r.y += r.speed;
    if (r.y > vh) { rain.splice(i, 1); continue; }
    ctx.globalAlpha = masterOpacity * 0.6;
    ctx.font        = '12px "Courier New", monospace';
    ctx.fillStyle   = r.color;
    ctx.shadowBlur  = isDanger ? 12 : 6;
    ctx.shadowColor = r.color;
    ctx.fillText(r.char, r.x, r.y);
    ctx.shadowBlur  = 0;
  }
  ctx.globalAlpha = 1;
}

function drawDangerWarnings(
  ctx: CanvasRenderingContext2D, vw: number, vh: number,
  warnings: WarningText[], masterOpacity: number, isDanger: boolean,
) {
  if (!isDanger) return;
  if (Math.random() < 0.15 && warnings.length < 8) {
    warnings.push({
      x:     Math.random() * vw * 0.8 + vw * 0.1,
      y:     Math.random() * vh,
      text:  DANGER_WORDS[Math.floor(Math.random() * DANGER_WORDS.length)],
      life:  1,
      decay: 0.008 + Math.random() * 0.012,
    });
  }
  for (let i = warnings.length - 1; i >= 0; i--) {
    const w = warnings[i];
    w.life -= w.decay;
    if (w.life <= 0) { warnings.splice(i, 1); continue; }
    const pulse = 0.5 + 0.5 * Math.sin(w.life * Math.PI * 3);
    const a     = w.life * pulse * masterOpacity;
    ctx.globalAlpha = a;
    ctx.font        = 'bold 28px "Courier New", monospace';
    ctx.fillStyle   = `rgba(255,50,50,${a})`;
    ctx.shadowBlur  = 30;
    ctx.shadowColor = `rgba(255,50,50,${a})`;
    ctx.textAlign   = 'center';
    ctx.fillText(w.text,
      w.x + (Math.random() - 0.5) * 8,
      w.y + (Math.random() - 0.5) * 8,
    );
    ctx.shadowBlur = 0;
    ctx.textAlign  = 'left';
  }
  ctx.globalAlpha = 1;
}

function drawDangerOverlay(
  ctx: CanvasRenderingContext2D, vw: number, vh: number,
  masterOpacity: number, isDanger: boolean, time: number,
) {
  if (!isDanger) return;
  /* Reducido de 0.15-0.25 → 0.05-0.09 para no tapar la UI */
  const p = 0.05 + 0.04 * Math.sin(time * 0.003);
  ctx.globalAlpha = p * masterOpacity;
  ctx.fillStyle   = '#ff3232';
  ctx.fillRect(0, 0, vw, vh);
  ctx.globalAlpha = 1;
}

function drawScanlines(
  ctx: CanvasRenderingContext2D, vw: number, vh: number,
  masterOpacity: number, isDanger: boolean,
) {
  ctx.globalAlpha = masterOpacity * (isDanger ? 0.18 : 0.12);
  ctx.fillStyle   = isDanger ? 'rgba(255,50,50,0.3)' : '#000';
  for (let ly = 0; ly < vh; ly += 4) ctx.fillRect(0, ly, vw, 2);
  ctx.globalAlpha = 1;
}

function drawGlitchBars(
  ctx: CanvasRenderingContext2D, vw: number, vh: number,
  masterOpacity: number,
) {
  if (Math.random() > 0.15) return;
  const colors = [
    `rgba(6,182,212,${0.4 * masterOpacity})`,
    `rgba(168,85,247,${0.3 * masterOpacity})`,
    `rgba(59,130,246,${0.35 * masterOpacity})`,
  ];
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const bw = 2 + Math.random() * 8;
    const bh = 50 + Math.random() * 150;
    const bx = Math.random() * vw;
    const by = Math.random() * (vh - bh);
    ctx.globalAlpha = masterOpacity * 0.5;
    ctx.fillStyle   = colors[Math.floor(Math.random() * 3)];
    ctx.shadowBlur  = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(bx, by, bw, bh);
    ctx.shadowBlur  = 0;
  }
  ctx.globalAlpha = 1;
}

function drawMatrixDissolution(
  ctx: CanvasRenderingContext2D, vw: number, vh: number,
  masterOpacity: number, t: number,
) {
  const inTransition = t < 0.15 || t > 0.75;
  if (!inTransition) return;
  const intensity = t < 0.15
    ? (0.15 - t) / 0.15
    : (t - 0.75)  / 0.25;
  const colors = [
    `rgba(6,182,212,${0.8 * masterOpacity})`,
    `rgba(168,85,247,${0.7 * masterOpacity})`,
    `rgba(59,130,246,${0.75 * masterOpacity})`,
    `rgba(255,255,255,${0.6 * masterOpacity})`,
  ];
  const count = Math.floor(intensity * 200);
  for (let i = 0; i < count; i++) {
    const fs = Math.max(2, 12 * intensity) + 4;
    ctx.globalAlpha = intensity * masterOpacity * 0.9;
    ctx.font        = `bold ${fs}px "Courier New", monospace`;
    ctx.fillStyle   = colors[Math.floor(Math.random() * 4)];
    ctx.shadowBlur  = 20 * intensity;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText(
      HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)],
      Math.random() * vw, Math.random() * vh,
    );
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

function drawTransitionGlitch(
  ctx: CanvasRenderingContext2D, vw: number, vh: number,
  masterOpacity: number, t: number,
) {
  const inTransition = t < 0.15 || t > 0.75;
  if (!inTransition) return;
  const intensity = t < 0.15 ? (0.15 - t) / 0.15 : (t - 0.75) / 0.25;
  const lineCount = Math.floor(intensity * 15);
  for (let i = 0; i < lineCount; i++) {
    const y  = Math.random() * vh;
    const h  = 1 + Math.random() * 3;
    const op = Math.random() * intensity * masterOpacity;
    const gr = ctx.createLinearGradient(0, y, vw, y);
    gr.addColorStop(0,   `rgba(6,182,212,0)`);
    gr.addColorStop(0.2, `rgba(6,182,212,${op})`);
    gr.addColorStop(0.5, `rgba(168,85,247,${op * 0.8})`);
    gr.addColorStop(0.8, `rgba(6,182,212,${op})`);
    gr.addColorStop(1,   `rgba(6,182,212,0)`);
    ctx.fillStyle   = gr;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, y, vw, h);
  }
}

function drawLightBurst(
  ctx: CanvasRenderingContext2D, vw: number, vh: number,
  masterOpacity: number, t: number,
) {
  const inTransition = t < 0.15 || t > 0.75;
  if (!inTransition) return;
  const intensity = t < 0.15 ? (0.15 - t) / 0.15 : (t - 0.75) / 0.25;
  const r  = Math.sqrt(vw * vw + vh * vh) / 2;
  const gr = ctx.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, r);
  gr.addColorStop(0,   `rgba(168,85,247,${intensity * masterOpacity * 0.6})`);
  gr.addColorStop(0.3, `rgba(6,182,212,${intensity * masterOpacity * 0.3})`);
  gr.addColorStop(1,   `rgba(59,130,246,0)`);
  ctx.fillStyle   = gr;
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, vw, vh);
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
export default function HackerOverlay() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);

  /* Instance-scoped arrays — NOT module globals */
  const codeRainRef    = useRef<CodeRain[]>([]);
  const warningTextsRef = useRef<WarningText[]>([]);
  const isDangerRef    = useRef(false);   // for canvas logic (no re-render)

  /* React state only for UI elements */
  const [isDanger, setIsDanger]       = useState(false);
  const [imageOpacity, setImageOpacity] = useState(0);  // driven by show()/end only

  /* ── Typewriter state ──────────────────────────────────────────── */
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '$ /root/security/monitor.sh',
  ]);
  const [typingLine,   setTypingLine]   = useState('');
  const [typingTarget, setTypingTarget] = useState('> Monitoring system...');
  const typingIndexRef = useRef(0);
  /* We also need a ref to let the canvas effect "show()" reset the terminal */
  const resetTerminalRef = useRef<(() => void) | null>(null);

  /* ── Canvas animation ──────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    let animId    = 0;
    let startTime = 0;
    let running   = false;
    const TOTAL   = 6_000;

    const animate = (now: number) => {
      const vw = canvas.width, vh = canvas.height;
      const elapsed = now - startTime;
      const t = Math.min(elapsed / TOTAL, 1);

      /* Opacity envelope — NO setOpacity inside rAF */
      let mo: number;
      if      (t < 0.08) mo = t / 0.08;
      else if (t < 0.75) mo = 1;
      else               mo = 1 - (t - 0.75) / 0.25;

      /* Update image opacity directly (one DOM write, no React re-render) */
      if (imageWrapRef.current) {
        imageWrapRef.current.style.opacity = mo.toFixed(3);
      }

      /* isDanger state — update React only on phase boundary (2× per anim) */
      const newDanger = t >= 0.15 && t <= 0.75;
      if (newDanger !== isDangerRef.current) {
        isDangerRef.current = newDanger;
        setIsDanger(newDanger);
      }

      ctx.clearRect(0, 0, vw, vh);

      drawCodeRain(ctx, vw, vh, codeRainRef.current, mo, isDangerRef.current);
      drawScanlines(ctx, vw, vh, mo, isDangerRef.current);
      drawDangerOverlay(ctx, vw, vh, mo, isDangerRef.current, elapsed);

      const glitchP = (t < 0.15 || t > 0.75) ? 0.6 : (isDangerRef.current ? 0.25 : 0.15);
      if (Math.random() > 1 - glitchP) drawGlitchBars(ctx, vw, vh, mo);

      drawLightBurst(ctx, vw, vh, mo, t);
      drawTransitionGlitch(ctx, vw, vh, mo, t);
      drawMatrixDissolution(ctx, vw, vh, mo, t);
      drawDangerWarnings(ctx, vw, vh, warningTextsRef.current, mo, isDangerRef.current);

      if (t < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        running = false;
        codeRainRef.current.length    = 0;
        warningTextsRef.current.length = 0;
        isDangerRef.current = false;
        setIsDanger(false);
        setImageOpacity(0);
        ctx.clearRect(0, 0, vw, vh);
      }
    };

    const show = () => {
      if (running) return;
      running   = true;
      startTime = performance.now();
      codeRainRef.current.length    = 0;
      warningTextsRef.current.length = 0;
      isDangerRef.current = false;
      setImageOpacity(1);
      /* Reset terminal */
      resetTerminalRef.current?.();
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(animate);
    };

    window.addEventListener('hacker-appear', show);

    let ownTimer: ReturnType<typeof setTimeout>;
    const scheduleOwn = () => {
      ownTimer = setTimeout(() => { show(); scheduleOwn(); }, 30_000 + Math.random() * 50_000);
    };
    scheduleOwn();

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(ownTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('hacker-appear', show);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Terminal reset callback (called from canvas show()) ──────── */
  useEffect(() => {
    resetTerminalRef.current = () => {
      setTerminalLines(['$ /root/security/monitor.sh']);
      typingIndexRef.current = 0;
      setTypingLine('');
      setTypingTarget('> Connecting to monitoring node...');
    };
  }, []);

  /* ── Typewriter effect ────────────────────────────────────────────
     Dependency on [typingLine] drives char-by-char: each new char
     triggers the effect → schedules the next char (or next command).
  ──────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (typingIndexRef.current < typingTarget.length) {
      /* Still typing — schedule next character */
      const delay = 28 + Math.random() * 55;   // 28-83 ms per char
      const timer = setTimeout(() => {
        typingIndexRef.current++;
        setTypingLine(typingTarget.slice(0, typingIndexRef.current));
      }, delay);
      return () => clearTimeout(timer);
    } else {
      /* Finished line → wait, then start next command */
      const delay = isDanger
        ? 400  + Math.random() * 700
        : 900  + Math.random() * 1_400;

      const timer = setTimeout(() => {
        /* Finalize completed line */
        setTerminalLines(prev => {
          const next = [...prev, typingTarget];
          return next.length > 8 ? next.slice(-8) : next;
        });
        /* Pick next command */
        const pool = isDanger ? DEFENSE_COMMANDS : MONITORING_COMMANDS;
        const next = pool[Math.floor(Math.random() * pool.length)];
        typingIndexRef.current = 0;
        setTypingLine('');
        setTypingTarget(next);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [typingLine, typingTarget, isDanger]);

  /* ── JSX ─────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Hacker PNG image — opacity driven directly via ref ────── */}
      <div
        ref={imageWrapRef}
        style={{
          position:      'fixed',
          inset:         0,
          pointerEvents: 'none',
          zIndex:        0,
          opacity:       0,                // starts hidden; rAF updates directly
          overflow:      'hidden',
          background:    'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/hacker.png"
          alt="hacker"
          style={{
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: 'center',
            filter:         'brightness(1.15) contrast(1.2) drop-shadow(0 0 40px rgba(168,85,247,0.7)) drop-shadow(0 0 80px rgba(6,182,212,0.5))',
          }}
        />
      </div>

      {/* ── Canvas effects — above image, below UI ─────────────────── */}
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      />

      {/* ── Terminal — always visible ───────────────────────────────── */}
      <div
        style={{
          position:      'fixed',
          top:           '20px',
          left:          '20px',
          width:         '380px',
          zIndex:        1,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background:   'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,20,10,0.92) 100%)',
            border:       isDanger ? '2px solid #ff3333' : '2px solid #00ff00',
            borderRadius: '4px',
            padding:      '12px 14px',
            fontFamily:   '"Courier New", monospace',
            fontSize:     '11px',
            lineHeight:   '1.6',
            color:        isDanger ? '#ff6666' : '#00ff00',
            boxShadow:    isDanger
              ? '0 0 20px rgba(255,50,50,0.8), inset 0 0 10px rgba(255,50,50,0.2)'
              : '0 0 20px rgba(0,255,0,0.6), inset 0 0 10px rgba(0,255,0,0.1)',
            textShadow:   isDanger
              ? '0 0 5px rgba(255,100,100,0.8)'
              : '0 0 5px rgba(0,255,0,0.8)',
            transition:   'border-color 500ms, box-shadow 500ms, color 500ms, text-shadow 500ms',
          }}
        >
          {/* Header */}
          <div style={{
            marginBottom:   '8px',
            paddingBottom:  '6px',
            borderBottom:   isDanger ? '1px solid rgba(255,100,100,0.5)' : '1px solid rgba(0,255,0,0.3)',
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
          }}>
            <span style={{ fontSize: '10px', opacity: 0.7 }}>root@nexus ~ #</span>
            <span style={{
              fontSize:   '9px',
              fontWeight: 'bold',
              color:      isDanger ? '#ff3333' : '#00ff00',
            }}>
              {isDanger ? '● INTRUSION!' : '● MONITORING'}
            </span>
          </div>

          {/* Completed lines */}
          <div style={{ maxHeight: '160px', overflow: 'hidden' }}>
            {terminalLines.map((line, idx) => (
              <div key={idx} style={{
                marginBottom: '1px',
                color: isDanger
                  ? (line.includes('ERROR') || line.includes('ALERT') || line.includes('CRITICAL')
                      ? '#ff3333' : '#ff8888')
                  : (line.includes('ERROR') ? '#ff6666' : '#00dd00'),
                opacity: 0.85 + 0.15 * (idx / terminalLines.length),
              }}>
                {line}
              </div>
            ))}

            {/* Currently typing line */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{typingLine}</span>
              <span style={{
                display:    'inline-block',
                width:      '7px',
                height:     '12px',
                background: isDanger ? '#ff3333' : '#00ff00',
                marginLeft: '1px',
                animation:  'termBlink 1s step-end infinite',
                boxShadow:  isDanger ? '0 0 8px rgba(255,50,50,0.8)' : '0 0 8px rgba(0,255,0,0.8)',
              }} />
            </div>
          </div>

          {/* Inner glow */}
          <div style={{
            position:      'absolute',
            inset:         '-8px',
            borderRadius:  '4px',
            background:    isDanger
              ? 'radial-gradient(ellipse at center, rgba(255,50,50,0.2) 0%, rgba(255,50,50,0) 70%)'
              : 'radial-gradient(ellipse at center, rgba(0,255,0,0.2) 0%, rgba(0,255,0,0) 70%)',
            pointerEvents: 'none',
            zIndex:        -1,
          }} />
        </div>
      </div>

      <style>{`
        @keyframes termBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }
      `}</style>
    </>
  );
}
