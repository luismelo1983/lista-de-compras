
import React, { useState, useRef } from 'react';
import { GroceryList as GroceryListType, GroceryItem, GeminiSuggestion, User } from '../types';
import { IconArrowLeft, IconCheck, IconTrash, IconPlus, IconSparkles, IconEdit, IconX, IconUsers, IconChevronUp, IconChevronDown, IconShare } from './Icons';
import * as storageService from '../services/storageService';
import * as geminiService from '../services/geminiService';

interface GroceryListProps {
  list: GroceryListType;
  currentUser: User;
  onBack: () => void;
  onUpdate: (updatedList: GroceryListType) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ list, currentUser, onBack, onUpdate }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [suggestions, setSuggestions] = useState<GeminiSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingQuantity, setEditingQuantity] = useState('');
  const listContainerRef = useRef<HTMLDivElement>(null);

  const activeItems = list.items.filter(i => !i.checked);
  const completedItems = list.items.filter(i => i.checked).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

  const toggleItem = (item: GroceryItem) => {
    const isNowChecked = !item.checked;
    const updatedItems = list.items.map(i => i.id === item.id ? { ...i, checked: isNowChecked } : i);
    const updatedList = { ...list, items: updatedItems };
    onUpdate(updatedList);
    storageService.saveList(updatedList);

    if (isNowChecked && list.webhookUrl) {
        fetch(list.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'item_completed', listName: list.name, item: item.name, user: currentUser.name, timestamp: new Date().toISOString() })
        }).catch(err => console.error("Webhook failed:", err));
    }
  };

  const handleNotifyGroup = async () => {
    if (!list.webhookUrl || !list.contacts || list.contacts.length === 0) {
        alert("Webhook ou contatos não configurados para esta lista.");
        return;
    }
    
    setNotifying(true);
    try {
        const response = await fetch(list.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'list_ready',
                listName: list.name,
                sender: currentUser.name,
                contacts: list.contacts,
                remainingItems: activeItems.map(i => `${i.quantity || 1}x ${i.name}`),
                totalItems: list.items.length,
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) alert("Notificação enviada com sucesso!");
        else throw new Error("Falha no servidor");
    } catch (error) {
        console.error(error);
        alert("Erro ao enviar notificação.");
    } finally {
        setNotifying(false);
    }
  };

  const addItem = (name: string, category: string = 'Geral', quantity?: number) => {
    if (!name.trim()) return;
    const newItem: GroceryItem = { id: `i${Date.now()}`, name: name.trim(), checked: false, category, quantity, createdAt: Date.now() };
    const updatedList = { ...list, items: [newItem, ...list.items] };
    onUpdate(updatedList);
    storageService.saveList(updatedList);
    setNewItemName('');
    setNewItemQuantity('');
  };

  const deleteItem = (itemId: string) => {
    if (confirm('Remover item?')) {
      const updatedList = { ...list, items: list.items.filter(i => i.id !== itemId) };
      onUpdate(updatedList);
      storageService.saveList(updatedList);
    }
  };

  const saveEditing = () => {
    if (editingItemId && editingName.trim()) {
      const updatedItems = list.items.map(item => item.id === editingItemId ? { ...item, name: editingName.trim(), quantity: editingQuantity ? parseFloat(editingQuantity) : undefined } : item);
      const updatedList = { ...list, items: updatedItems };
      onUpdate(updatedList);
      storageService.saveList(updatedList);
    }
    setEditingItemId(null);
  };

  const ItemRow: React.FC<{ item: GroceryItem, index?: number, isLast?: boolean }> = ({ item, index, isLast }) => {
    const isEditing = editingItemId === item.id;
    if (isEditing) {
      return (
        <div className="bg-white p-2 rounded-lg border border-indigo-500 flex items-center gap-2">
          <input type="number" value={editingQuantity} onChange={(e) => setEditingQuantity(e.target.value)} className="w-12 text-xs border rounded" />
          <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1 text-sm border-b" autoFocus />
          <button onClick={saveEditing} className="p-1 text-green-600"><IconCheck className="w-4 h-4" /></button>
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${item.checked ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button onClick={() => toggleItem(item)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${item.checked ? 'bg-slate-400 border-slate-400 text-white' : 'border-slate-300'}`}><IconCheck className="w-3 h-3" /></button>
            <div className="flex items-center gap-2 min-w-0 truncate">
                {item.quantity && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1 rounded">x{item.quantity}</span>}
                <span className={`text-sm font-medium truncate ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.name}</span>
            </div>
        </div>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => {setEditingItemId(item.id); setEditingName(item.name); setEditingQuantity(item.quantity?.toString() || '')}} className="p-1 text-slate-300 hover:text-indigo-500"><IconEdit className="w-3.5 h-3.5"/></button>
            <button onClick={() => deleteItem(item.id)} className="p-1 text-slate-300 hover:text-red-500"><IconTrash className="w-3.5 h-3.5"/></button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative group">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-3 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-hidden">
          <button onClick={onBack} className="p-1.5 -ml-2 hover:bg-slate-100 rounded-full text-slate-600"><IconArrowLeft className="w-5 h-5"/></button>
          <div className="flex flex-col truncate">
             <h1 className="font-bold text-base text-slate-900 truncate"><span className="mr-1">{list.icon}</span> {list.name}</h1>
             <span className="text-[10px] text-slate-400 truncate">{activeItems.length} faltam • {list.contacts?.length || 0} avisos</span>
          </div>
        </div>
        <div className="flex space-x-1.5">
            <button onClick={handleNotifyGroup} disabled={notifying} className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${notifying ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`} title="Notificar grupo pelo BotConversa">
                <IconShare className="w-3 h-3" />
                <span>{notifying ? 'Enviando...' : 'Avisar Grupo'}</span>
            </button>
            <button onClick={() => geminiService.generateSmartSuggestions(list.items.map(i => i.name)).then(setSuggestions)} className="p-1.5 text-indigo-600 bg-indigo-50 rounded-full"><IconSparkles className="w-4 h-4" /></button>
        </div>
      </div>

      {suggestions.length > 0 && (
          <div className="bg-indigo-50 border-b p-3 flex flex-wrap gap-1.5">
              {suggestions.map((s, idx) => (
                  <button key={idx} onClick={() => {addItem(s.name, s.category); setSuggestions(prev => prev.filter((_, i) => i !== idx))}} className="bg-white border border-indigo-200 px-2 py-1 rounded-full text-[10px] flex items-center gap-1 font-medium">{s.name} <IconPlus className="w-3 h-3"/></button>
              ))}
              <button onClick={() => setSuggestions([])} className="text-[10px] text-indigo-400 ml-auto">Fechar</button>
          </div>
      )}

      <div ref={listContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 pb-24">
        {activeItems.map((item) => <ItemRow key={item.id} item={item} />)}
        {completedItems.length > 0 && (
            <div className="pt-4 space-y-1.5 opacity-60">
                <div className="h-px bg-slate-100 w-full mb-2"></div>
                {completedItems.map((item) => <ItemRow key={item.id} item={item} />)}
            </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3 pb-6 flex items-center space-x-2">
            <input type="number" value={newItemQuantity} onChange={(e) => setNewItemQuantity(e.target.value)} placeholder="Qtd" className="w-14 bg-slate-100 px-2 py-2.5 rounded-lg text-xs font-bold text-center outline-none" />
            <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem(newItemName, 'Geral', newItemQuantity ? parseFloat(newItemQuantity) : undefined)} placeholder="Adicionar item..." className="flex-1 bg-slate-100 px-3 py-2.5 rounded-lg text-sm outline-none" />
            <button onClick={() => addItem(newItemName, 'Geral', newItemQuantity ? parseFloat(newItemQuantity) : undefined)} disabled={!newItemName.trim()} className="bg-indigo-600 text-white p-2.5 rounded-lg disabled:opacity-50"><IconPlus className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

export default GroceryList;
