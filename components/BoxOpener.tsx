'use client';

import { useState, useEffect, useRef } from 'react';
import { BoxItem, RARITY_CONFIG } from '@/types';
import BoxCard from './BoxCard';
import Image from 'next/image';
import confetti from 'canvas-confetti';

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
    items,
    listName,
    listDescription,
    totalOpensCount = 0,
    persistedDrawnIds,
    persistedHistory,
    removeItemsFromList = true,
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
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: NodeJS.Timeout = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        } else if (rarity === 'muy-valioso') {
            const count = 200;
            const defaults = { origin: { y: 0.7 }, colors: ['#ec4899', '#f472b6', '#ffffff'] };
            function fire(particleRatio: number, opts: any) {
                confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
            }
            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        } else if (rarity === 'valioso') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#a78bfa', '#ffffff'] });
        } else if (rarity === 'medio') {
            confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 }, colors: ['#3b82f6', '#60a5fa'] });
        }
    };

    const drawnIdsSet = new Set(persistedDrawnIds);
    const availableItems = removeItemsFromList
        ? items.filter(item => !drawnIdsSet.has(item.id))
        : items;
    const CARD_WIDTH = 200;
    const CARD_GAP = 16;
    const WINNER_INDEX = 45;
    const TOTAL_ITEMS = 60;

    const openBox = () => {
        if (availableItems.length === 0 || isOpening) return;

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
            const newDrawnIds = removeItemsFromList
                ? [...persistedDrawnIds, selectedItem.id]
                : persistedDrawnIds;
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
    const translateTarget = isSpinning ? `-${offset}px` : '0px';

    if (items.length === 0) {
        return (
            <div className="glass-panel p-12 text-center rounded-2xl">
                <span className="material-icons-outlined text-6xl mb-4 opacity-30">inventory_2</span>
                <h3 className="text-xl font-display font-bold text-gray-400 mb-2">No hay cajas disponibles</h3>
                <p className="text-gray-500">Agrega algunas cajas para poder abrirlas</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full animate-in fade-in duration-700">
            <div className="w-full flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-10 w-full relative">
                    <div className="absolute right-0 top-0 flex items-center gap-2">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-3 glass-panel rounded-xl text-gray-400 hover:text-white transition-all"
                            title={isMuted ? "Activar Sonido" : "Silenciar"}
                        >
                            <span className="material-icons-outlined">{isMuted ? 'volume_off' : 'volume_up'}</span>
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-3 glass-panel rounded-xl text-gray-400 hover:text-white transition-all"
                            title="Reiniciar Juego"
                        >
                            <span className="material-icons-outlined">replay</span>
                        </button>
                    </div>

                    <p className="text-primary font-bold tracking-[0.2em] text-xs mb-3 uppercase font-display">
                        {isOpening ? "Abriendo..." : "Listo para abrir"}
                    </p>
                    <h2 className="text-5xl md:text-6xl font-display font-bold mb-4 text-white text-glow">
                        {listName}
                    </h2>
                    <p className="max-w-xl mx-auto text-gray-400 text-lg italic opacity-80 leading-relaxed">
                        {listDescription || `Consigue objetos legendarios. ¡Buena suerte!`}
                    </p>
                </div>

                {/* Roulette Area */}
                <div className="w-full relative mb-12">
                    {/* Selector indicator */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                        <div className="w-[210px] h-[310px] border-2 border-primary rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.4)] relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full shadow-lg">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">EXTRACTOR</span>
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary p-1.5 rounded-full shadow-lg transform rotate-180">
                                <span className="material-icons-outlined text-white text-xs">navigation</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-[420px] flex items-center justify-center overflow-hidden bg-gray-950 border border-white/5 rounded-3xl group">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-gray-950 z-10 pointer-events-none" />
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#a855f7 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

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
                                            className="relative shrink-0 bg-surface-dark/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300"
                                            style={{
                                                width: `${CARD_WIDTH}px`,
                                                height: `${CARD_WIDTH + 100}px`,
                                                boxShadow: isCenter && !isSpinning ? `0 0 50px ${rarity.color}80` : undefined,
                                                borderColor: isCenter && !isSpinning ? rarity.color : 'rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            <div
                                                className="absolute inset-x-0 bottom-0 h-1/2 opacity-10"
                                                style={{ background: `linear-gradient(to top, ${rarity.color}, transparent)` }}
                                            />

                                            {item.identifierType === 'imagen' && item.imageUrl ? (
                                                <div className="relative w-28 h-28 mb-4 z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                    <Image src={item.imageUrl} alt="item" fill className="object-contain" />
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-white/5 rounded-2xl mb-4 z-10 border border-white/5">
                                                    <span className="text-5xl font-display font-black text-glow" style={{ color: rarity.color }}>
                                                        {item.identifier}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-center z-10 px-2">
                                                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wider line-clamp-1">
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
                            <div className="relative z-30 animate-in zoom-in-75 duration-500 scale-125">
                                <BoxCard item={result} isResult={true} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 gap-4 opacity-50 hover:opacity-100 transition-opacity">
                                <div className="p-10 rounded-full bg-white/5 border border-white/10 animate-pulse">
                                    <span className="material-icons-outlined text-6xl text-primary">deployed_code</span>
                                </div>
                                <span className="text-xl font-display font-bold tracking-widest uppercase">Listo para iniciar</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Area */}
                <div className="w-full flex flex-col items-center">
                    {!isGameOver ? (
                        <div className="relative group w-full max-w-sm mb-12">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <button
                                onClick={openBox}
                                disabled={isOpening}
                                className="relative w-full btn-neon bg-background-dark border border-primary/50 hover:border-primary text-white py-6 rounded-2xl text-xl font-display font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50"
                            >
                                {isOpening ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        GIRANDO...
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-2xl">auto_awesome</span>
                                        ABRIR CAJA
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4 mb-12">
                            <h3 className="text-accent font-display font-bold text-2xl mb-4 uppercase tracking-widest italic animate-pulse">Inventario Agotado</h3>
                            <button onClick={handleReset} className="btn-neon bg-white/5 hover:bg-white/10 border border-white/20 px-10 py-4 text-sm font-bold tracking-widest rounded-xl uppercase">REABASTECER CAJA</button>
                        </div>
                    )}

                    {/* Stats Footer */}
                    <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-white/5">
                        <div className="glass-panel p-4 rounded-xl text-center">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Aperturas Totales</p>
                            <p className="text-2xl font-display font-bold text-white">{totalOpensCount.toLocaleString()}</p>
                        </div>
                        <div className="glass-panel p-4 rounded-xl text-center">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Objetos Disponibles</p>
                            <p className="text-2xl font-display font-bold text-secondary">{availableItems.length}</p>
                        </div>
                        <div className="glass-panel p-4 rounded-xl text-center">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Objetos Restantes</p>
                            <p className="text-2xl font-display font-bold text-primary">{availableItems.length} / {items.length}</p>
                        </div>
                        <div className="glass-panel p-4 rounded-xl text-center">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Modo Retirada</p>
                            <p className="text-2xl font-display font-bold text-accent">{removeItemsFromList ? 'ACTIVO' : 'INACTIVO'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History */}
            {persistedHistory.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                    <h3 className="text-xl font-display font-bold mb-6 text-white text-glow flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">history</span>
                        Historial de Aperturas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {persistedHistory.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="scale-90 opacity-70 hover:opacity-100 hover:scale-100 transition-all">
                                <BoxCard item={item} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

