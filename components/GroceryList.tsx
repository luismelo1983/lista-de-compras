
import React, { useState, useMemo } from 'react';
import { GroceryList as GroceryListType, GroceryItem, User, ListPrivilege } from '../types';
import { IconArrowLeft, IconCheck, IconTrash, IconPlus, IconShare, IconChevronUp, IconChevronDown } from './Icons';

interface GroceryListProps {
  list: GroceryListType;
  currentUser: User;
  onBack: () => void;
  onUpdate: (updatedList: GroceryListType) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ list, currentUser, onBack, onUpdate }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  // Privilégio específico para esta lista
  const userPrivilege: ListPrivilege = currentUser.role === 'admin' || currentUser.role === 'master' 
    ? 'work' 
    : (currentUser.listPermissions?.[list.id] || 'none');

  const isMaster = currentUser.role === 'master' || currentUser.role === 'admin';
  const canWork = userPrivilege === 'work';

  const activeItems = useMemo(() => (list.items || []).filter(i => !i.checked).sort((a,b) => (a.order||0) - (b.order||0)), [list.items]);
  const completedItems = useMemo(() => (list.items || []).filter(i => i.checked).sort((a,b) => a.name.localeCompare(b.name)), [list.items]);

  const toggleItem = (item: GroceryItem) => {
    if (!canWork) return;
    onUpdate({ ...list, items: list.items.map(i => i.id === item.id ? { ...i, checked: !item.checked } : i) });
  };

  const updateItemQuantity = (item: GroceryItem, delta: number) => {
    if (!canWork) return;
    const newQty = Math.max(1, (item.quantity || 1) + delta);
    onUpdate({ 
      ...list, 
      items: list.items.map(i => i.id === item.id ? { ...i, quantity: newQty } : i) 
    });
  };

  const addItem = () => {
    if (!isMaster || !newItemName.trim()) return;
    const newItem: GroceryItem = { 
      id: `i${Date.now()}`, 
      name: newItemName.trim(), 
      checked: false, 
      quantity: newItemQty, 
      order: list.items.length, 
      createdAt: Date.now() 
    };
    onUpdate({ ...list, items: [newItem, ...list.items] });
    setNewItemName('');
    setNewItemQty(1);
  };

  const deleteItem = (item: GroceryItem) => {
    if (!isMaster) return;
    onUpdate({ ...list, items: list.items.filter(i => i.id !== item.id) });
  };

  const handleNotify = () => {
    if (!list.contactPhone) {
        alert("Nenhum telefone configurado para esta lista.");
        return;
    }
    const message = `aLista: Itens pendentes na lista ${list.name}:\n` + activeItems.map(i => `- ${i.name} (${i.quantity || 1})`).join('\n');
    const url = `https://wa.me/${list.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 -ml-2 text-slate-600"><IconArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-black text-slate-800 text-lg truncate flex-1">{list.icon} {list.name}</h1>
        {canWork && list.contactPhone && (
            <button onClick={handleNotify} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                <IconShare className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Avisar Grupo</span>
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {isMaster && (
            <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border shadow-inner">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome do item..." 
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                    value={newItemName} 
                    onChange={e => setNewItemName(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && addItem()} 
                  />
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <button onClick={() => setNewItemQty(prev => Math.max(1, prev - 1))} className="px-2 py-1 text-slate-400 hover:text-indigo-600 transition-colors"><IconChevronDown className="w-4 h-4" /></button>
                    <input 
                      type="number" 
                      className="w-10 text-center font-black text-xs text-indigo-600 bg-transparent outline-none" 
                      value={newItemQty} 
                      onChange={e => setNewItemQty(parseInt(e.target.value) || 1)}
                    />
                    <button onClick={() => setNewItemQty(prev => prev + 1)} className="px-2 py-1 text-slate-400 hover:text-indigo-600 transition-colors"><IconChevronUp className="w-4 h-4" /></button>
                  </div>
                </div>
                <button onClick={addItem} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <IconPlus className="w-4 h-4" /> Adicionar à Lista
                </button>
            </div>
        )}

        <div className="space-y-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">PENDENTES <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{activeItems.length}</span></h2>
          {activeItems.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 p-3 bg-white border rounded-2xl shadow-sm ${!canWork ? 'opacity-80' : ''}`}>
              <button onClick={() => toggleItem(item)} disabled={!canWork} className={`w-8 h-8 border-2 rounded-full flex items-center justify-center shrink-0 transition-all ${canWork ? 'border-slate-200 hover:border-indigo-500 hover:bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
                {item.checked && <IconCheck className="w-4 h-4 text-indigo-600" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Adicionado em {new Date(item.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 rounded-xl border border-slate-100 p-1">
                <button 
                  onClick={() => updateItemQuantity(item, -1)} 
                  disabled={!canWork}
                  className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                >
                  <IconChevronDown className="w-4 h-4" />
                </button>
                <span className="w-6 text-center text-xs font-black text-indigo-600">{item.quantity || 1}</span>
                <button 
                  onClick={() => updateItemQuantity(item, 1)} 
                  disabled={!canWork}
                  className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                >
                  <IconChevronUp className="w-4 h-4" />
                </button>
              </div>

              {isMaster && (
                <button onClick={() => deleteItem(item)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <IconTrash className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {completedItems.length > 0 && (
          <div className="space-y-2 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OK's</h2>
              <span className="text-[9px] font-black text-slate-300 uppercase">{completedItems.length} concluídos</span>
            </div>
            {completedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-transparent rounded-2xl opacity-60">
                <button onClick={() => toggleItem(item)} disabled={!canWork} className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100"><IconCheck className="w-4 h-4 text-white" /></button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through font-bold text-slate-500 truncate">{item.name}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.quantity || 1} unidade(s)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroceryList;
