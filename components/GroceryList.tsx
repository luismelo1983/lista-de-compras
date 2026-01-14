
import React, { useState, useMemo } from 'react';
import { GroceryList as GroceryListType, GroceryItem, User } from '../types';
import { IconArrowLeft, IconCheck, IconTrash, IconPlus, IconEdit, IconX, IconSortAlpha, IconDrag } from './Icons';

interface GroceryListProps {
  list: GroceryListType;
  currentUser: User;
  onBack: () => void;
  onUpdate: (updatedList: GroceryListType) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ list, currentUser, onBack, onUpdate }) => {
  const [newItemName, setNewItemName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemQty, setEditItemQty] = useState('');

  const isMaster = currentUser.role === 'master' || currentUser.role === 'admin';
  const canWork = isMaster || currentUser.privilege === 'work';

  const activeItems = useMemo(() => (list.items || []).filter(i => !i.checked).sort((a,b) => (a.order||0) - (b.order||0)), [list.items]);
  const completedItems = useMemo(() => (list.items || []).filter(i => i.checked).sort((a,b) => a.name.localeCompare(b.name)), [list.items]);

  const toggleItem = (item: GroceryItem) => {
    if (!canWork) return;
    onUpdate({ ...list, items: list.items.map(i => i.id === item.id ? { ...i, checked: !item.checked } : i) });
  };

  const addItem = (name: string) => {
    if (!isMaster || !name.trim()) return;
    const newItem: GroceryItem = { id: `i${Date.now()}`, name: name.trim(), checked: false, quantity: 1, order: list.items.length, createdAt: Date.now() };
    onUpdate({ ...list, items: [newItem, ...list.items] });
    setNewItemName('');
  };

  const deleteItem = (item: GroceryItem) => {
    if (!isMaster) return;
    onUpdate({ ...list, items: list.items.filter(i => i.id !== item.id) });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 -ml-2 text-slate-600"><IconArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-black text-slate-800 text-lg truncate flex-1">{list.icon} {list.name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {isMaster && (
            <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border shadow-inner">
                <input 
                    type="text" 
                    placeholder="Novo item..." 
                    className="flex-1 bg-transparent px-2 font-bold text-sm outline-none"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem(newItemName)}
                />
                <button onClick={() => addItem(newItemName)} className="bg-indigo-600 text-white p-2.5 rounded-xl"><IconPlus className="w-4 h-4" /></button>
            </div>
        )}

        <div className="space-y-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">PENDENTES <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{activeItems.length}</span></h2>
          {activeItems.map((item, idx) => (
            <div key={item.id} className={`flex items-center gap-3 p-3 bg-white border rounded-2xl shadow-sm ${!canWork ? 'opacity-80' : ''}`}>
              <button 
                onClick={() => toggleItem(item)} 
                disabled={!canWork}
                className={`w-6 h-6 border-2 rounded-full flex items-center justify-center shrink-0 ${canWork ? 'border-slate-200 hover:border-indigo-500' : 'border-slate-100 bg-slate-50'}`}
              />
              <p className="text-sm font-medium text-slate-700 truncate flex-1">{item.name}</p>
              <div className="flex items-center gap-2">
                {isMaster && <button onClick={() => deleteItem(item)} className="p-1 text-slate-300 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>}
                <span className="text-indigo-600 font-black text-[11px] bg-indigo-50 px-2 py-0.5 rounded-lg">({item.quantity || 1})</span>
              </div>
            </div>
          ))}
        </div>

        {completedItems.length > 0 && (
          <div className="space-y-2 pt-6">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OK's</h2>
            {completedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 border rounded-2xl opacity-60">
                <button onClick={() => toggleItem(item)} disabled={!canWork} className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"><IconCheck className="w-3.5 h-3.5 text-white" /></button>
                <p className="text-sm line-through font-medium text-slate-500 truncate flex-1">{item.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroceryList;
