'use client';

import { useState, useEffect, useRef } from 'react';
import { BoxList, BoxItem, MAX_BOXES, RarityType } from '@/types';
import AddBoxForm from '@/components/AddBoxForm';
import BoxCard from '@/components/BoxCard';
import BoxOpener from '@/components/BoxOpener';
import ListHeader from '@/components/ListHeader';
import HudPanel from '@/components/HudPanel';
import MatrixBackground from '@/components/MatrixBackground';
import { launchOrb }       from '@/utils/orbEffect';
import { launchLightning } from '@/utils/lightningEffect';
import { triggerDestruction } from '@/utils/destroyEffect';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import useLocalStorage from '@/hooks/useLocalStorage';

type PendingOrb      = { targetId: string; rarity: RarityType; buttonRect: DOMRect };
type PendingSequence = { items: BoxItem[]; rarity: RarityType; buttonRect: DOMRect; index: number };

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<'create' | 'play'>('create');

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

  useEffect(() => { setIsMounted(true); }, []);

  // ── Single-item orb animation ────────────────────────────────────
  const [hiddenItemId,  setHiddenItemId]  = useState<string | null>(null);
  const [materializeId, setMaterializeId] = useState<string | null>(null);
  const [pendingOrb,    setPendingOrb]    = useState<PendingOrb | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Range / sequential lightning animation ───────────────────────
  const [hiddenRangeIds,    setHiddenRangeIds]    = useState<Set<string>>(new Set());
  const [materializeRangeIds, setMaterializeRangeIds] = useState<Set<string>>(new Set());
  const [pendingSequence,   setPendingSequence]   = useState<PendingSequence | null>(null);

  // ── Delete confirmation + destroy animation state ────────────────
  const [confirmDelete, setConfirmDelete] = useState<BoxItem | null>(null);
  const [destroyingId,  setDestroyingId]  = useState<string | null>(null);

  /**
   * Runs AFTER the DOM has painted the new card (useEffect = post-render).
   * This is more reliable than setTimeout(60ms).
   *
   * Timeline: orb flight 820ms + impact ~580ms = ~1400ms total.
   * Safety fires at 2500ms so it never races with the animation.
   * `alive` guard ensures reveal() only executes once even if both
   * the animation callback and the safety timer fire close together.
   */
  useEffect(() => {
    if (!pendingOrb) return;
    const { targetId, rarity, buttonRect } = pendingOrb;

    // Find the hidden card in the grid
    const cardEl = document.querySelector<HTMLElement>(`[data-item-id="${targetId}"]`);

    let alive = true;   // guard: only the first reveal() wins
    const reveal = (materialize: boolean) => {
      if (!alive) return;
      alive = false;
      if (safetyRef.current) { clearTimeout(safetyRef.current); safetyRef.current = null; }
      setHiddenItemId(null);
      if (materialize) {
        setMaterializeId(targetId);
        setTimeout(() => setMaterializeId(null), 900);   // animation is 780ms
      }
      setPendingOrb(null);
    };

    if (!cardEl) { reveal(false); return; }

    // Safety: reveal at 2500ms so it never races with the 820+580ms animation
    safetyRef.current = setTimeout(() => reveal(false), 2500);

    const cardRect = cardEl.getBoundingClientRect();

    try {
      launchOrb(buttonRect, cardRect, rarity, () => reveal(true));
    } catch {
      reveal(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOrb]);

  /**
   * Sequential lightning — runs after each index advance.
   * Launches one bolt, waits for it to hit, reveals that card,
   * then advances the index to fire the next bolt.
   *
   * Timeline per card: 260ms flight + 200ms impact + 100ms stagger
   * → 10 cards take ~3.6 s total.
   */
  useEffect(() => {
    if (!pendingSequence) return;
    const { items, buttonRect, rarity, index } = pendingSequence;

    // All cards processed → clean up
    if (index >= items.length) {
      setPendingSequence(null);
      return;
    }

    const item   = items[index];
    const cardEl = document.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`);

    // Card not in DOM yet (shouldn't happen) → reveal and skip
    if (!cardEl) {
      setHiddenRangeIds(prev => { const s = new Set(prev); s.delete(item.id); return s; });
      setPendingSequence(prev => prev ? { ...prev, index: prev.index + 1 } : null);
      return;
    }

    const cardRect = cardEl.getBoundingClientRect();

    const onHit = () => {
      // Reveal with fast materialize
      setHiddenRangeIds(prev => { const s = new Set(prev); s.delete(item.id); return s; });
      setMaterializeRangeIds(prev => new Set([...prev, item.id]));
      setTimeout(() => {
        setMaterializeRangeIds(prev => { const s = new Set(prev); s.delete(item.id); return s; });
      }, 600);

      // Fire next bolt after short stagger
      setTimeout(() => {
        setPendingSequence(prev => prev ? { ...prev, index: prev.index + 1 } : null);
      }, 100);
    };

    try {
      launchLightning(buttonRect, cardRect, rarity, onHit);
    } catch {
      onHit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSequence]);

  const [editingList, setEditingList] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempCreator, setTempCreator] = useState('');
  const [tempRemoveItems, setTempRemoveItems] = useState(true);

  useEffect(() => {
    if (boxList) {
      setTempName(boxList.name);
      setTempDescription(boxList.description);
      setTempCreator(boxList.creatorName);
      setTempRemoveItems(boxList.removeItemsFromList ?? true);
    }
  }, [boxList]);

  const handleAddBox = (
    newBoxes: Omit<BoxItem, 'id' | 'createdAt'> | Omit<BoxItem, 'id' | 'createdAt'>[],
    meta?: { buttonRect: DOMRect; rarity: RarityType },
  ) => {
    const itemsToAdd = Array.isArray(newBoxes) ? newBoxes : [newBoxes];
    const newItems: BoxItem[] = itemsToAdd.map((box, i) => ({
      ...box, id: `${Date.now()}-${i}`, createdAt: new Date(),
    }));

    // All items go into state immediately (cards render hidden)
    setBoxList((prev: BoxList) => ({
      ...prev, items: [...prev.items, ...newItems], updatedAt: new Date(),
    }));

    if (!meta?.buttonRect) return;

    if (newItems.length === 1) {
      // ── Single item → orb animation ──────────────────────────
      const targetId = newItems[0].id;
      setHiddenItemId(targetId);
      setMaterializeId(null);
      setPendingOrb({ targetId, rarity: meta.rarity, buttonRect: meta.buttonRect });
    } else {
      // ── Range → sequential lightning strikes ──────────────────
      setHiddenRangeIds(new Set(newItems.map(i => i.id)));
      setPendingSequence({ items: newItems, rarity: meta.rarity, buttonRect: meta.buttonRect, index: 0 });
    }
  };

  /** Step 1 — show confirmation modal */
  const handleDeleteBox = (id: string) => {
    const item = boxList.items.find((i: BoxItem) => i.id === id);
    if (item) setConfirmDelete(item);
  };

  /** Step 2 — user confirmed: CSS destroy + canvas FX + remove after animation */
  const executeDeleteBox = (item: BoxItem) => {
    setConfirmDelete(null);
    setDestroyingId(item.id);

    const cardEl = document.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`);
    if (cardEl) triggerDestruction(cardEl.getBoundingClientRect(), item.rarity);

    setTimeout(() => {
      setDestroyingId(null);
      setBoxList((prev: BoxList) => ({
        ...prev,
        items: prev.items.filter((i: BoxItem) => i.id !== item.id),
        updatedAt: new Date(),
      }));
    }, 780);   // matches card-destroy animation duration
  };

  const handleSaveListInfo = () => {
    setBoxList((prev: BoxList) => ({
      ...prev, name: tempName, description: tempDescription,
      creatorName: tempCreator, removeItemsFromList: tempRemoveItems, updatedAt: new Date()
    }));
    setEditingList(false);
  };

  const handleUpdateLootState = (drawnItemIds: string[], history: BoxItem[]) =>
    setBoxList((prev: BoxList) => ({ ...prev, drawnItemIds, history, totalOpens: prev.totalOpens + 1, updatedAt: new Date() }));

  const handleResetLootState = () =>
    setBoxList((prev: BoxList) => ({ ...prev, drawnItemIds: [], history: [], updatedAt: new Date() }));

  const handleResetData = () => {
    if (confirm('¿Borrar todos los datos? Esta acción no se puede deshacer.')) {
      setBoxList({
        id: '1', name: 'Mi Lista de Cajas', description: 'Una colección épica de cajas misteriosas',
        creatorName: 'Creador', items: [], removeItemsFromList: true, drawnItemIds: [],
        history: [], totalOpens: 0, createdAt: new Date(), updatedAt: new Date()
      });
      window.localStorage.removeItem('loot-box-data');
    }
  };

  const handleCancelEdit = () => {
    setTempName(boxList.name); setTempDescription(boxList.description);
    setTempCreator(boxList.creatorName); setEditingList(false);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-primary font-mono text-xs tracking-widest animate-data-blink">INICIALIZANDO SISTEMA...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Matrix Background ───────────────────────────────────── */}
      <MatrixBackground />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="pt-10 pb-6 text-center relative z-10 w-full">

        {/* Decorative HUD lines */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute top-1 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        {/* System ID badges */}
        <div className="flex justify-between items-center px-6 mb-6 opacity-40">
          <span className="font-mono text-[9px] tracking-[0.25em] text-primary uppercase">SYS-LOOTBOX v2.0</span>
          <span className="font-mono text-[9px] tracking-[0.25em] text-cyan-500 uppercase animate-data-blink">● ONLINE</span>
          <span className="font-mono text-[9px] tracking-[0.25em] text-primary uppercase">NEXUS-ENGINE</span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl bg-primary/30 scale-150 animate-glow" />
            <div className="relative p-4 rounded-2xl border border-primary/30 bg-black/40 backdrop-blur-sm">
              <span className="material-icons-outlined text-primary animate-neon-flicker" style={{ fontSize: '36px' }}>
                deployed_code
              </span>
            </div>
          </div>
        </div>

        {/* Glitch Title */}
        <div className="relative inline-block mb-3">
          <h1 className="text-4xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 filter drop-shadow-lg tracking-wider">
            LOOT BOX SYSTEM
          </h1>
          {/* Glitch layers */}
          <span className="glitch-layer glitch-layer-1 text-4xl md:text-6xl font-display font-black tracking-wider" aria-hidden>
            LOOT BOX SYSTEM
          </span>
          <span className="glitch-layer glitch-layer-2 text-4xl md:text-6xl font-display font-black tracking-wider" aria-hidden>
            LOOT BOX SYSTEM
          </span>
        </div>

        <p className="text-cyan-400/60 text-sm mb-8 tracking-[0.3em] font-mono uppercase px-4">
          — Crea · Configura · Abre —
        </p>

        {/* ── Mode Toggle — futuristic tabs ──────────────────── */}
        <div className="inline-flex relative border border-white/8 rounded-xl bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Sliding background */}
          <div
            className="absolute top-0 bottom-0 w-1/2 transition-transform duration-300 ease-out"
            style={{
              transform: mode === 'play' ? 'translateX(100%)' : 'translateX(0)',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.1) 100%)',
            }}
          />
          {/* Sliding bottom neon line */}
          <div
            className="absolute bottom-0 h-[2px] w-1/2 transition-transform duration-300 ease-out"
            style={{
              transform: mode === 'play' ? 'translateX(100%)' : 'translateX(0)',
              background: 'linear-gradient(90deg, transparent 0%, #a855f7 30%, #06b6d4 70%, transparent 100%)',
              boxShadow: '0 0 12px #a855f780',
            }}
          />

          <button
            onClick={() => setMode('create')}
            className={`relative z-10 flex items-center gap-2 px-8 py-3 text-sm font-bold font-display uppercase tracking-widest transition-all duration-300 ${
              mode === 'create' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <span className="material-icons-outlined text-base">edit_square</span>
            Crear
          </button>
          <button
            onClick={() => setMode('play')}
            className={`relative z-10 flex items-center gap-2 px-8 py-3 text-sm font-bold font-display uppercase tracking-widest transition-all duration-300 ${
              mode === 'play' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <span className="material-icons-outlined text-base">rocket_launch</span>
            Abrir
          </button>
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-grow container mx-auto px-4 pb-14 max-w-7xl pt-6">

        {/* Edit form */}
        {editingList ? (
          <HudPanel className="mb-8 p-8" label="EDITAR LISTA" tag="CONFIG-MODE" accentColor="#06b6d4">
            <h2 className="text-2xl font-display font-bold mb-6 text-white text-glow">Información de la Lista</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <div className="neon-label mb-2">Nombre de la Lista</div>
                  <input type="text" value={tempName} onChange={e => setTempName(e.target.value)}
                    className="cyber-input" placeholder="Mi Lista de Cajas" />
                </div>
                <div>
                  <div className="neon-label mb-2">Nombre del Creador</div>
                  <input type="text" value={tempCreator} onChange={e => setTempCreator(e.target.value)}
                    className="cyber-input" placeholder="Tu nombre" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer group mt-2">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={tempRemoveItems}
                      onChange={e => setTempRemoveItems(e.target.checked)} />
                    <div className="w-11 h-6 rounded-full border border-purple-900/50 bg-black/50 peer-checked:bg-primary/20 peer-checked:border-primary transition-all
                                    after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-gray-500 after:rounded-full after:h-[18px] after:w-[18px] after:transition-all
                                    peer-checked:after:translate-x-5 peer-checked:after:bg-primary" />
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors font-medium">
                    Eliminar de la lista al sacar (Descuento)
                  </span>
                </label>
              </div>
              <div>
                <div className="neon-label mb-2">Descripción</div>
                <textarea value={tempDescription} onChange={e => setTempDescription(e.target.value)}
                  className="cyber-input h-[150px] resize-none" placeholder="Describe tu lista..." />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleSaveListInfo}
                className="flex-1 relative overflow-hidden group bg-primary/10 border border-primary/40 hover:border-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-display uppercase tracking-wider text-sm">
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="material-icons-outlined text-primary">save</span>
                <span className="relative">Guardar</span>
              </button>
              <button onClick={handleCancelEdit}
                className="flex-1 border border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/20 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-display uppercase tracking-wider text-sm">
                <span className="material-icons-outlined text-sm">close</span>
                Cancelar
              </button>
            </div>
          </HudPanel>
        ) : (
          <ListHeader list={boxList} onEdit={() => setEditingList(true)} />
        )}

        {/* Mode content */}
        <div className="mt-6 flex-grow">
          {mode === 'create' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <AddBoxForm onAdd={handleAddBox} currentCount={boxList.items.length} maxBoxes={MAX_BOXES} />
              </div>

              <div className="lg:col-span-8">
                <HudPanel className="p-6 min-h-[500px] flex flex-col" label="INVENTARIO" tag={`${boxList.items.length}/${MAX_BOXES}`} accentColor="#3b82f6" scanLine>
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                      <span className="material-icons-outlined text-secondary text-xl">inventory_2</span>
                      Cajas Creadas
                      <span className="text-xs text-secondary/60 font-mono ml-1">({boxList.items.length}/{MAX_BOXES})</span>
                    </h3>
                    {/* Progress bar */}
                    <div className="hidden md:flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-500"
                          style={{ width: `${(boxList.items.length / MAX_BOXES) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-600 font-mono">{Math.round((boxList.items.length / MAX_BOXES) * 100)}%</span>
                    </div>
                  </div>

                  {boxList.items.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-600 relative z-10 gap-5">
                      <div className="p-8 rounded-2xl border border-dashed border-gray-800 bg-black/20">
                        <span className="material-icons-outlined text-5xl text-gray-800">add_box</span>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-gray-500 mb-1">Inventario vacío</p>
                        <p className="text-xs text-gray-700 font-mono tracking-widest">AGREGA TU PRIMERA CAJA</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-1 max-h-[580px] custom-scrollbar relative z-10">
                      {boxList.items.map(item => (
                        <div
                          key={item.id}
                          data-item-id={item.id}
                          className={
                            hiddenItemId  === item.id           ? 'opacity-0 scale-0 pointer-events-none' :
                            hiddenRangeIds.has(item.id)         ? 'opacity-0 scale-0 pointer-events-none' :
                            materializeId === item.id           ? 'card-materialize' :
                            materializeRangeIds.has(item.id)    ? 'card-materialize-fast' :
                            destroyingId  === item.id           ? 'card-destroy' :
                            'transition-transform duration-200'
                          }
                        >
                          <BoxCard item={item} onDelete={handleDeleteBox} showDelete />
                        </div>
                      ))}
                    </div>
                  )}
                </HudPanel>
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

      {/* ── Delete confirmation modal ──────────────────────────── */}
      {confirmDelete && (
        <DeleteConfirmModal
          item={confirmDelete}
          onConfirm={() => executeDeleteBox(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="py-6 border-t border-white/4 w-full relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <button onClick={handleResetData}
            className="flex items-center gap-2 text-gray-700 hover:text-red-400 transition-colors group text-sm font-mono tracking-widest">
            <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform duration-500">replay</span>
            RESET SISTEMA
          </button>
          <span className="font-mono text-[10px] text-gray-700 tracking-[0.25em] uppercase">
            © 2026 · NEXUS LOOTBOX ENGINE · v2.0
          </span>
          <div className="flex items-center gap-1.5 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
            <span className="font-mono text-[9px] text-green-400 tracking-widest uppercase">SYSTEM ONLINE</span>
          </div>
        </div>
      </footer>
    </>
  );
}
