'use client';

import { useState, useEffect } from 'react';
import { BoxList, BoxItem, MAX_BOXES } from '@/types';
import AddBoxForm from '@/components/AddBoxForm';
import BoxCard from '@/components/BoxCard';
import BoxOpener from '@/components/BoxOpener';
import ListHeader from '@/components/ListHeader';
import { Boxes, Edit3, Eye, Save, RotateCcw } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<'create' | 'play'>('create');

  // Use custom hook for persistence
  const [boxList, setBoxList] = useLocalStorage<BoxList>('loot-box-data', {
    id: '1',
    name: 'Mi Lista de Cajas',
    description: 'Una colección épica de cajas misteriosas',
    creatorName: 'Creador',
    items: [],
    removeItemsFromList: true,
    drawnItemIds: [],
    history: [],
    totalOpens: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [editingList, setEditingList] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempCreator, setTempCreator] = useState('');
  const [tempRemoveItems, setTempRemoveItems] = useState(true);

  // Update temp state when boxList changes (loaded from storage)
  useEffect(() => {
    if (boxList) {
      setTempName(boxList.name);
      setTempDescription(boxList.description);
      setTempCreator(boxList.creatorName);
      setTempRemoveItems(boxList.removeItemsFromList ?? true);
    }
  }, [boxList]);

  const handleAddBox = (newBoxes: Omit<BoxItem, 'id' | 'createdAt'> | Omit<BoxItem, 'id' | 'createdAt'>[]) => {
    const itemsToAdd = Array.isArray(newBoxes) ? newBoxes : [newBoxes];

    // Create new items with unique IDs
    const newItems: BoxItem[] = itemsToAdd.map((box, index) => ({
      ...box,
      id: `${Date.now()}-${index}`,
      createdAt: new Date()
    }));

    setBoxList((prev: BoxList) => ({
      ...prev,
      items: [...prev.items, ...newItems],
      updatedAt: new Date()
    }));
  };

  const handleDeleteBox = (id: string) => {
    setBoxList((prev: BoxList) => ({
      ...prev,
      items: prev.items.filter((item: BoxItem) => item.id !== id),
      updatedAt: new Date()
    }));
  };

  const handleSaveListInfo = () => {
    setBoxList((prev: BoxList) => ({
      ...prev,
      name: tempName,
      description: tempDescription,
      creatorName: tempCreator,
      removeItemsFromList: tempRemoveItems,
      updatedAt: new Date()
    }));
    setEditingList(false);
  };

  const handleUpdateLootState = (drawnItemIds: string[], history: BoxItem[]) => {
    setBoxList((prev: BoxList) => ({
      ...prev,
      drawnItemIds,
      history,
      totalOpens: prev.totalOpens + 1,
      updatedAt: new Date()
    }));
  };

  const handleResetLootState = () => {
    setBoxList((prev: BoxList) => ({
      ...prev,
      drawnItemIds: [],
      history: [],
      updatedAt: new Date()
    }));
  };

  const handleResetData = () => {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
      setBoxList({
        id: '1',
        name: 'Mi Lista de Cajas',
        description: 'Una colección épica de cajas misteriosas',
        creatorName: 'Creador',
        items: [],
        removeItemsFromList: true,
        drawnItemIds: [],
        history: [],
        totalOpens: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      window.localStorage.removeItem('loot-box-data');
    }
  };

  const handleCancelEdit = () => {
    setTempName(boxList.name);
    setTempDescription(boxList.description);
    setTempCreator(boxList.creatorName);
    setEditingList(false);
  };

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start p-4 md:p-8">
      <div className="w-full max-w-7xl flex flex-col min-h-[95vh]">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Boxes className="text-indigo-500" size={40} />
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Loot Box System
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Crea y abre cajas misteriosas con rareza personalizada
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="glass-card p-2 inline-flex gap-2">
            <button
              onClick={() => setMode('create')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${mode === 'create'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              <Edit3 size={20} />
              Crear Cajas
            </button>
            <button
              onClick={() => setMode('play')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${mode === 'play'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              <Eye size={20} />
              Abrir Cajas
            </button>
          </div>
        </div>

        {/* List Header with Edit */}
        <div className="mb-8">
          {editingList ? (
            <div className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">Editar Información de la Lista</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre de la Lista
                  </label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="input-field"
                    placeholder="Mi Lista de Cajas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Describe tu lista de cajas..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Creador
                  </label>
                  <input
                    type="text"
                    value={tempCreator}
                    onChange={(e) => setTempCreator(e.target.value)}
                    className="input-field"
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={tempRemoveItems}
                      onChange={(e) => setTempRemoveItems(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-300">Eliminar de la lista al salir (Descuento)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleSaveListInfo} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save size={20} />
                  Guardar
                </button>
                <button onClick={handleCancelEdit} className="btn-secondary flex-1">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <ListHeader
              list={boxList}
              onEdit={() => setEditingList(true)}
            />
          )}
        </div>

        {/* Content based on mode */}
        <div className="flex-grow">
          {mode === 'create' ? (
            <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
              {/* Add Box Form */}
              <div className="lg:col-span-1">
                <AddBoxForm
                  onAdd={handleAddBox}
                  currentCount={boxList.items.length}
                  maxBoxes={MAX_BOXES}
                />
              </div>

              {/* Box Grid */}
              <div className="lg:col-span-2">
                <div className="glass-card p-6 h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Cajas Creadas ({boxList.items.length}/{MAX_BOXES})
                    </h2>
                  </div>

                  {boxList.items.length === 0 ? (
                    <div className="text-center py-12">
                      <Boxes className="mx-auto mb-4 text-gray-600" size={64} />
                      <p className="text-gray-500">
                        No hay cajas aún. ¡Crea tu primera caja!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                      {boxList.items.map((item) => (
                        <BoxCard
                          key={item.id}
                          item={item}
                          onDelete={handleDeleteBox}
                          showDelete={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <BoxOpener
              items={boxList.items}
              listName={boxList.name}
              listDescription={boxList.description}
              totalOpensCount={boxList.totalOpens}
              persistedDrawnIds={boxList.drawnItemIds || []}
              persistedHistory={boxList.history || []}
              removeItemsFromList={boxList.removeItemsFromList ?? true}
              onUpdateState={handleUpdateLootState}
              onResetState={handleResetLootState}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 pt-8 text-center pb-8">
          <p className="text-gray-600 text-sm mb-4">
            &copy; 2026 Loot Box System
          </p>
          <button
            onClick={handleResetData}
            className="text-xs text-red-500/50 hover:text-red-400 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCcw size={12} />
            Borrar todos los datos y reiniciar
          </button>
        </footer>
      </div>
    </main>
  );
}
