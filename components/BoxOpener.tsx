'use client';

import { useState, useEffect, useRef } from 'react';
import { BoxItem, RARITY_CONFIG } from '@/types';
import BoxCard from './BoxCard';
import { Package, Sparkles, RotateCcw, Triangle, Volume2, VolumeX, User, Calendar } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';

interface BoxOpenerProps {
    items: BoxItem[];
    listName: string;
    listDescription?: string;
    totalOpensCount?: number;
    persistedDrawnIds: string[];
    persistedHistory: BoxItem[];
    onUpdateState: (drawnItemIds: string[], history: BoxItem[]) => void;
    onResetState: () => void;
}

export default function BoxOpener({
    items,
    listName,
    listDescription,
    totalOpensCount = 0,
    persistedDrawnIds,
    persistedHistory,
    onUpdateState,
    onResetState
}: BoxOpenerProps) {
    const [isOpening, setIsOpening] = useState(false);
    const [result, setResult] = useState<BoxItem | null>(null);

    // Roulette State
    const [rouletteItems, setRouletteItems] = useState<BoxItem[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);

    // Audio State
    const [isMuted, setIsMuted] = useState(false);
    const tickAudios = useRef<HTMLAudioElement[]>([]);
    const nextTick = useRef(0);
    const revealAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setResult(null);
        setRouletteItems([]);

        // Preload sounds
        const pool = [];
        for (let i = 0; i < 5; i++) {
            const a = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
            a.volume = 0.6;
            pool.push(a);
        }
        tickAudios.current = pool;

        revealAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        revealAudioRef.current.volume = 0.5;
    }, [listName]);

    const playTick = () => {
        if (isMuted || tickAudios.current.length === 0) return;
        const sound = tickAudios.current[nextTick.current];
        sound.currentTime = 0;
        sound.play().catch(() => { });
        nextTick.current = (nextTick.current + 1) % tickAudios.current.length;
    };

    const playReveal = () => {
        if (isMuted || !revealAudioRef.current) return;
        revealAudioRef.current.currentTime = 0;
        revealAudioRef.current.play().catch(() => { });
    };

    const triggerRarityEffect = (item: BoxItem) => {
        const rarity = item.rarity;

        if (rarity === 'legendario') {
            // Fireworks effect
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: NodeJS.Timeout = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        } else if (rarity === 'muy-valioso') {
            // Side bursts
            const count = 200;
            const defaults = {
                origin: { y: 0.7 },
                colors: ['#ec4899', '#f472b6', '#ffffff']
            };

            function fire(particleRatio: number, opts: any) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio)
                });
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        } else if (rarity === 'valioso') {
            // Purple "pop"
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b5cf6', '#a78bfa', '#ffffff']
            });
        } else if (rarity === 'medio') {
            // Subtle blue pop
            confetti({
                particleCount: 50,
                spread: 50,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#60a5fa']
            });
        }
    };

    const drawnIdsSet = new Set(persistedDrawnIds);
    const availableItems = items.filter(item => !drawnIdsSet.has(item.id));
    const CARD_WIDTH = 200; // Updated for premium look
    const CARD_GAP = 16;
    const WINNER_INDEX = 45; // Fixed winner index
    const TOTAL_ITEMS = 60;

    const openBox = () => {
        if (availableItems.length === 0 || isOpening) return;

        // "Unlock" sounds for browsers by playing once silently
        tickAudios.current.forEach(a => {
            a.play().then(() => {
                a.pause();
                a.currentTime = 0;
            }).catch(() => { });
        });

        setIsOpening(true);
        setResult(null);
        setIsSpinning(false);

        const selectedItem = selectRandomItem(availableItems);

        const tape: BoxItem[] = [];
        for (let i = 0; i < TOTAL_ITEMS; i++) {
            if (i === WINNER_INDEX) {
                tape.push(selectedItem);
            } else {
                const randomFiller = availableItems[Math.floor(Math.random() * availableItems.length)];
                tape.push(randomFiller);
            }
        }
        setRouletteItems(tape);

        setTimeout(() => {
            setIsSpinning(true);

            // Start sound synchronization
            let lastTickIndex = -1;
            const startTime = Date.now();
            const duration = 6000;
            const itemFullWidth = CARD_WIDTH + CARD_GAP;
            const targetOffset = (WINNER_INDEX * itemFullWidth) + (CARD_WIDTH / 2);

            const tickLoop = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const t = Math.min(elapsed / duration, 1);

                if (t < 1) {
                    // Quartic ease-out to match cubic-bezier(0.1, 0.9, 0.2, 1) accurately
                    const progress = 1 - Math.pow(1 - t, 4);
                    const currentPos = progress * targetOffset;
                    const currentIndex = Math.floor(currentPos / itemFullWidth);

                    if (currentIndex > lastTickIndex) {
                        playTick();
                        lastTickIndex = currentIndex;
                    }
                    requestAnimationFrame(tickLoop);
                }
            };

            requestAnimationFrame(tickLoop);
        }, 50);

        setTimeout(() => {
            const newDrawnIds = [...persistedDrawnIds, selectedItem.id];
            const newHistory = [selectedItem, ...persistedHistory].slice(0, 10);

            setResult(selectedItem);
            onUpdateState(newDrawnIds, newHistory);
            setIsOpening(false);
            setIsSpinning(false);
            playReveal();
            triggerRarityEffect(selectedItem);
        }, 6500);
    };

    const selectRandomItem = (pool: BoxItem[]): BoxItem => {
        const totalPercentage = pool.reduce((sum, item) => sum + item.percentage, 0);
        let random = Math.random() * totalPercentage;
        for (const item of pool) {
            random -= item.percentage;
            if (random <= 0) return item;
        }
        return pool[0];
    };

    const handleReset = () => {
        if (confirm('¿Reiniciar el juego? Se restaurarán todas las cajas.')) {
            onResetState();
            setResult(null);
        }
    };

    const isGameOver = availableItems.length === 0;

    const offset = (WINNER_INDEX * (CARD_WIDTH + CARD_GAP)) + (CARD_WIDTH / 2);
    const translateTarget = isSpinning
        ? `-${offset}px`
        : '0px';

    const history = persistedHistory;

    if (items.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <Package className="mx-auto mb-4 text-gray-500" size={64} />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay cajas disponibles</h3>
                <p className="text-gray-500">Agrega algunas cajas para poder abrirlas</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 w-full">
            <div className="w-full flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-10 w-full relative">
                    <div className="absolute right-0 top-0 flex items-center gap-2">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-3 glass-card text-gray-400 hover:text-white transition-all rounded-xl"
                            title={isMuted ? "Activar Sonido" : "Silenciar"}
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-3 glass-card text-gray-400 hover:text-white transition-all rounded-xl"
                            title="Reiniciar Juego"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>

                    <p className="text-indigo-500 font-bold tracking-[0.2em] text-xs mb-3 uppercase">
                        {isOpening ? "Abriendo..." : "Listo para abrir"}
                    </p>
                    <h2 className="text-5xl md:text-6xl font-black mb-4 text-white tracking-tight">
                        {listName}
                    </h2>
                    <p className="max-w-xl mx-auto text-gray-400 text-lg leading-relaxed">
                        {listDescription || `Consigue objetos legendarios. ¡Buena suerte!`}
                    </p>
                </div>

                {/* Main Opening Area */}
                <div className="w-full relative mb-12">
                    {/* Focus Area Highlight (Static Background layer) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                        <div className="w-[210px] h-[300px] border-2 border-indigo-500 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.4)] relative">
                            {/* Focus Label */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Área de Enfoque</span>
                            </div>

                            {/* Bottom indicator icon */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 p-2 rounded-full shadow-lg border border-indigo-400">
                                <Triangle className="text-white" size={12} fill="currentColor" />
                            </div>
                        </div>
                    </div>

                    {/* Roulette Overflow Container */}
                    <div className="relative h-[400px] flex items-center justify-center overflow-hidden bg-[#0a0a0c] border border-white/5 rounded-3xl">
                        {/* Shimmer/Overlay effects */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-[#0a0a0c] z-10 pointer-events-none" />

                        {/* Grids/Glows */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                        {/* Roulette Track */}
                        {isOpening ? (
                            <div
                                className="absolute top-1/2 -translate-y-1/2 flex items-center will-change-transform z-0"
                                style={{
                                    left: '50%',
                                    transform: `translateX(${translateTarget})`,
                                    transition: isSpinning ? 'transform 6s cubic-bezier(0.1, 0.9, 0.2, 1)' : 'none',
                                    gap: `${CARD_GAP}px`,
                                }}
                            >
                                {rouletteItems.map((item, idx) => {
                                    const rarity = RARITY_CONFIG[item.rarity];
                                    const isCenter = idx === WINNER_INDEX;
                                    return (
                                        <div
                                            key={idx}
                                            className="relative shrink-0 bg-gray-950/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300"
                                            style={{
                                                width: `${CARD_WIDTH}px`,
                                                height: `${CARD_WIDTH + 100}px`,
                                                boxShadow: isCenter && !isSpinning ? `0 0 50px ${rarity.glowColor}` : undefined,
                                                borderColor: isCenter && !isSpinning ? rarity.color : 'rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            <div
                                                className="absolute inset-x-0 bottom-0 h-1/2 opacity-20"
                                                style={{ background: `linear-gradient(to top, ${rarity.color}, transparent)` }}
                                            />

                                            {item.identifierType === 'imagen' && item.imageUrl ? (
                                                <div className="relative w-28 h-28 mb-4 z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                    <Image src={item.imageUrl} alt="item" fill className="object-contain" />
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-gradient-to-br from-white/10 to-transparent rounded-2xl mb-4 z-10 border border-white/5 animate-float">
                                                    <span className="text-5xl font-black" style={{ color: rarity.color }}>
                                                        {item.identifier}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-center z-10">
                                                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wide">
                                                    {item.identifierType === 'imagen' ? item.identifier : `Objeto ${item.identifier}`}
                                                </h4>
                                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: rarity.color }}>
                                                    {rarity.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : result ? (
                            /* Winner Display Static - High visibility */
                            <div className="relative z-30 flex items-center justify-center animate-in zoom-in-75 duration-500">
                                <BoxCard item={result} isResult={true} />
                            </div>
                        ) : (
                            /* Idle State */
                            <div className="flex flex-col items-center justify-center text-gray-500 gap-4">
                                <div className="p-8 rounded-full bg-white/5 border border-white/10 animate-bounce">
                                    <Package size={48} className="text-indigo-400" />
                                </div>
                                <span className="text-xl font-bold tracking-widest uppercase">Listo para abrir</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Panel */}
                <div className="w-full flex flex-col items-center">
                    {/* Main Open Button */}
                    {!isGameOver && (
                        <div className="relative group w-full max-w-sm mb-8">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <button
                                onClick={openBox}
                                disabled={isOpening}
                                className="relative w-full bg-[#5849ff] hover:bg-[#4a3cf0] text-white py-6 rounded-2xl text-xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl"
                            >
                                {isOpening ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        GIRANDO...
                                    </div>
                                ) : (
                                    <>
                                        <Sparkles size={24} />
                                        ABRIR CAJA
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {isGameOver && (
                        <div className="text-center py-4 mb-8">
                            <h3 className="text-red-400 font-black text-2xl mb-4 uppercase tracking-widest italic animate-pulse">Inventario Agotado</h3>
                            <button onClick={handleReset} className="btn-secondary px-10 py-4 text-sm font-bold tracking-widest">REABASTECER CAJA</button>
                        </div>
                    )}

                    {/* Rarity Legend */}
                    <div className="flex flex-wrap justify-center gap-6 mb-12">
                        {Object.entries(RARITY_CONFIG).reverse().map(([key, config]) => (
                            <div key={key} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: config.color, color: config.color }} />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {config.label} <span className="text-gray-500 ml-1 opacity-50">{config.defaultPercentage}%</span>
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Footer Stats Row */}
                    <div className="w-full flex justify-between items-end border-t border-white/5 pt-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Aperturas Totales</p>
                            <p className="text-3xl font-black text-white">{totalOpensCount.toLocaleString()}</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="p-3 glass-card rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer">
                                <User size={20} />
                            </div>
                            <div className="p-3 glass-card rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer">
                                <Calendar size={20} />
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Objetos Restantes</p>
                            <p className="text-3xl font-black text-indigo-400 tracking-tighter">
                                {availableItems.length}<span className="text-gray-600 text-lg ml-1">/ {items.length}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History */}
            {history.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-400" />
                        Historial
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {history.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="scale-90 opacity-80 hover:opacity-100 hover:scale-100 transition-all">
                                <BoxCard item={item} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

