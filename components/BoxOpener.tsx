'use client';

import { useState, useEffect, useRef } from 'react';
import { BoxItem, RARITY_CONFIG } from '@/types';
import BoxCard from './BoxCard';
import { Package, Sparkles, RotateCcw, Triangle, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';

interface BoxOpenerProps {
    items: BoxItem[];
    listName: string;
    persistedDrawnIds: string[];
    persistedHistory: BoxItem[];
    onUpdateState: (drawnItemIds: string[], history: BoxItem[]) => void;
    onResetState: () => void;
}

export default function BoxOpener({
    items,
    listName,
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
    const CARD_WIDTH = 180; // px
    const CARD_GAP = 16; // px
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
        <div className="space-y-8">
            <div className="glass-card p-1 relative overflow-hidden">
                {/* Header */}
                <div className="text-center p-6 relative z-10">
                    <div className="absolute right-6 top-6 flex items-center gap-2">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title={isMuted ? "Activar Sonido" : "Silenciar"}
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Reiniciar Juego"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>

                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {listName}
                    </h2>
                    <p className="text-gray-400">
                        {availableItems.length} restantes / {items.length} total
                    </p>
                </div>

                {/* CS:GO Roulette Area */}
                <div className="relative h-64 bg-black/40 border-y border-indigo-500/30 overflow-hidden mb-8">
                    {/* Background Grid/Effect */}
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at center, #6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />

                    {/* Center Marker Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-amber-400 z-30 shadow-[0_0_10px_rgba(251,191,36,0.8)]">
                        <div className="absolute top-0 -translate-x-1/2 text-amber-400 fill-current">
                            <Triangle className="rotate-180" size={24} fill="currentColor" />
                        </div>
                        <div className="absolute bottom-0 -translate-x-1/2 text-amber-400 fill-current">
                            <Triangle size={24} fill="currentColor" />
                        </div>
                    </div>

                    {/* Roulette Track */}
                    {isOpening ? (
                        <div
                            className="absolute top-1/2 -translate-y-1/2 flex items-center will-change-transform"
                            style={{
                                left: '50%', // Start at center
                                transform: `translateX(${translateTarget})`,
                                transition: isSpinning ? 'transform 6s cubic-bezier(0.1, 0.9, 0.2, 1)' : 'none',
                                gap: `${CARD_GAP}px`,
                            }}
                        >
                            {rouletteItems.map((item, idx) => {
                                const rarity = RARITY_CONFIG[item.rarity];
                                return (
                                    <div
                                        key={idx}
                                        className="relative shrink-0 bg-gray-900 border-2 rounded-lg flex flex-col items-center justify-center overflow-hidden"
                                        style={{
                                            width: `${CARD_WIDTH}px`,
                                            height: `${CARD_WIDTH}px`,
                                            borderColor: rarity.color,
                                            boxShadow: idx === WINNER_INDEX && !isSpinning
                                                ? `0 0 20px ${rarity.glowColor}`
                                                : undefined
                                        }}
                                    >
                                        <div
                                            className="absolute inset-x-0 bottom-0 h-1/2 opacity-20"
                                            style={{ background: `linear-gradient(to top, ${rarity.color}, transparent)` }}
                                        />

                                        {item.identifierType === 'imagen' && item.imageUrl ? (
                                            <div className="relative w-24 h-24 mb-2 z-10">
                                                <Image src={item.imageUrl} alt="item" fill className="object-contain" />
                                            </div>
                                        ) : (
                                            <span
                                                className="text-4xl font-bold z-10"
                                                style={{ color: rarity.color }}
                                            >
                                                {item.identifier}
                                            </span>
                                        )}

                                        <span className="text-xs text-gray-400 z-10 uppercase tracking-wider font-semibold mt-2">
                                            {rarity.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : result ? (
                        /* Winner Display Static */
                        <div className="flex items-center justify-center h-full">
                            <div className="scale-125">
                                <BoxCard item={result} isResult={true} />
                            </div>
                        </div>
                    ) : (
                        /* Idle State */
                        <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                            <Package size={24} />
                            <span>Presiona Abrir</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-6">
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-gray-700 rounded-full mb-6 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${(persistedDrawnIds.length / items.length) * 100}%` }}
                        />
                    </div>

                    {/* Open Button */}
                    {!isGameOver && (
                        <button
                            onClick={openBox}
                            disabled={isOpening}
                            className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            {isOpening ? (
                                <span className="animate-pulse">Girando...</span>
                            ) : (
                                <>
                                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <Package size={24} />
                                    Abrir Caja ({availableItems.length})
                                </>
                            )}
                        </button>
                    )}

                    {isGameOver && (
                        <div className="text-center">
                            <p className="text-amber-400 font-bold text-xl mb-4">¡Juego Terminado!</p>
                            <button onClick={handleReset} className="btn-secondary">Reiniciar Todo</button>
                        </div>
                    )}
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

