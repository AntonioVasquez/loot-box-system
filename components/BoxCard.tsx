'use client';

import { BoxItem, RarityType, RARITY_CONFIG } from '@/types';
import Image from 'next/image';
import { useRef } from 'react';

interface BoxCardProps {
    item: BoxItem;
    onDelete?: (id: string) => void;
    showDelete?: boolean;
    isResult?: boolean;
}

// Per-rarity visual config (backgrounds, shimmer, border intensity)
const RARITY_VISUAL: Record<RarityType, {
    bgGradient: string;
    shimmer: boolean;
    legendaryPulse: boolean;
    cornerIcon: string;
}> = {
    'basico': {
        bgGradient: 'linear-gradient(145deg, #1c1a2e 0%, #131120 100%)',
        shimmer: false,
        legendaryPulse: false,
        cornerIcon: '○',
    },
    'medio': {
        bgGradient: 'linear-gradient(145deg, #0d1a2e 0%, #0a1020 100%)',
        shimmer: false,
        legendaryPulse: false,
        cornerIcon: '◇',
    },
    'valioso': {
        bgGradient: 'linear-gradient(145deg, #180d2e 0%, #100820 100%)',
        shimmer: true,
        legendaryPulse: false,
        cornerIcon: '◆',
    },
    'muy-valioso': {
        bgGradient: 'linear-gradient(145deg, #2a0d18 0%, #1a0810 100%)',
        shimmer: true,
        legendaryPulse: false,
        cornerIcon: '★',
    },
    'legendario': {
        bgGradient: 'linear-gradient(145deg, #201600 0%, #150f00 100%)',
        shimmer: true,
        legendaryPulse: true,
        cornerIcon: '⬡',
    },
};

