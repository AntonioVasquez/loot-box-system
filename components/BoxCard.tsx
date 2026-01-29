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
            className={`glass-card p-6 relative overflow-hidden group ${isResult ? 'box-reveal' : ''}`}
            style={{
                borderColor: rarityConfig.color,
                boxShadow: isResult ? `0 0 40px ${rarityConfig.glowColor}` : undefined
            }}
        >
            {/* Background Glow Effect */}
            <div
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle at center, ${rarityConfig.color} 0%, transparent 70%)`
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {/* Rarity Badge */}
                <div className="flex justify-between items-start mb-4">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border`}
                        style={{
                            backgroundColor: `${rarityConfig.color}20`,
                            borderColor: `${rarityConfig.color}50`,
                            color: rarityConfig.color
                        }}
                    >
                        {rarityConfig.label}
                    </span>

                    {showDelete && onDelete && (
                        <button
                            onClick={() => onDelete(item.id)}
                            className="btn-danger p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Eliminar caja"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Identifier Display */}
                <div className="flex flex-col items-center justify-center py-8">
                    {item.identifierType === 'imagen' && item.imageUrl ? (
                        <div className="relative w-32 h-32 mb-4">
                            <Image
                                src={item.imageUrl}
                                alt={item.identifier}
                                fill
                                className="object-contain rounded-lg"
                            />
                        </div>
                    ) : (
                        <div
                            className="text-6xl font-bold mb-4 animate-float"
                            style={{ color: rarityConfig.color }}
                        >
                            {item.identifier}
                        </div>
                    )}

                    {/* Percentage */}
                    <div className="text-sm text-gray-400 mt-2">
                        Probabilidad: <span className="font-semibold text-white">{item.percentage}%</span>
                    </div>
                </div>

                {/* Identifier Type */}
                <div className="text-xs text-gray-500 text-center mt-4 capitalize">
                    Tipo: {item.identifierType}
                </div>
            </div>

            {/* Shimmer Effect on Hover */}
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 pointer-events-none" />
        </div>
    );
}
