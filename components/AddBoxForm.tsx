'use client';

import { useState, useRef } from 'react';
import { BoxItem, RarityType, IdentifierType, RARITY_CONFIG } from '@/types';
import Image from 'next/image';

interface AddBoxFormProps {
    onAdd: (item: Omit<BoxItem, 'id' | 'createdAt'> | Omit<BoxItem, 'id' | 'createdAt'>[]) => void;
    currentCount: number;
    maxBoxes: number;
}

export default function AddBoxForm({ onAdd, currentCount, maxBoxes }: AddBoxFormProps) {
    const [identifier, setIdentifier] = useState('');
    const [identifierType, setIdentifierType] = useState<IdentifierType>('numero');
    const [rarity, setRarity] = useState<RarityType>('basico');
    const [percentage, setPercentage] = useState(RARITY_CONFIG['basico'].defaultPercentage);
    const [imageUrl, setImageUrl] = useState('');
    const [isCompressing, setIsCompressing] = useState(false);

    // Range Mode states
    const [isRangeMode, setIsRangeMode] = useState(false);
    const [rangeStart, setRangeStart] = useState<number>(1);
    const [rangeEnd, setRangeEnd] = useState<number>(10);

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRarityChange = (newRarity: RarityType) => {
        setRarity(newRarity);
        setPercentage(RARITY_CONFIG[newRarity].defaultPercentage);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande. El límite es 5MB.');
            return;
        }

        setIsCompressing(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 300;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setImageUrl(compressedDataUrl);
                setIsCompressing(false);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (identifierType === 'numero' && isRangeMode) {
            const start = Number(rangeStart);
            const end = Number(rangeEnd);

            if (isNaN(start) || isNaN(end)) {
                alert('Ingresa números válidos para el rango');
                return;
            }

            if (start > end) {
                alert('El número inicial debe ser mayor al final');
                return;
            }

            const count = end - start + 1;
            if (currentCount + count > maxBoxes) {
                alert(`No puedes agregar ${count} cajas. El límite es ${maxBoxes} y ya tienes ${currentCount}.`);
                return;
            }

            const newItems: Omit<BoxItem, 'id' | 'createdAt'>[] = [];
            for (let i = start; i <= end; i++) {
                newItems.push({
                    identifier: i.toString(),
                    identifierType: 'numero',
                    rarity,
                    percentage,
                });
            }

            onAdd(newItems);
        } else {
            if (!identifier.trim() && identifierType !== 'imagen') {
                alert('Por favor ingresa un identificador');
                return;
            }

            if (identifierType === 'imagen' && !imageUrl.trim()) {
                alert('Por favor sube una imagen');
                return;
            }

            if (percentage <= 0 || percentage > 100) {
                alert('El porcentaje debe estar entre 1 y 100');
                return;
            }

            onAdd({
                identifier: identifierType === 'imagen' ? 'Imagen' : identifier,
                identifierType,
                rarity,
                percentage,
                imageUrl: identifierType === 'imagen' ? imageUrl : undefined
            });

            setIdentifier('');
            setImageUrl('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isDisabled = currentCount >= maxBoxes;

    return (
        <div className="glass-panel rounded-xl p-6 h-fit relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-white text-glow">Agregar Nueva Caja</h3>
                <span className="text-sm font-mono text-gray-400">{currentCount} / {maxBoxes}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">Tipo de Identificador</label>
                    <select
                        value={identifierType}
                        onChange={(e) => {
                            const type = e.target.value as IdentifierType;
                            setIdentifierType(type);
                            if (type !== 'numero') setIsRangeMode(false);
                        }}
                        className="input-field w-full p-2.5"
                        disabled={isDisabled}
                    >
                        <option value="numero">Número</option>
                        <option value="letra">Letra</option>
                        <option value="alfanumerico">Alfanumérico</option>
                        <option value="imagen">Imagen (Subir)</option>
                    </select>
                </div>

                {identifierType === 'numero' && (
                    <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isRangeMode}
                                onChange={(e) => setIsRangeMode(e.target.checked)}
                                disabled={isDisabled}
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                        <span className="text-sm font-medium text-gray-300">Crear Rango de Números</span>
                    </div>
                )}

                {identifierType === 'imagen' ? (
                    <div>
                        <label className="block text-xs font-mono text-gray-300 mb-2 uppercase tracking-wider">Imagen de la Caja</label>
                        {!imageUrl ? (
                            <div
                                className={`border-2 border-dashed border-gray-700 rounded-xl p-8 text-center transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5 cursor-pointer bg-gray-900/50'}`}
                                onClick={() => !isDisabled && fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={isDisabled}
                                />
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    {isCompressing ? (
                                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            <span className="material-icons-outlined text-4xl mb-1 text-primary">upload_file</span>
                                            <span className="text-xs font-bold uppercase tracking-widest">Sube una imagen</span>
                                            <span className="text-[10px] opacity-50">Optimización automática</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-40 bg-black/40 rounded-xl overflow-hidden group border border-gray-700">
                                <Image src={imageUrl} alt="Preview" fill className="object-contain p-2" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full text-white hover:bg-red-500 transition-colors"
                                >
                                    <span className="material-icons-outlined text-sm">close</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : isRangeMode && identifierType === 'numero' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Desde</label>
                            <input
                                type="number"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(parseInt(e.target.value) || 0)}
                                className="input-field w-full p-2.5"
                                disabled={isDisabled}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Hasta</label>
                            <input
                                type="number"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(parseInt(e.target.value) || 0)}
                                className="input-field w-full p-2.5"
                                disabled={isDisabled}
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1">Identificador</label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder={identifierType === 'numero' ? '1, 2, 3...' : 'A, B...'}
                            className="input-field w-full p-2.5"
                            disabled={isDisabled}
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">Rareza</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {(['basico', 'medio', 'valioso', 'muy-valioso'] as RarityType[]).map((rarityKey) => {
                            const config = RARITY_CONFIG[rarityKey];
                            const isSelected = rarity === rarityKey;
                            return (
                                <button
                                    key={rarityKey}
                                    type="button"
                                    onClick={() => handleRarityChange(rarityKey)}
                                    disabled={isDisabled}
                                    className={`py-2 px-3 rounded border text-xs font-bold transition-all ${isSelected
                                        ? 'bg-primary/20 text-white border-primary shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                        : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                                    style={isSelected ? { borderColor: config.color, color: config.color, backgroundColor: `${config.color}20` } : {}}
                                >
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={() => handleRarityChange('legendario')}
                        disabled={isDisabled}
                        className={`w-full py-2.5 rounded border text-xs font-bold transition-all uppercase tracking-widest mt-1 ${rarity === 'legendario'
                            ? 'bg-neon-gold/20 text-neon-gold border-neon-gold shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                            : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                    >
                        Legendario
                    </button>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Porcentaje de Aparición</label>
                        <span className="text-xs font-bold text-secondary" style={{ color: RARITY_CONFIG[rarity].color }}>{percentage}%</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input
                            type="range"
                            min="1" max="100"
                            value={percentage}
                            onChange={(e) => setPercentage(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: RARITY_CONFIG[rarity].color }}
                            disabled={isDisabled}
                        />
                        <div className="bg-gray-800 px-2 py-1 rounded border border-gray-700 text-white text-sm w-16 text-center">{percentage}</div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isDisabled}
                    className="w-full btn-neon bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center space-x-2 mt-4"
                >
                    <span className="material-icons-outlined">{isDisabled ? 'lock' : 'add'}</span>
                    <span className="uppercase tracking-wider">{isDisabled ? 'Límite Alcanzado' : isRangeMode ? 'Agregar Cajas' : 'Agregar Caja'}</span>
                </button>
            </form>
        </div>
    );
}
