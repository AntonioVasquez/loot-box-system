'use client';

import { BoxList } from '@/types';

interface ListHeaderProps {
    list: BoxList;
    onEdit?: () => void;
}

export default function ListHeader({ list, onEdit }: ListHeaderProps) {
    return (
        <div className="glass-panel rounded-xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end relative overflow-hidden group">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-700"></div>

            <div className="relative z-10 w-full md:w-auto">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-indigo-400 mb-1 text-glow">
                    {list.name}
                </h2>
                <p className="text-gray-400 mb-4 text-lg italic opacity-80">{list.description || 'Una colección épica de cajas misteriosas'}</p>

                <div className="flex flex-wrap gap-4 text-sm font-mono text-gray-500">
                    <div className="flex items-center space-x-1">
                        <span className="material-icons-outlined text-base">person</span>
                        <span>Creador: <span className="text-gray-300 font-semibold">{list.creatorName}</span></span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="material-icons-outlined text-base">calendar_today</span>
                        <span>Creado: <span className="text-gray-300 font-semibold">{new Date(list.createdAt).toLocaleDateString('es-ES')}</span></span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="material-icons-outlined text-base">trending_up</span>
                        <span>Aperturas: <span className="text-gray-300 font-semibold">{list.totalOpens}</span></span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-6 md:mt-0 relative z-10">
                <div className="bg-gray-900/80 border border-gray-700 rounded-2xl px-6 py-3 text-center min-w-[100px] shadow-lg">
                    <div className="text-3xl font-display font-bold text-blue-500">{list.items.length}</div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Cajas</div>
                </div>
                <div className="bg-gray-900/80 border border-gray-700 rounded-2xl px-6 py-3 text-center min-w-[100px] shadow-lg">
                    <div className="text-3xl font-display font-bold text-purple-500">{list.totalOpens}</div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Aperturas</div>
                </div>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-3 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                        title="Editar Información"
                    >
                        <span className="material-icons-outlined">edit</span>
                    </button>
                )}
            </div>
        </div>
    );
}