export default function BoxCard({ item, onDelete, showDelete = false, isResult = false }: BoxCardProps) {
    const rarityConfig = RARITY_CONFIG[item.rarity];
    const visual = RARITY_VISUAL[item.rarity];
    const isImage = item.identifierType === 'imagen' && item.imageUrl;
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };

    const handleMouseLeave = () => {
        cardRef.current?.style.setProperty('--mx', '50%');
        cardRef.current?.style.setProperty('--my', '50%');
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={[
                'relative rounded-2xl overflow-hidden cursor-pointer',
                'transition-all duration-300 group select-none',
                isResult
                    ? `animate-result-float ${visual.legendaryPulse ? 'border-pulse-gold' : ''}`
                    : 'hover:-translate-y-1.5 hover:scale-[1.03]',
            ].join(' ')}
            style={{
                background: visual.bgGradient,
                border: `1px solid ${isResult ? rarityConfig.color : `${rarityConfig.color}30`}`,
                boxShadow: isResult
                    ? `0 0 32px ${rarityConfig.color}70, 0 0 64px ${rarityConfig.color}25, inset 0 0 24px ${rarityConfig.color}0a`
                    : `0 4px 28px rgba(0,0,0,0.55)`,
            }}
        >
            {/* ── Mouse-tracking spotlight ─────────────────────────────── */}
            <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-10"
                style={{
                    background: `radial-gradient(circle 90px at var(--mx, 50%) var(--my, 50%), ${rarityConfig.color}1a, transparent 70%)`,
                }}
            />

            {/* ── Holographic shimmer (valioso / muy-valioso / legendario) ── */}
            {visual.shimmer && (
                <div className="card-holo-sweep z-10" />
            )}

            {/* ── Top accent bar ───────────────────────────────────────── */}
            <div
                className="absolute top-0 inset-x-0 h-[2px] bar-shimmer z-20"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${rarityConfig.color}99 20%, ${rarityConfig.color} 50%, ${rarityConfig.color}99 80%, transparent 100%)`,
                }}
            />

            {/* ── Bottom gradient fill ─────────────────────────────────── */}
            <div
                className="absolute bottom-0 inset-x-0 h-14 pointer-events-none z-0"
                style={{
                    background: `linear-gradient(to top, ${rarityConfig.color}18, transparent)`,
                }}
            />

            {/* ── Rarity badge (top-left) ──────────────────────────────── */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
                <span
                    className="text-[7px] font-black uppercase tracking-[0.18em] px-1.5 py-[3px] rounded-md leading-none"
                    style={{
                        color: rarityConfig.color,
                        backgroundColor: `${rarityConfig.color}1a`,
                        border: `1px solid ${rarityConfig.color}35`,
                    }}
                >
                    {rarityConfig.label}
                </span>
            </div>

            {/* ── Delete button (top-right) ────────────────────────────── */}
            {showDelete && onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="absolute top-2 right-2 p-[5px] rounded-lg opacity-0 group-hover:opacity-100 transition-all z-30 hover:scale-110"
                    style={{
                        background: 'rgba(239,68,68,0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.25)',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#ef4444';
                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                    }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '13px' }}>delete</span>
                </button>
            )}

            {/* ── Main identifier ──────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center justify-center px-3 pt-8 pb-3 min-h-[130px]">
                {isImage ? (
                    <div className="relative w-14 h-14 mb-2">
                        {/* Glow bloom behind image */}
                        <div
                            className="absolute inset-0 rounded-full blur-xl opacity-25 group-hover:opacity-50 transition-opacity scale-125"
                            style={{ backgroundColor: rarityConfig.color }}
                        />
                        <Image
                            src={item.imageUrl!}
                            alt={item.identifier}
                            fill
                            className="object-contain relative z-10 drop-shadow-lg"
                        />
                    </div>
                ) : (
                    <div className="relative mb-1 flex items-center justify-center">
                        {/* Soft glow bloom */}
                        <div
                            className="absolute blur-2xl opacity-15 group-hover:opacity-35 transition-opacity scale-[2]"
                            style={{ width: '40px', height: '40px', backgroundColor: rarityConfig.color }}
                        />
                        <span
                            className="relative font-display font-black leading-none group-hover:scale-110 transition-transform duration-300 block"
                            style={{
                                fontSize: item.identifier.length > 3 ? '1.75rem' : '2.5rem',
                                color: rarityConfig.color,
                                textShadow: `0 0 18px ${rarityConfig.color}90, 0 0 36px ${rarityConfig.color}40`,
                            }}
                        >
                            {item.identifier}
                        </span>
                    </div>
                )}

                {/* Probability display */}
                <div className="flex items-center gap-1.5 mt-2 w-full justify-center">
                    <div
                        className="flex-1 h-[1px] max-w-[24px]"
                        style={{ background: `linear-gradient(to right, transparent, ${rarityConfig.color}50)` }}
                    />
                    <span
                        className="text-[9px] font-black tracking-widest"
                        style={{ color: `${rarityConfig.color}90` }}
                    >
                        {item.percentage}%
                    </span>
                    <div
                        className="flex-1 h-[1px] max-w-[24px]"
                        style={{ background: `linear-gradient(to left, transparent, ${rarityConfig.color}50)` }}
                    />
                </div>

                {/* Corner rarity icon (decorative) */}
                <span
                    className="absolute bottom-2 right-2 text-[10px] opacity-20 group-hover:opacity-50 transition-opacity font-display"
                    style={{ color: rarityConfig.color }}
                >
                    {visual.cornerIcon}
                </span>
            </div>

            {/* ── Result extra info ────────────────────────────────────── */}
            {isResult && (
                <div className="relative z-10 px-3 pb-3">
                    <div
                        className="border-t pt-2 text-center"
                        style={{ borderColor: `${rarityConfig.color}25` }}
                    >
                        <div className="text-[9px] text-gray-500 uppercase tracking-[0.18em] mb-0.5">
                            Probabilidad
                        </div>
                        <div
                            className="font-black text-sm font-display"
                            style={{ color: rarityConfig.color }}
                        >
                            {item.percentage}%
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
