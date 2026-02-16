'use client';

import { BoxItem, RARITY_CONFIG } from '@/types';
import Image from 'next/image';

interface BoxCardProps {
    item: BoxItem;
    onDelete?: (id: string) => void;
    showDelete?: boolean;
    isResult?: boolean;
}

export default function BoxCard({ item, onDelete, showDelete = false, isResult = false }: BoxCardProps) {
    const rarityConfig = RARITY_CONFIG[item.rarity];
    const isImage = item.identifierType === 'imagen' && item.imageUrl;

    return (
        <div
            className={`bg-surface-dark border rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer transition-all duration-300 ${isResult ? 'scale-110 shadow-2xl z-20' : 'hover:-translate-y-1'}`}
            style={{
                borderColor: isResult ? rarityConfig.color : `${rarityConfig.color}40`,
                boxShadow: isResult ? `0 0 30px ${rarityConfig.color}60` : 'none'
            }}
        >
            <div
                className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity"
                style={{ backgroundImage: `linear-gradient(to bottom right, ${rarityConfig.color}, transparent)` }}
            ></div>

            {showDelete && onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500/10 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white"
                >
                    <span className="material-icons-outlined text-sm">delete</span>
                </button>
            )}

            {isImage ? (
                <div className="relative w-24 h-24 mb-3 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                    <Image src={item.imageUrl!} alt={item.identifier} fill className="object-contain" />
                </div>
            ) : (
                <span
                    className="text-5xl font-display font-black mb-2 transition-transform duration-500 group-hover:scale-110"
                    style={{
                        color: rarityConfig.color,
                        textShadow: `0 0 10px ${rarityConfig.color}80`
                    }}
                >
                    {item.identifier}
                </span>
            )}

            <div className="text-center relative z-10 w-full px-2">
                <div className="font-bold text-white text-sm line-clamp-1">
                    {item.identifierType === 'imagen' ? item.identifier : `Objeto ${item.identifier}`}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest mt-1" style={{ color: rarityConfig.color }}>
                    {rarityConfig.label}
                </div>
                {isResult && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Probabilidad</div>
                        <div className="text-white font-black text-sm">{item.percentage}%</div>
                    </div>
                )}
            </div>
        </div>
    );
}
