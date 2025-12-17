import React, { useState, useRef } from 'react';
import { GroceryList as GroceryListType, GroceryItem, GeminiSuggestion, User } from '../types';
import { IconArrowLeft, IconCheck, IconTrash, IconPlus, IconSparkles, IconEdit, IconX, IconUsers, IconChevronUp, IconChevronDown } from './Icons';
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
  const [isAdding, setIsAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<GeminiSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // State for Editing Item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // State for Sharing Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);

  // Scroll ref
  const listContainerRef = useRef<HTMLDivElement>(null);

  // --- Sorting & Display Logic ---
  // Active items: Use the native array order (allows user reordering)
  const activeItems = list.items.filter(i => !i.checked);
  
  // Completed items: Sorted ALPHABETICALLY (A-Z)
  const completedItems = list.items
    .filter(i => i.checked)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));

  const toggleItem = (item: GroceryItem) => {
    const isNowChecked = !item.checked;
    
    // Update local state and firestore
    const updatedItems = list.items.map(i => 
      i.id === item.id ? { ...i, checked: isNowChecked } : i
    );
    const updatedList = { ...list, items: updatedItems };
    onUpdate(updatedList);
    storageService.saveList(updatedList);

    // --- Webhook Trigger ---
    // Se o item foi marcado como "comprado" e a lista tem um webhook configurado
    if (isNowChecked && list.webhookUrl) {
        fetch(list.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'item_completed',
                listName: list.name,
                item: item.name,
                category: item.category,
                user: currentUser.name,
                userEmail: currentUser.email,
                timestamp: new Date().toISOString()
            })
        }).catch(err => {
            console.error("Webhook trigger failed:", err);
            // Non-blocking error
        });
    }
  };

  const scrollToTop = () => {
    if (listContainerRef.current) {
        // Small timeout to ensure DOM is updated with new item
        setTimeout(() => {
            listContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    }
  };

  const addItem = (name: string, category: string = 'Geral') => {
    if (!name.trim()) return;
    
    const newItem: GroceryItem = {
      id: `i${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      checked: false,
      category,
      createdAt: Date.now(),
    };

    // Add to top (start of array)
    const updatedList = { ...list, items: [newItem, ...list.items] };
    onUpdate(updatedList);
    storageService.saveList(updatedList);
    setNewItemName('');
    setIsAdding(false);
    scrollToTop();
  };

  const deleteItem = (itemId: string) => {
    if (confirm('Remover item?')) {
      const updatedList = { ...list, items: list.items.filter(i => i.id !== itemId) };
      onUpdate(updatedList);
      storageService.saveList(updatedList);
    }
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
      // Create a copy of the main list
      const itemsCopy = [...list.items];
      
      // Find where this item is in the *Active* (unchecked) view logic
      const activeIndices = itemsCopy
        .map((item, index) => ({ ...item, originalIndex: index }))
        .filter(item => !item.checked);

      const currentActiveIndex = activeIndices.findIndex(i => i.id === itemId);
      
      if (currentActiveIndex === -1) return; // Should not happen

      const targetActiveIndex = direction === 'up' ? currentActiveIndex - 1 : currentActiveIndex + 1;

      // Check bounds within active items
      if (targetActiveIndex < 0 || targetActiveIndex >= activeIndices.length) return;

      // Get the actual array indices to swap
      const originalIndexA = activeIndices[currentActiveIndex].originalIndex;
      const originalIndexB = activeIndices[targetActiveIndex].originalIndex;

      // Swap
      [itemsCopy[originalIndexA], itemsCopy[originalIndexB]] = [itemsCopy[originalIndexB], itemsCopy[originalIndexA]];

      const updatedList = { ...list, items: itemsCopy };
      onUpdate(updatedList);
      storageService.saveList(updatedList);
  };

  const startEditing = (item: GroceryItem) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
  };

  const saveEditing = () => {
    if (editingItemId && editingName.trim()) {
      const updatedItems = list.items.map(item => 
        item.id === editingItemId ? { ...item, name: editingName.trim() } : item
      );
      const updatedList = { ...list, items: updatedItems };
      onUpdate(updatedList);
      storageService.saveList(updatedList);
    }
    setEditingItemId(null);
    setEditingName('');
  };

  const handleShare = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim()) return;
      setSharingLoading(true);
      try {
          await storageService.shareList(list.id, inviteEmail.trim());
          setInviteEmail('');
      } catch (error) {
          console.error(error);
          alert('Erro ao compartilhar.');
      } finally {
          setSharingLoading(false);
      }
  };

  const handleUnshare = async (email: string) => {
      if(confirm(`Remover acesso de ${email}?`)) {
          await storageService.unshareList(list.id, email);
      }
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    const names = list.items.map(i => i.name);
    const results = await geminiService.generateSmartSuggestions(names);
    setSuggestions(results);
    setLoadingSuggestions(false);
  };

  const handleSmartAdd = async () => {
    if (!newItemName.includes(',')) {
        addItem(newItemName);
        return;
    }
    setIsAdding(true);
    const parsed = await geminiService.organizeRawInput(newItemName);
    if (parsed.length > 0) {
        const newItems = parsed.map(p => ({
            id: `i${Date.now()}-${Math.random()}`,
            name: p.name,
            checked: false,
            category: p.category,
            createdAt: Date.now(),
        }));
        const updatedList = { ...list, items: [...newItems, ...list.items] };
        onUpdate(updatedList);
        storageService.saveList(updatedList);
        setNewItemName('');
        scrollToTop();
    } else {
        addItem(newItemName);
    }
    setIsAdding(false);
  };

  const ItemRow: React.FC<{ item: GroceryItem, index?: number, isLast?: boolean }> = ({ item, index, isLast }) => {
    const isEditing = editingItemId === item.id;
    const isActive = !item.checked;

    if (isEditing) {
      return (
        <div className="bg-white p-2 rounded-lg border border-indigo-500 shadow-sm flex items-center gap-2">
          <input 
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="flex-1 outline-none text-slate-800 text-sm font-medium"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing();
              if (e.key === 'Escape') setEditingItemId(null);
            }}
          />
          <button onClick={saveEditing} className="p-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
            <IconCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setEditingItemId(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div 
        className={`group flex items-center justify-between p-2.5 rounded-lg transition-all duration-300 ${item.checked ? 'bg-slate-50' : 'bg-white shadow-sm border border-slate-100 hover:border-indigo-200'}`}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button 
                onClick={() => toggleItem(item)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.checked ? 'bg-slate-400 border-slate-400 text-white' : 'border-slate-300 hover:border-emerald-400 text-transparent hover:text-emerald-400'}`}
            >
                <IconCheck className="w-3 h-3" />
            </button>
            <div className="flex flex-col min-w-0">
                <span className={`text-sm font-medium truncate ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                </span>
            </div>
        </div>
        
        <div className="flex items-center">
           {isActive && (
             <div className="flex items-center gap-2 mr-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                   disabled={index === 0}
                   onClick={() => moveItem(item.id, 'up')}
                   className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-slate-50 rounded disabled:opacity-20 disabled:hover:text-slate-300 disabled:hover:bg-transparent transition-colors"
                   title="Mover para cima"
                >
                    <IconChevronUp className="w-4 h-4" />
                </button>
                <button 
                   disabled={isLast}
                   onClick={() => moveItem(item.id, 'down')}
                   className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-slate-50 rounded disabled:opacity-20 disabled:hover:text-slate-300 disabled:hover:bg-transparent transition-colors"
                   title="Mover para baixo"
                >
                    <IconChevronDown className="w-4 h-4" />
                </button>
             </div>
           )}

           <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity border-l border-slate-100 pl-1 ml-1">
              <button 
                  onClick={() => startEditing(item)}
                  className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all"
              >
                  <IconEdit className="w-3.5 h-3.5" />
              </button>
              <button 
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              >
                  <IconTrash className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Reduced */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-3 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button onClick={onBack} className="p-1.5 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <IconArrowLeft className="w-5 h-5"/>
          </button>
          <div className="flex flex-col">
             <h1 className="font-bold text-lg text-slate-900 flex items-center">
                 <span className="mr-1.5 text-xl">{list.icon}</span> {list.name}
             </h1>
             <span className="text-[10px] text-slate-400 flex items-center">
                {list.sharedWith && list.sharedWith.length > 0 ? (
                    <span className="flex items-center text-indigo-500 font-medium">
                        <IconUsers className="w-3 h-3 mr-1" /> 
                        {list.sharedWith.length + 1}
                    </span>
                ) : (
                    <span>Pessoal</span>
                )}
                <span className="mx-1">•</span>
                {activeItems.length} a comprar
             </span>
          </div>
        </div>
        <div className="flex space-x-1.5">
            {/* Share button removed as per request */}
            <button 
                onClick={fetchSuggestions}
                disabled={loadingSuggestions}
                className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors relative"
            >
                <IconSparkles className={`w-4 h-4 ${loadingSuggestions ? 'animate-pulse' : ''}`} />
            </button>
        </div>
      </div>

      {/* Share Modal Reduced */}
      {showShareModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-base text-slate-800">Compartilhar Lista</h3>
                      <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600">
                          <IconX className="w-4 h-4"/>
                      </button>
                  </div>
                  
                  <div className="p-4">
                      <p className="text-xs text-slate-500 mb-3">Convide familiares por email.</p>
                      
                      <form onSubmit={handleShare} className="flex gap-2 mb-4">
                          <input 
                              type="email" 
                              required
                              placeholder="email@exemplo.com"
                              value={inviteEmail}
                              onChange={e => setInviteEmail(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button 
                            type="submit" 
                            disabled={sharingLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                          >
                              {sharingLoading ? '...' : 'Convidar'}
                          </button>
                      </form>

                      <div className="space-y-2 max-h-40 overflow-y-auto">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Acesso</label>
                          
                          {/* Owner */}
                          <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                                      {(list.ownerName || 'Dono').substring(0,2).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-700">
                                      {list.ownerName || 'Dono'} <span className="text-slate-400">(Dono)</span>
                                  </span>
                              </div>
                          </div>

                          {/* Shared Users */}
                          {list.sharedWith?.map((email) => (
                              <div key={email} className="flex items-center justify-between text-xs group">
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                          {email.substring(0,2).toUpperCase()}
                                      </div>
                                      <span className="text-slate-600 truncate max-w-[140px]">{email}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleUnshare(email)}
                                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                  >
                                      <IconTrash className="w-3.5 h-3.5"/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Suggestions Area Reduced */}
      {suggestions.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-3">
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-xs font-bold text-indigo-800 flex items-center"><IconSparkles className="w-3.5 h-3.5 mr-1"/> Sugestões</h3>
                <button onClick={() => setSuggestions([])} className="text-[10px] text-indigo-500 hover:text-indigo-700">Fechar</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                            addItem(s.name, s.category);
                            setSuggestions(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="flex items-center space-x-1 bg-white border border-indigo-200 shadow-sm px-2.5 py-1 rounded-full text-xs hover:border-indigo-400 hover:text-indigo-700 transition-colors"
                      >
                          <span className="font-medium text-slate-800">{s.name}</span>
                          <IconPlus className="w-3 h-3 ml-1 text-indigo-500" />
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* List Items Container with Ref for scrolling */}
      <div 
        ref={listContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 pb-24"
      >
        {list.items.length === 0 && (
            <div className="text-center py-16 opacity-50">
                <div className="text-5xl mb-3">🥕</div>
                <p className="text-base font-medium text-slate-600">Lista vazia</p>
                <p className="text-xs text-slate-400">Adicione itens abaixo.</p>
            </div>
        )}
        
        {/* Active Items */}
        <div className="space-y-1.5">
            {activeItems.map((item, idx) => (
                <ItemRow 
                    key={item.id} 
                    item={item} 
                    index={idx} 
                    isLast={idx === activeItems.length - 1}
                />
            ))}
        </div>

        {/* Completed Divider */}
        {completedItems.length > 0 && (
            <div className="pt-4">
                <div className="flex items-center mb-1.5">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">No Carrinho ({completedItems.length})</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <div className="space-y-1.5 opacity-60">
                    {completedItems.map((item) => (
                        <ItemRow key={item.id} item={item} />
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Sticky Bottom Input Reduced */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center space-x-2">
            <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartAdd()}
                placeholder="Adicionar item..."
                className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-500 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
            <button 
                onClick={handleSmartAdd}
                disabled={!newItemName.trim() || isAdding}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
            >
                {isAdding ? (
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                   <IconPlus className="w-5 h-5" />
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default GroceryList;