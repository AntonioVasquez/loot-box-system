'use client';

import { useState, useRef } from 'react';
import { BoxItem, RarityType, IdentifierType, RARITY_CONFIG } from '@/types';
import { Plus, Upload, X, Image as ImageIcon, Hash } from 'lucide-react';
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

        // Basic validation
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
                // Compression Logic
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 300; // Resize to max 300px for storage efficiency

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

                // Convert to compressed JPEG
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
                alert('Ingresa números válidos pal rango');
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
            // Don't reset range mode settings as the user might want to add another range
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

            // Reset form for single case
            setIdentifier('');
            setImageUrl('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isDisabled = currentCount >= maxBoxes;

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Agregar Nueva Caja</h3>
                <span className="text-sm text-gray-400">
                    {currentCount} / {maxBoxes}
                </span>
            </div>

            {/* Identifier Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Identificador
                </label>
                <select
                    value={identifierType}
                    onChange={(e) => {
                        const type = e.target.value as IdentifierType;
                        setIdentifierType(type);
                        if (type !== 'numero') setIsRangeMode(false);
                    }}
                    className="select-field"
                    disabled={isDisabled}
                >
                    <option value="numero">Número</option>
                    <option value="letra">Letra</option>
                    <option value="alfanumerico">Alfanumérico</option>
                    <option value="imagen">Imagen (Subir)</option>
                </select>
            </div>

            {/* Range Mode Toggle (Only for Number) */}
            {identifierType === 'numero' && (
                <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isRangeMode}
                            onChange={(e) => setIsRangeMode(e.target.checked)}
                            disabled={isDisabled}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-300">Crear Rango de Números</span>
                    </label>
                </div>
            )}

            {/* Identifier Input */}
            {identifierType === 'imagen' ? (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Subir Imagen
                    </label>

                    {!imageUrl ? (
                        <div
                            className={`border-2 border-dashed border-gray-600 rounded-xl p-6 text-center transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 cursor-pointer bg-white/5'
                                }`}
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
                                    <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <Upload size={32} className="mb-1" />
                                        <span className="text-sm font-medium">Haga clic para seleccionar</span>
                                        <span className="text-xs text-gray-500">Max 5MB (Se optimizará auto.)</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-32 bg-black/20 rounded-xl overflow-hidden group">
                            <Image
                                src={imageUrl}
                                alt="Preview"
                                fill
                                className="object-contain"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full text-white hover:bg-red-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            ) : isRangeMode && identifierType === 'numero' ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Desde
                        </label>
                        <input
                            type="number"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(parseInt(e.target.value) || 0)}
                            className="input-field"
                            disabled={isDisabled}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Hasta
                        </label>
                        <input
                            type="number"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(parseInt(e.target.value) || 0)}
                            className="input-field"
                            disabled={isDisabled}
                        />
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Identificador
                    </label>
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={
                            identifierType === 'numero' ? '1, 2, 3...' :
                                identifierType === 'letra' ? 'A, B, C...' :
                                    'A1, B2, C3...'
                        }
                        className="input-field"
                        disabled={isDisabled}
                    />
                </div>
            )}

            {/* Rarity Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                    Rareza
                </label>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(RARITY_CONFIG) as RarityType[]).map((rarityKey) => {
                        const config = RARITY_CONFIG[rarityKey];
                        const isSelected = rarity === rarityKey;

                        return (
                            <button
                                key={rarityKey}
                                type="button"
                                onClick={() => handleRarityChange(rarityKey)}
                                disabled={isDisabled}
                                className={`flex-1 min-w-[90px] px-3 py-2 rounded-lg border-2 text-sm font-bold transition-all duration-300 ${isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'
                                    }`}
                                style={{
                                    backgroundColor: isSelected ? `${config.color}30` : `${config.color}10`,
                                    borderColor: config.color,
                                    color: config.color,
                                    boxShadow: isSelected ? `0 0 20px ${config.glowColor}` : 'none'
                                }}
                            >
                                {config.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Percentage Input */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Porcentaje de Aparición
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={percentage}
                        onChange={(e) => setPercentage(Number(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        style={{
                            accentColor: RARITY_CONFIG[rarity].color
                        }}
                        disabled={isDisabled}
                    />
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={percentage}
                        onChange={(e) => setPercentage(Number(e.target.value))}
                        className="input-field w-20 text-center"
                        disabled={isDisabled}
                    />
                    <span className="text-gray-400">%</span>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isDisabled}
                className="btn-primary w-full flex items-center justify-center gap-2"
            >
                <Plus size={20} />
                {isDisabled ? 'Límite Alcanzado' : isRangeMode ? 'Agregar Cajas' : 'Agregar Caja'}
            </button>

            {isDisabled && (
                <p className="text-sm text-amber-400 text-center">
                    Has alcanzado el límite máximo de {maxBoxes} cajas
                </p>
            )}
        </form>
    );
}
