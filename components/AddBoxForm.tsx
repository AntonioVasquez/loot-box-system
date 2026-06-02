'use client';

import { useState, useRef } from 'react';
import { BoxItem, RarityType, IdentifierType, RARITY_CONFIG } from '@/types';
import Image from 'next/image';
import HudPanel from './HudPanel';

interface AddBoxFormProps {
  onAdd: (item: Omit<BoxItem, 'id' | 'createdAt'> | Omit<BoxItem, 'id' | 'createdAt'>[]) => void;
  currentCount: number;
  maxBoxes: number;
}

// Rarity UI metadata
const RARITY_META: Record<RarityType, { icon: string; short: string }> = {
  'basico':      { icon: '○', short: 'BSC' },
  'medio':       { icon: '◇', short: 'MED' },
  'valioso':     { icon: '◆', short: 'VAL' },
  'muy-valioso': { icon: '★', short: 'M.V' },
  'legendario':  { icon: '⬡', short: 'LEG' },
};

export default function AddBoxForm({ onAdd, currentCount, maxBoxes }: AddBoxFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<IdentifierType>('numero');
  const [rarity, setRarity] = useState<RarityType>('basico');
  const [percentage, setPercentage] = useState(RARITY_CONFIG['basico'].defaultPercentage);
  const [imageUrl, setImageUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRarityChange = (newRarity: RarityType) => {
    setRarity(newRarity);
    setPercentage(RARITY_CONFIG[newRarity].defaultPercentage);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Selecciona una imagen válida'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Imagen demasiado grande. Límite: 5MB'); return; }
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const MAX = 300;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        setImageUrl(canvas.toDataURL('image/jpeg', 0.8));
        setIsCompressing(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifierType === 'numero' && isRangeMode) {
      const start = Number(rangeStart), end = Number(rangeEnd);
      if (isNaN(start) || isNaN(end)) { alert('Ingresa números válidos'); return; }
      if (start > end) { alert('El inicio debe ser menor al final'); return; }
      const count = end - start + 1;
      if (currentCount + count > maxBoxes) { alert(`Límite: ${maxBoxes}. Ya tienes ${currentCount}`); return; }
      const items: Omit<BoxItem, 'id' | 'createdAt'>[] = [];
      for (let i = start; i <= end; i++) items.push({ identifier: i.toString(), identifierType: 'numero', rarity, percentage });
      onAdd(items);
    } else {
      if (!identifier.trim() && identifierType !== 'imagen') { alert('Ingresa un identificador'); return; }
      if (identifierType === 'imagen' && !imageUrl.trim()) { alert('Sube una imagen'); return; }
      if (percentage <= 0 || percentage > 100) { alert('Porcentaje entre 1 y 100'); return; }
      onAdd({ identifier: identifierType === 'imagen' ? 'Imagen' : identifier, identifierType, rarity, percentage, imageUrl: identifierType === 'imagen' ? imageUrl : undefined });
      setIdentifier(''); setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isDisabled = currentCount >= maxBoxes;
  const rarityConf = RARITY_CONFIG[rarity];
  const rarities: RarityType[] = ['basico', 'medio', 'valioso', 'muy-valioso', 'legendario'];

  return (
    <HudPanel className="p-6 h-fit" label="NUEVA CAJA" tag="INPUT" accentColor="#a855f7">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
          <span className="material-icons-outlined text-primary text-xl">add_box</span>
          Agregar Caja
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-1 w-16 rounded-full overflow-hidden bg-black/50 border border-white/5">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${(currentCount / maxBoxes) * 100}%` }} />
          </div>
          <span className="text-[9px] font-mono text-gray-600 tracking-widest">{currentCount}/{maxBoxes}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Identifier type */}
        <div>
          <div className="neon-label">Tipo de Identificador</div>
          <select value={identifierType} disabled={isDisabled}
            onChange={e => { const t = e.target.value as IdentifierType; setIdentifierType(t); if (t !== 'numero') setIsRangeMode(false); }}
            className="cyber-select">
            <option value="numero">Número</option>
            <option value="letra">Letra</option>
            <option value="alfanumerico">Alfanumérico</option>
            <option value="imagen">Imagen</option>
          </select>
        </div>

        {/* Range toggle */}
        {identifierType === 'numero' && (
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={isRangeMode}
                onChange={e => setIsRangeMode(e.target.checked)} disabled={isDisabled} />
              <div className="w-10 h-5 rounded-full bg-black/50 border border-purple-900/30 peer-checked:bg-primary/20 peer-checked:border-primary transition-all
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-600 after:rounded-full after:h-[16px] after:w-[16px] after:transition-all
                              peer-checked:after:translate-x-5 peer-checked:after:bg-primary" />
            </div>
            <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors font-mono tracking-wider">MODO RANGO</span>
          </label>
        )}

        {/* Image upload */}
        {identifierType === 'imagen' ? (
          <div>
            <div className="neon-label">Imagen de la Caja</div>
            {!imageUrl ? (
              <div onClick={() => !isDisabled && fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-8 text-center transition-all ${isDisabled ? 'opacity-40 cursor-not-allowed border-gray-800' : 'border-purple-900/40 hover:border-primary/60 hover:bg-primary/5 cursor-pointer bg-black/20'}`}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isDisabled} />
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  {isCompressing
                    ? <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    : <>
                        <span className="material-icons-outlined text-4xl text-primary/50">upload_file</span>
                        <span className="text-xs font-bold uppercase tracking-widest font-mono">Subir Imagen</span>
                        <span className="text-[9px] text-gray-700 font-mono">JPEG · PNG · WebP · 5MB max</span>
                      </>
                  }
                </div>
              </div>
            ) : (
              <div className="relative h-36 rounded-xl overflow-hidden border border-primary/20 bg-black/30 group">
                <Image src={imageUrl} alt="Preview" fill className="object-contain p-2" />
                <button type="button" onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors opacity-0 group-hover:opacity-100">
                  <span className="material-icons-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>
        ) : isRangeMode && identifierType === 'numero' ? (
          /* Range inputs */
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="neon-label">Desde</div>
              <input type="number" value={rangeStart} onChange={e => setRangeStart(parseInt(e.target.value) || 0)}
                className="cyber-input" disabled={isDisabled} />
            </div>
            <div>
              <div className="neon-label">Hasta</div>
              <input type="number" value={rangeEnd} onChange={e => setRangeEnd(parseInt(e.target.value) || 0)}
                className="cyber-input" disabled={isDisabled} />
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/5 border border-secondary/15">
                <span className="material-icons-outlined text-secondary" style={{ fontSize: '14px' }}>info</span>
                <span className="text-[10px] text-secondary/70 font-mono tracking-wider">
                  {Math.max(0, rangeEnd - rangeStart + 1)} cajas · quedan {maxBoxes - currentCount} slots
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Single identifier */
          <div>
            <div className="neon-label">Identificador</div>
            <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
              placeholder={identifierType === 'numero' ? 'Ej: 1, 2, 42...' : identifierType === 'letra' ? 'Ej: A, B, Z...' : 'Ej: A1, B2...'}
              className="cyber-input" disabled={isDisabled} />
          </div>
        )}

        {/* Rarity selector */}
        <div>
          <div className="neon-label">Rareza</div>
          <div className="grid grid-cols-5 gap-1.5">
            {rarities.map(r => {
              const conf = RARITY_CONFIG[r];
              const meta = RARITY_META[r];
              const isSelected = rarity === r;
              return (
                <button key={r} type="button" onClick={() => handleRarityChange(r)} disabled={isDisabled}
                  className={`relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all duration-200 overflow-hidden ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                  style={{
                    borderColor: isSelected ? conf.color : `${conf.color}25`,
                    background: isSelected ? `${conf.color}12` : 'rgba(0,0,0,0.3)',
                    boxShadow: isSelected ? `0 0 14px ${conf.color}35, inset 0 0 10px ${conf.color}08` : 'none',
                  }}
                >
                  {isSelected && (
                    <div className="absolute inset-x-0 top-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${conf.color}, transparent)` }} />
                  )}
                  <span className="text-base leading-none" style={{ color: conf.color, filter: isSelected ? `drop-shadow(0 0 6px ${conf.color})` : 'none' }}>
                    {meta.icon}
                  </span>
                  <span className="text-[7px] font-black tracking-widest font-mono" style={{ color: isSelected ? conf.color : '#4b5563' }}>
                    {meta.short}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Selected rarity label */}
          <div className="mt-2 flex items-center gap-2 px-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rarityConf.color, boxShadow: `0 0 6px ${rarityConf.color}` }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono" style={{ color: rarityConf.color }}>
              {rarityConf.label} seleccionado
            </span>
          </div>
        </div>

        {/* Percentage slider */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="neon-label" style={{ marginBottom: 0 }}>Probabilidad</div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded border font-mono text-sm font-black"
                style={{ borderColor: `${rarityConf.color}40`, color: rarityConf.color, background: `${rarityConf.color}0d` }}>
                {percentage}%
              </div>
            </div>
          </div>
          {/* Probability bar track */}
          <div className="relative h-2 bg-black/60 rounded-full overflow-hidden border border-white/5 mb-1">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${rarityConf.color}60, ${rarityConf.color})` }} />
          </div>
          <input type="range" min="1" max="100" value={percentage}
            onChange={e => setPercentage(Number(e.target.value))}
            className="w-full h-1 appearance-none cursor-pointer bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:cursor-pointer transition-all"
            style={{ accentColor: rarityConf.color }}
            disabled={isDisabled} />
        </div>

        {/* Submit */}
        <button type="submit" disabled={isDisabled}
          className={`relative w-full overflow-hidden group py-3.5 rounded-xl font-display font-bold uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-3 transition-all duration-300 mt-2 ${
            isDisabled ? 'opacity-40 cursor-not-allowed border border-gray-800 text-gray-600' :
            'border border-primary/30 hover:border-primary/70 text-white hover:-translate-y-0.5'
          }`}
          style={!isDisabled ? { background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.08) 100%)' } : {}}
        >
          {!isDisabled && (
            <>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(59,130,246,0.15) 100%)' }} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
          <span className="material-icons-outlined text-xl relative z-10 text-primary">
            {isDisabled ? 'lock' : isRangeMode ? 'library_add' : 'add_circle'}
          </span>
          <span className="relative z-10">
            {isDisabled ? 'LÍMITE ALCANZADO' : isRangeMode ? `AGREGAR RANGO (${Math.max(0, rangeEnd - rangeStart + 1)})` : 'AGREGAR CAJA'}
          </span>
        </button>
      </form>
    </HudPanel>
  );
}
