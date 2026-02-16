'use client';

import { useState, useEffect } from 'react';
import { BoxList, BoxItem, MAX_BOXES } from '@/types';
import AddBoxForm from '@/components/AddBoxForm';
import BoxCard from '@/components/BoxCard';
import BoxOpener from '@/components/BoxOpener';
import ListHeader from '@/components/ListHeader';
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
    return <div className="min-h-screen flex items-center justify-center text-white font-display">Cargando...</div>;
  }

  return (
    <>
      <header className="pt-8 pb-4 text-center relative z-10 w-full">
        <div className="flex justify-center mb-2">
          <span className="material-icons-outlined text-5xl text-primary animate-pulse" style={{ fontSize: '48px' }}>
            deployed_code
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-2 filter drop-shadow-lg">
          Loot Box System
        </h1>
        <p className="text-gray-400 text-lg mb-6 tracking-wide px-4">
          Crea y abre cajas misteriosas con rareza personalizada
        </p>
        <div className="inline-flex bg-gray-200 dark:bg-gray-800/80 p-1 rounded-full border border-gray-300 dark:border-gray-700 shadow-inner">
          <button
            onClick={() => setMode('create')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-full transition-all ${mode === 'create'
              ? 'bg-primary text-white shadow-neon-purple font-bold tracking-wider'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span className="material-icons-outlined text-sm">edit</span>
            <span>Crear Cajas</span>
          </button>
          <button
            onClick={() => setMode('play')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-full transition-all ${mode === 'play'
              ? 'bg-primary text-white shadow-neon-purple font-bold tracking-wider'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span className="material-icons-outlined text-sm">visibility</span>
            <span>Abrir Cajas</span>
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 pb-12 max-w-7xl pt-8">
        {editingList ? (
          <div className="glass-panel rounded-xl p-8 mb-8 border-primary/30">
            <h2 className="text-2xl font-display font-bold mb-6 text-white text-glow">Editar Información de la Lista</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
                    Nombre de la Lista
                  </label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Mi Lista de Cajas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
                    Nombre del Creador
                  </label>
                  <input
                    type="text"
                    value={tempCreator}
                    onChange={(e) => setTempCreator(e.target.value)}
                    className="input-field w-full"
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={tempRemoveItems}
                      onChange={(e) => setTempRemoveItems(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-300">Eliminar de la lista al salir (Descuento)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
                  Descripción
                </label>
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className="input-field w-full h-[155px] resize-none"
                  placeholder="Describe tu lista de cajas..."
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveListInfo}
                className="flex-1 btn-neon bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center space-x-2"
              >
                <span className="material-icons-outlined">save</span>
                <span className="uppercase tracking-wider">Guardar</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span className="material-icons-outlined text-sm">close</span>
                <span className="uppercase tracking-wider">Cancelar</span>
              </button>
            </div>
          </div>
        ) : (
          <ListHeader
            list={boxList}
            onEdit={() => setEditingList(true)}
          />
        )}

        <div className="mt-6 flex-grow">
          {mode === 'create' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <AddBoxForm
                  onAdd={handleAddBox}
                  currentCount={boxList.items.length}
                  maxBoxes={MAX_BOXES}
                />
              </div>

              <div className="lg:col-span-8 glass-panel rounded-xl p-6 min-h-[500px] flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-xl font-display font-bold text-white text-glow">
                    Cajas Creadas ({boxList.items.length}/{MAX_BOXES})
                  </h3>
                </div>

                {boxList.items.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-gray-500 relative z-10">
                    <span className="material-icons-outlined text-6xl mb-4 opacity-30">deployed_code</span>
                    <p className="text-lg font-display">No hay cajas aún. ¡Crea tu primera caja!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto pr-2 max-h-[600px] custom-scrollbar relative z-10">
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

                {/* Background Decor */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
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
      </main>

      <footer className="text-center py-8 text-sm text-gray-500 border-t border-white/5 w-full">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div
            onClick={handleResetData}
            className="flex items-center space-x-2 mb-4 md:mb-0 text-red-500 cursor-pointer hover:text-red-400 transition-colors group"
          >
            <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform duration-500">replay</span>
            <span className="font-medium">Borrar todos los datos y reiniciar</span>
          </div>
          <span className="font-mono opacity-50">© 2026 Loot Box System | Designed for Gamers</span>
        </div>
      </footer>
    </>
  );
}
