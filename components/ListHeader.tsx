'use client';

import { BoxList } from '@/types';
import HudPanel from './HudPanel';

interface ListHeaderProps {
  list: BoxList;
  onEdit?: () => void;
}

export default function ListHeader({ list, onEdit }: ListHeaderProps) {
  const completionPct = list.items.length > 0
    ? Math.round(((list.drawnItemIds?.length ?? 0) / list.items.length) * 100)
    : 0;

  return (
    <HudPanel className="mb-6 p-6" label="DATAFILE" tag="LIST-ACTIVE" accentColor="#a855f7">

      {/* Top accent bar */}
      <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-xl overflow-hidden">
        <div className="h-full bar-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #a855f7 30%, #06b6d4 60%, #a855f7 80%, transparent 100%)', backgroundSize: '200% auto' }} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2 relative z-10">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          {/* Creator badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 border border-primary/15">
              <span className="material-icons-outlined text-primary" style={{ fontSize: '13px' }}>person</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/70 font-mono">{list.creatorName}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/8 border border-cyan-500/15">
              <span className="material-icons-outlined text-cyan-500" style={{ fontSize: '13px' }}>calendar_today</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-500/70 font-mono">
                {new Date(list.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Name */}
          <h2 className="text-2xl md:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 mb-1 leading-tight truncate">
            {list.name}
          </h2>
          <p className="text-gray-500 text-sm italic leading-relaxed max-w-md line-clamp-2">
            {list.description || 'Una colección épica de cajas misteriosas'}
          </p>

          {/* Progress bar */}
          {list.items.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 max-w-[180px] h-1 bg-black/60 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${completionPct}%`,
                    background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
                    boxShadow: '0 0 8px rgba(168,85,247,0.5)'
                  }}
                />
              </div>
              <span className="text-[9px] font-mono text-gray-600 tracking-widest">{completionPct}% EXTRAÍDO</span>
            </div>
          )}
        </div>

        {/* Right: stats */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Stat: items */}
          <div className="flex flex-col items-center justify-center px-3 sm:px-5 py-2 sm:py-4 rounded-xl border border-secondary/20 bg-secondary/5 min-w-[60px] sm:min-w-[90px]">
            <div className="text-[7px] sm:text-[8px] font-mono text-gray-600 uppercase tracking-[0.15em] mb-1 flex items-center gap-1">
              <span className="material-icons-outlined hidden sm:inline" style={{ fontSize: '9px' }}>inventory_2</span>
              Cajas
            </div>
            <div className="text-xl sm:text-3xl font-display font-black text-secondary" style={{ textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
              {list.items.length}
            </div>
          </div>

          {/* Stat: opens */}
          <div className="flex flex-col items-center justify-center px-3 sm:px-5 py-2 sm:py-4 rounded-xl border border-primary/20 bg-primary/5 min-w-[60px] sm:min-w-[90px]">
            <div className="text-[7px] sm:text-[8px] font-mono text-gray-600 uppercase tracking-[0.15em] mb-1 flex items-center gap-1">
              <span className="material-icons-outlined hidden sm:inline" style={{ fontSize: '9px' }}>auto_awesome</span>
              Abiertos
            </div>
            <div className="text-xl sm:text-3xl font-display font-black text-primary" style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
              {list.totalOpens}
            </div>
          </div>

          {/* Edit button */}
          {onEdit && (
            <button onClick={onEdit}
              className="flex flex-col items-center justify-center px-3 sm:px-4 py-2 sm:py-4 rounded-xl border border-white/6 text-gray-600 hover:text-white hover:border-primary/30 hover:bg-primary/5 transition-all group"
              title="Editar">
              <span className="material-icons-outlined text-base sm:text-xl group-hover:text-primary transition-colors">edit</span>
              <span className="hidden sm:block text-[8px] font-mono mt-1 tracking-widest uppercase">Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Corner decorative dots */}
      <div className="absolute bottom-3 left-6 flex gap-1 opacity-20">
        {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary" style={{ animationDelay: `${i * 0.3}s` }} />)}
      </div>
    </HudPanel>
  );
}
