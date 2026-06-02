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
const DANGER_WORDS = ['⚠ PELIGRO ⚠', '⚠ DANGER ⚠', 'ALERTA', 'ALERT', '🚨 INTRUSO 🚨'];

interface CodeRain {
  x: number; y: number;
  speed: number;
  char: string;
  color: string;
}

interface WarningText {
  x: number; y: number;
  text: string;
  life: number;
  decay: number;
  opacity: number;
}

const codeRainList: CodeRain[] = [];
const warningTexts: WarningText[] = [];


function drawCodeRain(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
  isDanger:      boolean = false,
) {
  // Spawn new rain
  if (Math.random() < 0.35 && codeRainList.length < (isDanger ? 180 : 120)) {
    const dangerColors = ['rgba(255,50,50,0.7)', 'rgba(255,100,0,0.6)', 'rgba(255,200,0,0.65)'];
    const normalColors = ['rgba(6,182,212,0.5)', 'rgba(168,85,247,0.4)', 'rgba(59,130,246,0.45)'];
    
    codeRainList.push({
      x:     Math.random() * vw,
      y:     -20,
      speed: isDanger ? (1.2 + Math.random() * 1.8) : (0.8 + Math.random() * 1.2),
      char:  HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)],
      color: isDanger 
        ? dangerColors[Math.floor(Math.random() * dangerColors.length)]
        : normalColors[Math.floor(Math.random() * normalColors.length)],
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
    ctx.shadowBlur  = isDanger ? 12 : 6;
    ctx.shadowColor = r.color;
    ctx.fillText(r.char, r.x, r.y);
    ctx.shadowBlur  = 0;
  }
  ctx.globalAlpha = 1;
}

