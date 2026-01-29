'use client';

import { BoxItem, RARITY_CONFIG } from '@/types';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';

interface BoxCardProps {
    item: BoxItem;
    onDelete?: (id: string) => void;
    showDelete?: boolean;
    isResult?: boolean;
}

export default function BoxCard({ item, onDelete, showDelete = false, isResult = false }: BoxCardProps) {
    const rarityConfig = RARITY_CONFIG[item.rarity];

    return (
        <div
            className={`relative overflow-hidden group rounded-2xl transition-all duration-500 bg-[#0d0d0f] border ${isResult ? 'scale-110' : ''}`}
            style={{
                borderColor: isResult ? rarityConfig.color : 'rgba(255,255,255,0.05)',
                boxShadow: isResult ? `0 0 60px ${rarityConfig.glowColor}` : 'none',
                width: isResult ? '220px' : 'auto',
                height: isResult ? '320px' : 'auto'
            }}
        >
            {/* Background Glow Effect */}
            <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle at center, ${rarityConfig.color} 0%, transparent 80%)`
                }}
            />

            <div className="relative z-10 p-6 h-full flex flex-col">
                {/* Rarity Indicator */}
                <div className="flex justify-between items-start mb-2">
                    <div
                        className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{ backgroundColor: rarityConfig.color, color: rarityConfig.color }}
                    />

                    {showDelete && onDelete && (
                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Eliminar caja"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center flex-grow py-4">
                    {item.identifierType === 'imagen' && item.imageUrl ? (
                        <div className="relative w-28 h-28 mb-4 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-110">
                            <Image
                                src={item.imageUrl}
                                alt={item.identifier}
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div
                            className="text-6xl font-black mb-4 transition-transform duration-500 group-hover:scale-110 animate-float"
                            style={{ color: rarityConfig.color, textShadow: `0 0 20px ${rarityConfig.glowColor}` }}
                        >
                            {item.identifier}
                        </div>
                    )}

                    <div className="mt-auto text-center">
                        <h4 className="text-white font-bold text-sm tracking-wide mb-1 px-2 line-clamp-1">
                            {item.identifierType === 'imagen' ? item.identifier : `Objeto ${item.identifier}`}
                        </h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: rarityConfig.color }}>
                            {rarityConfig.label}
                        </p>
                    </div>
                </div>

                {/* Percentage */}
                {isResult && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-center">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Probabilidad</div>
                        <div className="text-white font-black text-sm">{item.percentage}%</div>
                    </div>
                )}
            </div>

            {/* Shimmer Effect on Hover */}
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 pointer-events-none" />
        </div>
    );
}
