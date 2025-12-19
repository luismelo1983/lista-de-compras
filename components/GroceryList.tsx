
import React, { useState, useRef } from 'react';
import { GroceryList as GroceryListType, GroceryItem, GeminiSuggestion, User, Contact } from '../types';
import { IconArrowLeft, IconCheck, IconTrash, IconPlus, IconSparkles, IconEdit, IconX, IconChevronUp, IconChevronDown, IconShare, IconSettings, IconSortAlpha } from './Icons';
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
  const [notifying, setNotifying] = useState(false);
  const [suggestions, setSuggestions] = useState<GeminiSuggestion[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingQuantity, setEditingQuantity] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Parâmetros editáveis no modal
  const [tempWebhook, setTempWebhook] = useState(list.webhookUrl || '');
  const [tempContacts, setTempContacts] = useState<Contact[]>(list.contacts || []);

  const activeItems = list.items.filter(i => !i.checked);
  const completedItems = list.items.filter(i => i.checked);

  const toggleItem = (item: GroceryItem) => {
    const isNowChecked = !item.checked;
    const updatedItems = list.items.map(i => i.id === item.id ? { ...i, checked: isNowChecked } : i);
    const updatedList = { ...list, items: updatedItems };
    onUpdate(updatedList);
    storageService.saveList(updatedList);
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
    const updatedList = { ...list, items: list.items.filter(i => i.id !== itemId) };
    onUpdate(updatedList);
    storageService.saveList(updatedList);
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
      const idx = list.items.findIndex(i => i.id === itemId);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= list.items.length) return;
      
      const newItems = [...list.items];
      [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
      
      const updatedList = { ...list, items: newItems };
      onUpdate(updatedList);
      storageService.saveList(updatedList);
  };

  const sortAlphabetically = () => {
      const sorted = [...list.items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      const updatedList = { ...list, items: sorted };
      onUpdate(updatedList);
      storageService.saveList(updatedList);
  };

  const saveSettings = () => {
      const updatedList = { ...list, webhookUrl: tempWebhook, contacts: tempContacts };
      onUpdate(updatedList);
      storageService.updateListMetadata(list.id, list.name, list.icon, tempWebhook, tempContacts);
      setIsSettingsOpen(false);
  };

  const handleNotifyGroup = async () => {
    if (!list.webhookUrl) return;
    setNotifying(true);
    try {
        await fetch(list.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'list_ready',
                listName: list.name,
                sender: currentUser.name,
                contacts: list.contacts || [],
                remainingItems: activeItems.map(i => `${i.quantity || 1}x ${i.name}`),
                timestamp: new Date().toISOString()
            })
        });
        alert("Notificação enviada!");
    } catch (error) {
        alert("Erro ao enviar.");
    } finally {
        setNotifying(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-3 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button onClick={onBack} className="p-1.5 text-slate-600"><IconArrowLeft className="w-5 h-5"/></button>
          <h1 className="font-bold text-base text-slate-900 truncate max-w-[150px]">{list.icon} {list.name}</h1>
        </div>
        <div className="flex items-center space-x-1">
            {list.webhookUrl && (
                <button onClick={handleNotifyGroup} disabled={notifying} className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    <IconShare className="w-3 h-3" />
                    <span>{notifying ? '...' : 'Avisar'}</span>
                </button>
            )}
            <button onClick={sortAlphabetically} className="p-1.5 text-slate-400" title="Ordem Alfabética"><IconSortAlpha className="w-4 h-4"/></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-slate-400"><IconSettings className="w-4 h-4" /></button>
            <button onClick={() => geminiService.generateSmartSuggestions(list.items.map(i => i.name)).then(setSuggestions)} className="p-1.5 text-indigo-600 bg-indigo-50 rounded-full ml-1"><IconSparkles className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-24">
        {activeItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-white border-slate-100 shadow-sm group">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
                <button onClick={() => toggleItem(item)} className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                    {/* Correção: Só mostra IconCheck se estiver checado */}
                    {item.checked && <IconCheck className="w-3 h-3 text-slate-400" />}
                </button>
                <div className="flex items-center gap-2 min-w-0 truncate text-sm font-medium text-slate-800">
                    {item.quantity && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1 rounded">x{item.quantity}</span>}
                    <span className="truncate">{item.name}</span>
                </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveItem(item.id, 'up')} className="p-1 text-slate-300 hover:text-indigo-500"><IconChevronUp className="w-3.5 h-3.5"/></button>
                <button onClick={() => moveItem(item.id, 'down')} className="p-1 text-slate-300 hover:text-indigo-500"><IconChevronDown className="w-3.5 h-3.5"/></button>
                <button onClick={() => deleteItem(item.id)} className="p-1 text-slate-300 hover:text-red-500"><IconTrash className="w-3.5 h-3.5"/></button>
            </div>
          </div>
        ))}

        {completedItems.length > 0 && (
            <div className="pt-4 space-y-1.5 opacity-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-2">Já no carrinho</div>
                {completedItems.map((item) => (
                    <div key={item.id} className="flex items-center p-2 rounded-lg bg-slate-50 border border-transparent">
                        <button onClick={() => toggleItem(item)} className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center mr-3"><IconCheck className="w-3 h-3 text-white" /></button>
                        <span className="text-sm line-through text-slate-500">{item.name}</span>
                        <button onClick={() => deleteItem(item.id)} className="ml-auto p-1 text-slate-300"><IconTrash className="w-3.5 h-3.5"/></button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Input de Novo Item */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3 pb-6 flex items-center space-x-2">
            <input type="number" value={newItemQuantity} onChange={(e) => setNewItemQuantity(e.target.value)} placeholder="Qtd" className="w-14 bg-slate-100 px-2 py-2.5 rounded-lg text-xs font-bold text-center outline-none" />
            <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem(newItemName, 'Geral', newItemQuantity ? parseFloat(newItemQuantity) : undefined)} placeholder="Adicionar item..." className="flex-1 bg-slate-100 px-3 py-2.5 rounded-lg text-sm outline-none" />
            <button onClick={() => addItem(newItemName, 'Geral', newItemQuantity ? parseFloat(newItemQuantity) : undefined)} disabled={!newItemName.trim()} className="bg-indigo-600 text-white p-2.5 rounded-lg disabled:opacity-50"><IconPlus className="w-5 h-5" /></button>
      </div>

      {/* Modal de Parâmetros (Configurações) */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-slate-800">Parâmetros da Lista</h2>
                      <button onClick={() => setIsSettingsOpen(false)}><IconX className="w-5 h-5 text-slate-400"/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Webhook BotConversa</label>
                          <input type="text" value={tempWebhook} onChange={e => setTempWebhook(e.target.value)} placeholder="https://api.botconversa.com.br/..." className="w-full text-xs border rounded-lg p-2 bg-slate-50" />
                          <p className="text-[9px] text-slate-400 mt-1 italic">Cole o endpoint do Webhook de entrada do BotConversa aqui.</p>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Contatos para Aviso</label>
                              <button onClick={() => setTempContacts([...tempContacts, {name:'', phone:''}])} className="text-[10px] font-bold text-indigo-600">+ Adicionar</button>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-2">
                            {tempContacts.map((c, i) => (
                                <div key={i} className="flex gap-1">
                                    <input placeholder="Nome" value={c.name} onChange={e => {const nc = [...tempContacts]; nc[i].name = e.target.value; setTempContacts(nc)}} className="w-1/2 text-[10px] border rounded p-1.5" />
                                    <input placeholder="WhatsApp" value={c.phone} onChange={e => {const nc = [...tempContacts]; nc[i].phone = e.target.value; setTempContacts(nc)}} className="w-1/2 text-[10px] border rounded p-1.5" />
                                    <button onClick={() => setTempContacts(tempContacts.filter((_, idx) => idx !== i))} className="text-red-400"><IconX className="w-3 h-3"/></button>
                                </div>
                            ))}
                          </div>
                      </div>

                      <button onClick={saveSettings} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm mt-2">Salvar Configurações</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GroceryList;