/* ── Draw danger warning text ──────────────────────────────── */
function drawDangerWarnings(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
  isDanger:      boolean,
) {
  if (!isDanger) return;

  // Spawn new warning texts
  if (Math.random() < 0.15 && warningTexts.length < 8) {
    warningTexts.push({
      x:     Math.random() * vw * 0.8 + vw * 0.1,
      y:     Math.random() * vh,
      text:  DANGER_WORDS[Math.floor(Math.random() * DANGER_WORDS.length)],
      life:  1,
      decay: 0.008 + Math.random() * 0.012,
      opacity: 1,
    });
  }

  // Draw and update warning texts
  for (let i = warningTexts.length - 1; i >= 0; i--) {
    const w = warningTexts[i];
    w.life -= w.decay;
    
    if (w.life <= 0) {
      warningTexts.splice(i, 1);
      continue;
    }

    // Pulsing opacity effect
    const pulse = 0.5 + 0.5 * Math.sin(w.life * Math.PI * 3);
    const displayOpacity = w.life * pulse * masterOpacity;

    ctx.globalAlpha = displayOpacity;
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = `rgba(255,50,50,${displayOpacity})`;
    ctx.shadowBlur = 30;
    ctx.shadowColor = `rgba(255,50,50,${displayOpacity})`;
    ctx.textAlign = 'center';
    
    // Slight glitch movement
    const glitchX = (Math.random() - 0.5) * 8;
    const glitchY = (Math.random() - 0.5) * 8;
    
    ctx.fillText(w.text, w.x + glitchX, w.y + glitchY);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1;
}

/* ── Draw danger overlay tint ──────────────────────────────── */
function drawDangerOverlay(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
  isDanger:      boolean,
  time:          number,
) {
  if (!isDanger) return;

  // Pulsing red tint
  const pulseIntensity = 0.15 + 0.1 * Math.sin(time * 0.003);
  ctx.globalAlpha = pulseIntensity * masterOpacity;
  ctx.fillStyle = '#ff3232';
  ctx.fillRect(0, 0, vw, vh);
  ctx.globalAlpha = 1;
}


function drawScanlines(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
  isDanger:      boolean = false,
) {
  ctx.globalAlpha = masterOpacity * (isDanger ? 0.18 : 0.12);
  ctx.fillStyle   = isDanger ? 'rgba(255,50,50,0.3)' : '#000';
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

/* ── Epic matrix dissolution effect ────────────────────────── */
function drawMatrixDissolution(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
  transitionPhase: number, // 0 = fade-in start, 1 = middle, 2 = fade-out end
) {
  // Only during transitions (first 15% and last 25%)
  const isTransition = transitionPhase < 0.15 || transitionPhase > 0.75;
  if (!isTransition) return;

  // Calculate transition intensity
  let intensity = 0;
  if (transitionPhase < 0.15) {
    // Fade-in: letras pixelizándose en la imagen
    intensity = (0.15 - transitionPhase) / 0.15;
  } else {
    // Fade-out: imagen dissolviéndose en letras
    intensity = (transitionPhase - 0.75) / 0.25;
  }

  const pixelSize = Math.max(2, 12 * intensity);
  
  // Draw pixelated matrix rain with intense glow during transitions
  const pixelCount = Math.floor(intensity * 200);
  for (let i = 0; i < pixelCount; i++) {
    const x = Math.random() * vw;
    const y = Math.random() * vh;
    const char = HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)];
    
    const colors = [
      `rgba(6,182,212,${0.8 * masterOpacity})`,
      `rgba(168,85,247,${0.7 * masterOpacity})`,
      `rgba(59,130,246,${0.75 * masterOpacity})`,
      `rgba(255,255,255,${0.6 * masterOpacity})`,
    ];
    
    ctx.globalAlpha = intensity * masterOpacity * 0.9;
    ctx.font = `bold ${pixelSize + 4}px "Courier New", monospace`;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.shadowBlur = 20 * intensity;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText(char, x, y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

/* ── Intense glitch lines during transitions ──────────────── */
function drawTransitionGlitch(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
  transitionPhase: number,
) {
  const isTransition = transitionPhase < 0.15 || transitionPhase > 0.75;
  if (!isTransition) return;

  let intensity = 0;
  if (transitionPhase < 0.15) {
    intensity = (0.15 - transitionPhase) / 0.15;
  } else {
    intensity = (transitionPhase - 0.75) / 0.25;
  }

  // Intense horizontal glitch lines
  const lineCount = Math.floor(intensity * 15);
  for (let i = 0; i < lineCount; i++) {
    const y = Math.random() * vh;
    const h = 1 + Math.random() * 3;
    const opacity = Math.random() * intensity * masterOpacity;
    
    const gradient = ctx.createLinearGradient(0, y, vw, y);
    gradient.addColorStop(0, `rgba(6,182,212,0)`);
    gradient.addColorStop(0.2, `rgba(6,182,212,${opacity})`);
    gradient.addColorStop(0.5, `rgba(168,85,247,${opacity * 0.8})`);
    gradient.addColorStop(0.8, `rgba(6,182,212,${opacity})`);
    gradient.addColorStop(1, `rgba(6,182,212,0)`);
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, y, vw, h);
  }
}

/* ── Pulsing light burst during transitions ────────────────── */
function drawLightBurst(
  ctx:           CanvasRenderingContext2D,
  vw:            number,
  vh:            number,
  masterOpacity: number,
  transitionPhase: number,
) {
  const isTransition = transitionPhase < 0.15 || transitionPhase > 0.75;
  if (!isTransition) return;

  let intensity = 0;
  if (transitionPhase < 0.15) {
    intensity = (0.15 - transitionPhase) / 0.15;
  } else {
    intensity = (transitionPhase - 0.75) / 0.25;
  }

  // Radial light burst from center
  const centerX = vw / 2;
  const centerY = vh / 2;
  const maxRadius = Math.sqrt(vw * vw + vh * vh) / 2;
  
  const burstGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  burstGradient.addColorStop(0, `rgba(168,85,247,${intensity * masterOpacity * 0.6})`);
  burstGradient.addColorStop(0.3, `rgba(6,182,212,${intensity * masterOpacity * 0.3})`);
  burstGradient.addColorStop(1, `rgba(59,130,246,0)`);
  
  ctx.fillStyle = burstGradient;
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, vw, vh);
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function HackerOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>(['$ /root/security/monitor.sh', '> Monitoring system...']);
  const [isDanger, setIsDanger] = useState(false);

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
  ];

  const DEFENSE_COMMANDS = [
    '$ sudo systemctl start firewall',
    '> Firewall started... [████████░░] 80%',
    '$ ssh-keygen -t rsa -b 4096',
    '> Generating keys... [██████████] 100%',
    '$ arp-scan --interface=eth0 --localnet',
    '> Scanning network... [████████░░] 75%',
    '$ grep -r "intrusion" /var/log/auth',
    '> Found 12 unauthorized attempts',
    '$ iptables -A INPUT -j DROP',
    '> Blocking incoming traffic...',
    '$ tcpdump -i eth0 -w capture.pcap',
    '> Capturing packets... [███████░░░] 65%',
    '$ netstat -tulpn | grep LISTEN',
    '> Monitoring connections...',
    '$ fail2ban-client status',
    '> Status enabled - 3 jails active',
    '$ systemctl restart ssh',
    '> SSH service restarted...',
    '$ ufw enable',
    '> Firewall enabled [██████████] 100%',
  ];

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

      /* Determine if in danger mode (active presentation time) */
      const inDanger = t >= 0.15 && t <= 0.75;
      setIsDanger(inDanger);

      ctx.clearRect(0, 0, vw, vh);

      /* Draw effects layers */
      drawCodeRain(ctx, vw, vh, masterOpacity, inDanger);
      drawScanlines(ctx, vw, vh, masterOpacity, inDanger);
      drawDangerOverlay(ctx, vw, vh, masterOpacity, inDanger, elapsed);
      
      // Intense glitch during transitions
      const isTransitioning = t < 0.15 || t > 0.75;
      const glitchIntensity = isTransitioning ? 0.6 : (inDanger ? 0.25 : 0.15);
      if (Math.random() > (1 - glitchIntensity)) {
        drawGlitchBars(ctx, vw, vh, masterOpacity, elapsed);
      }
      
      /* Epic transition effects */
      drawLightBurst(ctx, vw, vh, masterOpacity, t);
      drawTransitionGlitch(ctx, vw, vh, masterOpacity, t);
      drawMatrixDissolution(ctx, vw, vh, masterOpacity, t);
      
      /* Danger warning text */
      drawDangerWarnings(ctx, vw, vh, masterOpacity, inDanger);

      if (t < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        running = false;
        codeRainList.length = 0;
        warningTexts.length = 0;
        ctx.clearRect(0, 0, vw, vh);
        setIsVisible(false);
        setOpacity(0);
        setIsDanger(false);
      }
    };

    const show = () => {
      if (running) return;   // don't interrupt current appearance
      running   = true;
      startTime = performance.now();
      codeRainList.length = 0;
      warningTexts.length = 0;
      setIsVisible(true);
      setTerminalLines(['$ /root/security/defense.sh']);
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

  /* Terminal command simulation — always running */
  useEffect(() => {
    const timer = setTimeout(() => {
      const commandPool = isDanger ? DEFENSE_COMMANDS : MONITORING_COMMANDS;
      const randomCommand = commandPool[Math.floor(Math.random() * commandPool.length)];
      const delay = isDanger ? (600 + Math.random() * 1000) : (1200 + Math.random() * 1800);
      
      setTerminalLines(prev => {
        const newLines = [...prev, randomCommand];
        return newLines.length > 8 ? newLines.slice(-8) : newLines;
      });
      
      // Schedule next command
      return delay;
    }, isDanger ? (600 + Math.random() * 1000) : (1200 + Math.random() * 1800));

    return () => clearTimeout(timer);
  }, [terminalLines, isDanger]);

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

      {/* Defense Terminal — Always Visible */}
      <div
        style={{
          position:      'fixed',
          top:           '20px',
          left:          '20px',
          width:         '380px',
          maxHeight:     '240px',
          zIndex:        3,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background:    'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,20,10,0.92) 100%)',
            border:        isDanger ? '2px solid #ff3333' : '2px solid #00ff00',
            borderRadius:  '4px',
            padding:       '12px 14px',
            fontFamily:    '"Courier New", monospace',
            fontSize:      '11px',
            lineHeight:    '1.6',
            color:         isDanger ? '#ff6666' : '#00ff00',
            boxShadow:     isDanger 
              ? '0 0 20px rgba(255,50,50,0.8), inset 0 0 10px rgba(255,50,50,0.2)' 
              : '0 0 20px rgba(0,255,0,0.6), inset 0 0 10px rgba(0,255,0,0.1)',
            overflow:      'hidden',
            textShadow:    isDanger 
              ? '0 0 5px rgba(255,100,100,0.8)' 
              : '0 0 5px rgba(0,255,0,0.8)',
            transition:    'all 500ms ease-out',
          }}
        >
          {/* Terminal header */}
          <div
            style={{
              marginBottom:  '8px',
              borderBottom:  isDanger ? '1px solid rgba(255,100,100,0.5)' : '1px solid rgba(0,255,0,0.3)',
              paddingBottom: '6px',
              display:       'flex',
              justifyContent: 'space-between',
              alignItems:    'center',
            }}
          >
            <span style={{ fontSize: '10px', opacity: 0.7 }}>root@nexus ~ #</span>
            <span style={{ 
              fontSize: '9px', 
              opacity: 0.8, 
              color: isDanger ? '#ff3333' : '#00ff00',
              fontWeight: 'bold',
            }}>
              {isDanger ? '● INTRUSION!' : '● MONITORING'}
            </span>
          </div>

          {/* Terminal content */}
          <div
            style={{
              maxHeight:   '190px',
              overflow:    'hidden',
              whiteSpace:  'pre-wrap',
              wordBreak:   'break-all',
            }}
          >
            {terminalLines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom:  '2px',
                  color:         isDanger 
                    ? (line.includes('ERROR') ? '#ff3333' : line.includes('100%') ? '#ff6666' : '#ff8888')
                    : (line.includes('ERROR') ? '#ff6666' : line.includes('100%') ? '#00ff00' : '#00dd00'),
                  textShadow:    isDanger
                    ? (line.includes('ERROR') ? '0 0 8px rgba(255,50,50,0.9)' : '0 0 5px rgba(255,100,100,0.7)')
                    : (line.includes('ERROR') ? '0 0 8px rgba(255,100,100,0.8)' : '0 0 5px rgba(0,255,0,0.6)'),
                  animation:     idx === terminalLines.length - 1 ? 'blink 1s infinite' : 'none',
                }}
              >
                {line}
              </div>
            ))}
            
            {/* Cursor */}
            <div
              style={{
                display:     'inline-block',
                width:       '8px',
                height:      '13px',
                background:  isDanger ? '#ff3333' : '#00ff00',
                marginLeft:  '2px',
                animation:   'blink 1s infinite',
                boxShadow:   isDanger ? '0 0 8px rgba(255,50,50,0.8)' : '0 0 8px rgba(0,255,0,0.8)',
              }}
            />
          </div>

          {/* Terminal glow effect */}
          <div
            style={{
              position:      'absolute',
              inset:         '-8px',
              borderRadius:  '4px',
              background:    isDanger 
                ? 'radial-gradient(ellipse at center, rgba(255,50,50,0.2) 0%, rgba(255,50,50,0) 70%)'
                : 'radial-gradient(ellipse at center, rgba(0,255,0,0.2) 0%, rgba(0,255,0,0) 70%)',
              pointerEvents: 'none',
              zIndex:        -1,
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}
