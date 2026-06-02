'use client';

import { useState, useEffect, useRef } from 'react';
import { BoxItem, RARITY_CONFIG } from '@/types';
import BoxCard from './BoxCard';
import HudPanel from './HudPanel';
import Image from 'next/image';
import { triggerOsEffect } from '@/utils/osEffect';

interface BoxOpenerProps {
  items: BoxItem[];
  listName: string;
  listDescription?: string;
  totalOpensCount?: number;
  persistedDrawnIds: string[];
  persistedHistory: BoxItem[];
  removeItemsFromList?: boolean;
  onUpdateState: (drawnItemIds: string[], history: BoxItem[]) => void;
  onResetState: () => void;
}

export default function BoxOpener({
  items, listName, listDescription, totalOpensCount = 0,
  persistedDrawnIds, persistedHistory, removeItemsFromList = true,
  onUpdateState, onResetState,
}: BoxOpenerProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<BoxItem | null>(null);
  const [rouletteItems, setRouletteItems] = useState<BoxItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const tickAudios = useRef<HTMLAudioElement[]>([]);
  const nextTick = useRef(0);
  const revealAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setResult(null); setRouletteItems([]);
    const pool: HTMLAudioElement[] = [];
    for (let i = 0; i < 5; i++) {
      const a = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      a.volume = 0.6; pool.push(a);
    }
    tickAudios.current = pool;
    revealAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    if (revealAudioRef.current) revealAudioRef.current.volume = 0.5;
  }, [listName]);

  const playTick = () => {
    if (isMuted || !tickAudios.current.length) return;
    const s = tickAudios.current[nextTick.current];
    s.currentTime = 0; s.play().catch(() => {});
    nextTick.current = (nextTick.current + 1) % tickAudios.current.length;
  };

  const playReveal = () => {
    if (isMuted || !revealAudioRef.current) return;
    revealAudioRef.current.currentTime = 0;
    revealAudioRef.current.play().catch(() => {});
  };

  const resultCardRef = useRef<HTMLDivElement>(null);

  const triggerRarityEffect = (item: BoxItem) => {
    triggerOsEffect(item.rarity, resultCardRef.current);
  };

  const drawnSet = new Set(persistedDrawnIds);
  const availableItems = removeItemsFromList ? items.filter(i => !drawnSet.has(i.id)) : items;
  const CARD_W = 200, CARD_GAP = 16, WINNER_IDX = 45, TOTAL = 60;

  const openBox = () => {
    if (!availableItems.length || isOpening) return;
    tickAudios.current.forEach(a => a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {}));
    setIsOpening(true); setResult(null); setIsSpinning(false);
    const selected = selectRandom(availableItems);
    const tape: BoxItem[] = Array.from({ length: TOTAL }, (_, i) =>
      i === WINNER_IDX ? selected : availableItems[Math.floor(Math.random() * availableItems.length)]
    );
    setRouletteItems(tape);
    setTimeout(() => {
      setIsSpinning(true);
      let lastIdx = -1; const t0 = Date.now(), dur = 6000;
      const fw = CARD_W + CARD_GAP;
      const target = WINNER_IDX * fw + CARD_W / 2;
      const loop = () => {
        const el = (Date.now() - t0) / dur;
        if (el < 1) {
          const pos = (1 - Math.pow(1 - el, 4)) * target;
          const idx = Math.floor(pos / fw);
          if (idx > lastIdx) { playTick(); lastIdx = idx; }
          requestAnimationFrame(loop);
        }
      };
      requestAnimationFrame(loop);
    }, 50);
    setTimeout(() => {
      const newIds = removeItemsFromList ? [...persistedDrawnIds, selected.id] : persistedDrawnIds;
      const newHist = [selected, ...persistedHistory].slice(0, 10);
      setResult(selected); onUpdateState(newIds, newHist);
      setIsOpening(false); setIsSpinning(false); playReveal(); triggerRarityEffect(selected);
    }, 6500);
  };

  const selectRandom = (pool: BoxItem[]): BoxItem => {
    const total = pool.reduce((s, i) => s + i.percentage, 0);
    let r = Math.random() * total;
    for (const item of pool) { r -= item.percentage; if (r <= 0) return item; }
    return pool[0];
  };

  const handleReset = () => {
    if (confirm('¿Reiniciar el juego? Se restaurarán todas las cajas.')) { onResetState(); setResult(null); }
  };

  const isGameOver = !availableItems.length;
  const offset = WINNER_IDX * (CARD_W + CARD_GAP) + CARD_W / 2;
  const translateTarget = isSpinning ? `-${offset}px` : '0px';
  const drawnPct = items.length > 0 ? Math.round((persistedDrawnIds.length / items.length) * 100) : 0;

  if (items.length === 0) {
    return (
      <HudPanel className="p-16 text-center" label="EXTRACTOR" accentColor="#a855f7">
        <div className="flex flex-col items-center gap-4">
          <div className="p-6 rounded-2xl border border-dashed border-gray-800 bg-black/20">
            <span className="material-icons-outlined text-5xl text-gray-800">inventory_2</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-gray-500 text-lg mb-1">Sin contenido</h3>
            <p className="text-[10px] font-mono text-gray-700 tracking-widest uppercase">Agrega cajas en el modo CREAR</p>
          </div>
        </div>
      </HudPanel>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-700">
      {/* ── Header ──────────────────────────────────────────────── */}
      <HudPanel className="p-6" label="EXTRACTOR NEXUS" tag={`ID-${listName.slice(0,6).toUpperCase()}`} accentColor="#a855f7" scanLine>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-[9px] font-mono tracking-[0.3em] text-primary/50 mb-2 uppercase flex items-center gap-2">
              <span className="animate-data-blink">●</span>
              {isOpening ? 'EXTRAYENDO OBJETO...' : isGameOver ? 'INVENTARIO AGOTADO' : 'SISTEMA LISTO'}
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-1" style={{ textShadow: '0 0 30px rgba(168,85,247,0.3)' }}>
              {listName}
            </h2>
            <p className="text-gray-600 text-sm italic">{listDescription || 'Consigue objetos épicos. ¡Buena suerte!'}</p>

            {/* Extraction progress */}
            {removeItemsFromList && items.length > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 max-w-[200px] h-1 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${drawnPct}%`, background: 'linear-gradient(90deg,#a855f7,#06b6d4)', boxShadow: '0 0 8px rgba(168,85,247,0.5)' }} />
                </div>
                <span className="text-[9px] font-mono text-gray-600 tracking-widest">{drawnPct}% extraído</span>
              </div>
            )}
          </div>
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 rounded-xl border border-white/8 text-gray-600 hover:text-white hover:border-primary/30 transition-all" title={isMuted ? 'Activar sonido' : 'Silenciar'}>
              <span className="material-icons-outlined text-lg">{isMuted ? 'volume_off' : 'volume_up'}</span>
            </button>
            <button onClick={handleReset}
              className="p-2.5 rounded-xl border border-white/8 text-gray-600 hover:text-white hover:border-red-500/30 transition-all" title="Reiniciar">
              <span className="material-icons-outlined text-lg">replay</span>
            </button>
          </div>
        </div>
      </HudPanel>

      {/* ── Roulette ─────────────────────────────────────────────── */}
      <div className="w-full relative">
        {/* Extractor frame */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="relative" style={{ width: 216, height: 316 }}>
            {/* HUD corners on extractor */}
            {[
              { style: { top: 0, left: 0, borderWidth: '2px 0 0 2px', borderRadius: '8px 0 0 0' } },
              { style: { top: 0, right: 0, borderWidth: '2px 2px 0 0', borderRadius: '0 8px 0 0' } },
              { style: { bottom: 0, left: 0, borderWidth: '0 0 2px 2px', borderRadius: '0 0 0 8px' } },
              { style: { bottom: 0, right: 0, borderWidth: '0 2px 2px 0', borderRadius: '0 0 8px 0' } },
            ].map((c, i) => (
              <span key={i} className="absolute w-5 h-5 pointer-events-none"
                style={{ ...c.style, borderColor: '#a855f7', borderStyle: 'solid', boxShadow: '0 0 12px rgba(168,85,247,0.6)' }} />
            ))}
            {/* Top label */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full shadow-lg">
              <span className="text-[9px] font-black text-white uppercase tracking-[0.25em] font-mono whitespace-nowrap">EXTRACTOR</span>
            </div>
            {/* Bottom arrow */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 p-1.5 bg-primary rounded-full rotate-180" style={{ boxShadow: '0 0 12px rgba(168,85,247,0.6)' }}>
              <span className="material-icons-outlined text-white" style={{ fontSize: '13px' }}>navigation</span>
            </div>
            {/* Side scanning lines */}
            <div className="absolute inset-y-0 -left-8 w-[1px] opacity-30"
              style={{ background: 'linear-gradient(to bottom, transparent, #a855f7, transparent)' }} />
            <div className="absolute inset-y-0 -right-8 w-[1px] opacity-30"
              style={{ background: 'linear-gradient(to bottom, transparent, #a855f7, transparent)' }} />
          </div>
        </div>

        {/* Roulette viewport */}
        <div className="relative h-[420px] flex items-center justify-center overflow-hidden rounded-2xl border border-white/5"
          style={{ background: 'linear-gradient(145deg, #05031a 0%, #08061f 100%)' }}>

          {/* Dot grid background */}
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(rgba(168,85,247,0.2) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          {/* Side fade gradients */}
          <div className="absolute inset-0 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #05031a 0%, transparent 20%, transparent 80%, #05031a 100%)' }} />

          {/* Top/bottom subtle lines */}
          <div className="absolute top-0 inset-x-0 h-px opacity-30" style={{ background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />
          <div className="absolute bottom-0 inset-x-0 h-px opacity-30" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />

          {isOpening ? (
            <div
              className="absolute top-1/2 -translate-y-1/2 flex items-center will-change-transform z-0"
              style={{
                left: '50%',
                transform: `translateX(${translateTarget})`,
                transition: isSpinning ? 'transform 6s cubic-bezier(0.08, 0.9, 0.15, 1)' : 'none',
                gap: `${CARD_GAP}px`,
              }}
            >
              {rouletteItems.map((item, idx) => {
                const rc = RARITY_CONFIG[item.rarity];
                return (
                  <div key={idx} className="relative shrink-0 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300"
                    style={{
                      width: CARD_W, height: CARD_W + 100,
                      background: 'linear-gradient(145deg, #0f0c28 0%, #080618 100%)',
                      border: `1px solid ${rc.color}30`,
                      boxShadow: idx === WINNER_IDX && !isSpinning ? `0 0 40px ${rc.color}70` : `0 4px 20px rgba(0,0,0,0.5)`,
                    }}>
                    {/* Top bar */}
                    <div className="absolute top-0 inset-x-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${rc.color}80, transparent)` }} />
                    {/* Bottom fill */}
                    <div className="absolute bottom-0 inset-x-0 h-1/3 opacity-10"
                      style={{ background: `linear-gradient(to top, ${rc.color}, transparent)` }} />

                    {item.identifierType === 'imagen' && item.imageUrl ? (
                      <div className="relative w-28 h-28 mb-4 z-10">
                        <Image src={item.imageUrl} alt="item" fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="p-5 bg-black/30 rounded-2xl mb-4 z-10 border border-white/5">
                        <span className="text-5xl font-display font-black" style={{ color: rc.color, textShadow: `0 0 20px ${rc.color}80` }}>
                          {item.identifier}
                        </span>
                      </div>
                    )}
                    <div className="text-center z-10 px-2">
                      <span className="text-[9px] font-black uppercase tracking-widest font-mono" style={{ color: rc.color }}>{rc.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : result ? (
            <div ref={resultCardRef} className="relative z-30 animate-in zoom-in-75 duration-500">
              <BoxCard item={result} isResult />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-5 opacity-40 hover:opacity-70 transition-opacity relative z-10">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl bg-primary/20 scale-150 animate-pulse" />
                <div className="relative p-8 rounded-full bg-black/40 border border-primary/20">
                  <span className="material-icons-outlined text-5xl text-primary">deployed_code</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-gray-500 tracking-widest uppercase text-sm">Sistema Listo</p>
                <p className="text-[9px] font-mono text-gray-700 tracking-[0.3em] mt-1">PRESIONA ABRIR PARA INICIAR</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Open Button / Game Over ──────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 w-full">
        {!isGameOver ? (
          <div className="relative w-full max-w-sm group">
            {/* Glow halo */}
            <div className="absolute -inset-[1px] rounded-2xl z-0 animate-glow pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)', opacity: 0.45, filter: 'blur(8px)' }} />
            <div className="absolute -inset-[2px] rounded-2xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899, #3b82f6)', filter: 'blur(10px)' }} />
            <button onClick={openBox} disabled={isOpening}
              className="relative z-10 w-full bg-[#07051a] border border-primary/35 group-hover:border-primary/70 text-white py-5 rounded-2xl text-lg font-display font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-60 transition-all duration-300 hover:bg-[#0d0a28] overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none card-holo-sweep" />
              <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />
              {isOpening ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-[2.5px] border-white/15 border-t-primary rounded-full animate-spin" />
                  <span className="text-gray-400 tracking-widest text-base">EXTRAYENDO...</span>
                </div>
              ) : (
                <>
                  <span className="material-icons-outlined text-2xl text-primary group-hover:scale-125 transition-transform duration-300">auto_awesome</span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-white to-blue-400">ABRIR CAJA</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-4 w-full max-w-sm">
            <HudPanel className="p-8" accentColor="#ec4899" label="AGOTADO">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full border border-accent/30 bg-accent/5">
                  <span className="material-icons-outlined text-4xl text-accent">inventory_2</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-accent text-xl uppercase tracking-widest mb-1">Inventario Agotado</h3>
                  <p className="text-gray-600 text-xs font-mono tracking-widest">TODOS LOS OBJETOS FUERON EXTRAÍDOS</p>
                </div>
                <button onClick={handleReset}
                  className="w-full border border-white/10 hover:border-primary/40 text-gray-500 hover:text-white px-8 py-3 text-xs font-bold tracking-widest rounded-xl uppercase transition-all font-mono">
                  REABASTECER SISTEMA
                </button>
              </div>
            </HudPanel>
          </div>
        )}

        {!isOpening && !isGameOver && (
          <p className="text-[9px] text-gray-700 uppercase tracking-[0.25em] font-mono">
            {availableItems.length} objeto{availableItems.length !== 1 ? 's' : ''} disponible{availableItems.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Stats HUD ────────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Aperturas', icon: 'auto_awesome', value: totalOpensCount.toLocaleString(), color: '#a855f7' },
          { label: 'Disponibles', icon: 'inventory', value: availableItems.length.toString(), color: '#3b82f6' },
          { label: 'Restantes', icon: 'pie_chart', value: `${availableItems.length}/${items.length}`, color: '#a855f7' },
          { label: 'Modo', icon: 'shuffle', value: removeItemsFromList ? 'DESCUENTO' : 'INFINITO', color: removeItemsFromList ? '#22c55e' : '#ec4899', small: true },
        ].map((stat, i) => (
          <div key={i} className="relative group overflow-hidden rounded-xl border border-white/5 p-4 text-center transition-all hover:border-white/10 cursor-default"
            style={{ background: 'linear-gradient(145deg, rgba(8,6,22,0.9) 0%, rgba(5,3,15,0.95) 100%)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 50%, ${stat.color}08, transparent 70%)` }} />
            <div className="absolute top-0 inset-x-0 h-[1px]"
              style={{ background: `linear-gradient(90deg, transparent, ${stat.color}40, transparent)` }} />
            <div className="flex items-center justify-center gap-1 text-[8px] font-mono text-gray-700 uppercase tracking-[0.2em] mb-2">
              <span className="material-icons-outlined" style={{ fontSize: '9px', color: stat.color, opacity: 0.5 }}>{stat.icon}</span>
              {stat.label}
            </div>
            <div className={`font-display font-black ${stat.small ? 'text-sm' : 'text-2xl'} relative z-10 flex items-center justify-center gap-1.5`}
              style={{ color: stat.color, textShadow: `0 0 16px ${stat.color}50` }}>
              {stat.label === 'Modo' && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color, boxShadow: `0 0 6px ${stat.color}` }} />
              )}
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── History ──────────────────────────────────────────────── */}
      {persistedHistory.length > 0 && (
        <HudPanel className="p-6" label="HISTORIAL" tag={`LAST-${persistedHistory.length}`} accentColor="#3b82f6">
          <h3 className="text-lg font-display font-bold mb-5 text-white flex items-center gap-2 relative z-10">
            <span className="material-icons-outlined text-secondary text-xl">history</span>
            Historial de Aperturas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative z-10">
            {persistedHistory.map((item, i) => (
              <div key={`${item.id}-${i}`} className="opacity-60 hover:opacity-100 scale-95 hover:scale-100 transition-all duration-300">
                <BoxCard item={item} />
              </div>
            ))}
          </div>
        </HudPanel>
      )}
    </div>
  );
}
