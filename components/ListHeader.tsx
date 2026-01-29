'use client';

import { BoxList } from '@/types';
import { Calendar, User, TrendingUp, Edit3 } from 'lucide-react';

interface ListHeaderProps {
    list: BoxList;
    onEdit?: () => void;
}

export default function ListHeader({ list, onEdit }: ListHeaderProps) {
    return (
        <div className="glass-card p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* List Info */}
                <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {list.name}
                    </h1>

                    {list.description && (
                        <p className="text-gray-300 text-lg mb-4">
                            {list.description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <User size={16} />
                            <span>Creador: <span className="text-white font-medium">{list.creatorName}</span></span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>Creado: <span className="text-white font-medium">
                                {new Date(list.createdAt).toLocaleDateString('es-ES')}
                            </span></span>
                        </div>

                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} />
                            <span>Aperturas: <span className="text-white font-medium">{list.totalOpens}</span></span>
                        </div>
                    </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex gap-4">
                        <div className="glass-card p-4 text-center min-w-[100px]">
                            <div className="text-3xl font-bold text-indigo-400 mb-1">
                                {list.items.length}
                            </div>
                            <div className="text-xs text-gray-400">
                                Cajas
                            </div>
                        </div>

                        <div className="glass-card p-4 text-center min-w-[100px]">
                            <div className="text-3xl font-bold text-purple-400 mb-1">
                                {list.totalOpens}
                            </div>
                            <div className="text-xs text-gray-400">
                                Aperturas
                            </div>
                        </div>
                    </div>

                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="p-3 glass-card hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            title="Editar Lista"
                        >
                            <Edit3 size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
