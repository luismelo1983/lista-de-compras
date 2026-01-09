import React, { useState, useMemo } from 'react';
import { GroceryList as GroceryListType, GroceryItem, User, Contact } from '../types';
import { 
  IconArrowLeft, IconCheck, IconTrash, IconPlus, 
  IconEdit, IconX, IconSettings, IconSortAlpha, IconDrag
} from './Icons';
import * as storageService from '../services/storageService';

interface GroceryListProps {
  list: GroceryListType;
  currentUser: User;
  onBack: () => void;
  onUpdate: (updatedList: GroceryListType) => void;
}

type NotificationType = "Lista pronta para providência" | "Em separação" | "Na fila do caixa" | "Produtos separados";

const GroceryList: React.FC<GroceryListProps> = ({ list, currentUser, onBack, onUpdate }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
  // Edição de Itens
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemQty, setEditItemQty] = useState('');

  const [isNotifying, setIsNotifying] = useState(false);
  const [showNotifyMenu, setShowNotifyMenu] = useState(false);

  // Ordenação de itens
  const activeItems = useMemo(() => {
    return (list.items || [])
      .filter(i => !i.checked)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [list.items]);

  const completedItems = useMemo(() => {
    return (list.items || [])
      .filter(i => i.checked)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [list.items]);

  const toggleItem = (item: GroceryItem) => {
    const updatedItems = list.items.map(i => i.id === item.id ? { ...i, checked: !item.checked } : i);
    const updatedList = { ...list, items: updatedItems };
    onUpdate(updatedList);
  };

  const addItem = (name: string, quantity: string) => {
    if (!name.trim()) {
        alert("Ops! Informe o nome do item.");
        return;
    }
    // Atribui 1 se quantidade estiver vazia
    const qty = quantity.trim() === '' ? 1 : (parseFloat(quantity) || 1);
    
    const maxOrder = list.items.length > 0 ? Math.max(...list.items.map(i => i.order ?? 0)) : 0;
    const newItem: GroceryItem = { 
      id: `i${Date.now() + Math.random()}`, 
      name: name.trim(), 
      checked: false, 
      category: 'Geral', 
      quantity: qty,
      order: maxOrder + 1,
      createdAt: Date.now() 
    };
    const updatedList = { ...list, items: [newItem, ...list.items] };
    onUpdate(updatedList);
    setNewItemName('');
    setNewItemQuantity('');
  };

  const deleteItem = (item: GroceryItem) => {
    if (window.confirm(`Deseja realmente apagar o item "${item.name}"?`)) {
      const updatedList = { ...list, items: list.items.filter(i => i.id !== item.id) };
      onUpdate(updatedList);
    }
  };

  const startEditItem = (item: GroceryItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemQty(item.quantity?.toString() || '');
  };

  const saveEditItem = (itemId: string) => {
    const updatedItems = list.items.map(i => 
      i.id === itemId ? { ...i, name: editItemName.trim(), quantity: parseFloat(editItemQty) || 1 } : i
    );
    onUpdate({ ...list, items: updatedItems });
    setEditingItemId(null);
  };

  const sortActiveAlphabetically = () => {
    const sorted = [...activeItems].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((item, idx) => {
      item.order = idx;
    });
    const updatedList = { ...list, items: [...sorted, ...completedItems] };
    onUpdate(updatedList);
  };

  // Drag and Drop Logic
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedItemIndex === null) return;
    const items = [...activeItems];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    
    // Update order values
    items.forEach((it, idx) => {
      it.order = idx;
    });
    
    onUpdate({ ...list, items: [...items, ...completedItems] });
    setDraggedItemIndex(null);
  };

  const handleNotify = async (type: NotificationType) => {
    if (!list.webhookUrl) return;
    setIsNotifying(true);
    setShowNotifyMenu(false);
    try {
        const response = await fetch(list.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'ALISTA_NOTIFICATION',
                type,
                list_name: list.name,
                contact_name: list.contactName,
                contact_phone: list.contactPhone,
                user_sender: currentUser.name,
                items_count: list.items.length,
                pending_count: activeItems.length,
                pending_items: activeItems.map(i => `${i.name} (x${i.quantity ?? 1})`).join(', ')
            })
        });
        if (response.ok) alert(`Aviso enviado com sucesso!`);
        else throw new Error();
    } catch (e) {
        alert("Falha ao enviar aviso.");
    } finally {
        setIsNotifying(false);
    }
  };

  const isNotifyEnabled = !!(list.webhookUrl && list.contactName && list.contactPhone);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Simplificado */}
      <div className="px-4 py-3 bg-white border-b flex items-center gap-2 sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 -ml-2 text-slate-600 active:scale-90 transition-transform shrink-0">
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl shrink-0">{list.icon}</span>
          <h1 className="font-black text-slate-800 text-lg truncate flex-1 leading-tight">{list.name}</h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isNotifyEnabled && (
              <button 
                onClick={() => setShowNotifyMenu(true)} 
                disabled={isNotifying}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all"
              >
                {isNotifying ? "..." : "Avisar"}
              </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Input Manual */}
        <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 items-center shadow-inner">
          <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mr-1">Qtd</span>
            <input 
              type="number" 
              className="w-12 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
              value={newItemQuantity}
              onChange={e => setNewItemQuantity(e.target.value)}
              placeholder="1"
              min="1"
              step="any"
            />
          </div>
          <input 
            type="text" 
            placeholder="digite o item" 
            className="flex-1 bg-transparent border-none outline-none text-sm px-2 font-bold text-slate-700"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem(newItemName, newItemQuantity)}
          />
          <button 
            onClick={() => addItem(newItemName, newItemQuantity)}
            className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md active:scale-90 transition-transform"
          >
            <IconPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Lista Ativa */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span>PENDENTES</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[8px] font-bold">{activeItems.length}</span>
            </h2>
            <button 
              onClick={sortActiveAlphabetically}
              className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded-md transition-all"
            >
              <IconSortAlpha className="w-3 h-3" /> Ordenar A-Z
            </button>
          </div>
          {activeItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic text-sm">Nenhum item pendente.</div>
          ) : (
            activeItems.map((item, idx) => (
              <div 
                key={item.id} 
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`group flex items-center gap-3 p-3 bg-white border rounded-2xl shadow-sm transition-all cursor-grab active:cursor-grabbing ${editingItemId === item.id ? 'ring-1 ring-indigo-500 border-indigo-200' : 'border-slate-50 hover:border-indigo-100'}`}
              >
                <div className="p-1 text-slate-300 hover:text-slate-400">
                    <IconDrag className="w-4 h-4" />
                </div>
                
                <button onClick={() => toggleItem(item)} className="w-6 h-6 border-2 border-slate-200 rounded-full flex items-center justify-center hover:border-indigo-500 bg-white shrink-0">
                </button>
                
                <div className="flex-1 min-w-0">
                  {editingItemId === item.id ? (
                    <div className="flex items-center gap-2 w-full">
                       <input 
                         type="number" 
                         value={editItemQty} 
                         onChange={e => setEditItemQty(e.target.value)}
                         className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-bold text-center outline-none"
                         step="any"
                       />
                       <input 
                         autoFocus
                         type="text" 
                         value={editItemName} 
                         onChange={e => setEditItemName(e.target.value)}
                         className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold outline-none"
                         onKeyDown={e => e.key === 'Enter' && saveEditItem(item.id)}
                       />
                       <div className="flex gap-1 shrink-0">
                          <button onClick={() => saveEditItem(item.id)} className="text-emerald-500 p-1"><IconCheck className="w-4 h-4" /></button>
                          <button onClick={() => setEditingItemId(null)} className="text-red-400 p-1"><IconX className="w-4 h-4" /></button>
                       </div>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 truncate flex-1 mr-3">{item.name}</p>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditItem(item)} className="p-1.5 text-slate-300 hover:text-indigo-500"><IconEdit className="w-4 h-4"/></button>
                            <button onClick={() => deleteItem(item)} className="p-1.5 text-slate-300 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                        </div>
                        <span className="text-indigo-600 font-black text-[11px] whitespace-nowrap bg-indigo-50 px-2 py-0.5 rounded-lg shadow-inner">({item.quantity})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lista Comprada - OK's */}
        {completedItems.length > 0 && (
          <div className="space-y-2 pt-6">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span>OK's</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[8px] font-bold">{completedItems.length}</span>
            </h2>
            {completedItems.map(item => (
              <div key={item.id} className="group flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl opacity-60">
                <button onClick={() => toggleItem(item)} className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm shrink-0">
                  <IconCheck className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                    <p className="text-sm line-through font-medium text-slate-500 truncate flex-1 mr-3">{item.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => deleteItem(item)} className="p-1.5 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconTrash className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-white px-2 py-0.5 rounded-lg border border-slate-100">({item.quantity})</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNotifyMenu && (
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                  <div className="p-5 border-b flex justify-between items-center bg-indigo-600 text-white">
                      <span className="text-[10px] font-black uppercase tracking-widest">Enviar Notificação</span>
                      <button onClick={() => setShowNotifyMenu(false)} className="p-1 bg-white/10 rounded-full"><IconX className="w-5 h-5" /></button>
                  </div>
                  <div className="p-4 space-y-2">
                      {(["Lista pronta para providência", "Em separação", "Na fila do caixa", "Produtos separados"] as NotificationType[]).map(t => (
                          <button 
                            key={t}
                            onClick={() => handleNotify(t)}
                            className="w-full p-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100 active:scale-[0.98]"
                          >
                            {t}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GroceryList;
