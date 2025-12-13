import React, { useState } from 'react';
import { GroceryList as GroceryListType, GroceryItem, GeminiSuggestion } from '../types';
import { IconArrowLeft, IconCheck, IconTrash, IconPlus, IconSparkles, IconEdit, IconX, IconShare, IconUsers } from './Icons';
import * as storageService from '../services/storageService';
import * as geminiService from '../services/geminiService';

interface GroceryListProps {
  list: GroceryListType;
  onBack: () => void;
  onUpdate: (updatedList: GroceryListType) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ list, onBack, onUpdate }) => {
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

  // Sorting: unchecked first, then checked (newest checked at bottom of check list)
  const sortedItems = [...list.items].sort((a, b) => {
    if (a.checked === b.checked) return b.createdAt - a.createdAt; // Newest first for same status
    return a.checked ? 1 : -1; // Unchecked first
  });

  // Split into active and completed for visual separation
  const activeItems = sortedItems.filter(i => !i.checked);
  const completedItems = sortedItems.filter(i => i.checked);

  const toggleItem = (itemId: string) => {
    const updatedItems = list.items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const updatedList = { ...list, items: updatedItems };
    onUpdate(updatedList);
    storageService.saveList(updatedList);
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

    const updatedList = { ...list, items: [newItem, ...list.items] };
    onUpdate(updatedList);
    storageService.saveList(updatedList);
    setNewItemName('');
    setIsAdding(false);
  };

  const deleteItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      const updatedList = { ...list, items: list.items.filter(i => i.id !== itemId) };
      onUpdate(updatedList);
      storageService.saveList(updatedList);
    }
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
    } else {
        addItem(newItemName);
    }
    setIsAdding(false);
  };

  const ItemRow: React.FC<{ item: GroceryItem }> = ({ item }) => {
    const isEditing = editingItemId === item.id;

    if (isEditing) {
      return (
        <div className="bg-white p-3 rounded-xl border-2 border-indigo-500 shadow-sm flex items-center gap-2">
          <input 
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="flex-1 outline-none text-slate-800 font-medium"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing();
              if (e.key === 'Escape') setEditingItemId(null);
            }}
          />
          <button onClick={saveEditing} className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200">
            <IconCheck className="w-4 h-4" />
          </button>
          <button onClick={() => setEditingItemId(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div 
        className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${item.checked ? 'bg-slate-50' : 'bg-white shadow-sm border border-slate-100 hover:border-indigo-200'}`}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button 
                onClick={() => toggleItem(item.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.checked ? 'bg-slate-400 border-slate-400 text-white' : 'border-slate-300 hover:border-emerald-400 text-transparent hover:text-emerald-400'}`}
            >
                <IconCheck className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col min-w-0">
                <span className={`text-base font-medium truncate ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                </span>
            </div>
        </div>
        
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
              onClick={() => startEditing(item)}
              className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
          >
              <IconEdit className="w-4 h-4" />
          </button>
          <button 
              onClick={() => deleteItem(item.id)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
              <IconTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <IconArrowLeft />
          </button>
          <div className="flex flex-col">
             <h1 className="font-bold text-xl text-slate-900 flex items-center">
                 <span className="mr-2">{list.icon}</span> {list.name}
             </h1>
             <span className="text-xs text-slate-400 flex items-center">
                {list.sharedWith && list.sharedWith.length > 0 ? (
                    <span className="flex items-center text-indigo-500 font-medium">
                        <IconUsers className="w-3 h-3 mr-1" /> 
                        {list.sharedWith.length + 1} pessoas
                    </span>
                ) : (
                    <span>Pessoal</span>
                )}
                <span className="mx-1">•</span>
                {activeItems.length} a comprar
             </span>
          </div>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={() => setShowShareModal(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors"
                title="Compartilhar Lista"
            >
                <IconShare className="w-5 h-5" />
            </button>
            <button 
                onClick={fetchSuggestions}
                disabled={loadingSuggestions}
                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors relative"
            >
                <IconSparkles className={`w-5 h-5 ${loadingSuggestions ? 'animate-pulse' : ''}`} />
                {suggestions.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800">Compartilhar Lista</h3>
                      <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600">
                          <IconX className="w-5 h-5"/>
                      </button>
                  </div>
                  
                  <div className="p-5">
                      <p className="text-sm text-slate-500 mb-4">Convide familiares para editar esta lista com você em tempo real.</p>
                      
                      <form onSubmit={handleShare} className="flex gap-2 mb-6">
                          <input 
                              type="email" 
                              required
                              placeholder="email@exemplo.com"
                              value={inviteEmail}
                              onChange={e => setInviteEmail(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button 
                            type="submit" 
                            disabled={sharingLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                          >
                              {sharingLoading ? '...' : 'Convidar'}
                          </button>
                      </form>

                      <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-400 uppercase">Quem tem acesso</label>
                          
                          {/* Owner */}
                          <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                      {(list.ownerName || 'Dono').substring(0,2).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-700">
                                      {list.ownerName || 'Dono da Lista'}
                                      <span className="ml-2 text-xs text-slate-400 font-normal">(Dono)</span>
                                  </span>
                              </div>
                          </div>

                          {/* Shared Users */}
                          {list.sharedWith?.map((email) => (
                              <div key={email} className="flex items-center justify-between text-sm group">
                                  <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                          {email.substring(0,2).toUpperCase()}
                                      </div>
                                      <span className="text-slate-600 truncate max-w-[160px]">{email}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleUnshare(email)}
                                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Remover acesso"
                                  >
                                      <IconTrash className="w-4 h-4"/>
                                  </button>
                              </div>
                          ))}
                          
                          {(!list.sharedWith || list.sharedWith.length === 0) && (
                              <p className="text-center text-slate-400 text-xs py-2 italic">Ninguém convidado ainda.</p>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Suggestions Area */}
      {suggestions.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-indigo-800 flex items-center"><IconSparkles className="w-4 h-4 mr-1"/> Sugestões da IA</h3>
                <button onClick={() => setSuggestions([])} className="text-xs text-indigo-500 hover:text-indigo-700">Fechar</button>
              </div>
              <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                            addItem(s.name, s.category);
                            setSuggestions(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="flex items-center space-x-1 bg-white border border-indigo-200 shadow-sm px-3 py-1.5 rounded-full text-sm hover:border-indigo-400 hover:text-indigo-700 transition-colors"
                      >
                          <span className="font-medium text-slate-800">{s.name}</span>
                          <span className="text-xs text-indigo-400 ml-1 opacity-70">({s.category})</span>
                          <IconPlus className="w-3 h-3 ml-1 text-indigo-500" />
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* List Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32">
        {list.items.length === 0 && (
            <div className="text-center py-20 opacity-50">
                <div className="text-6xl mb-4">🥕</div>
                <p className="text-lg font-medium text-slate-600">Sua lista está vazia</p>
                <p className="text-sm text-slate-400">Adicione itens abaixo ou use a varinha mágica da IA para ideias.</p>
            </div>
        )}
        
        {/* Active Items */}
        <div className="space-y-2">
            {activeItems.map((item) => (
                <ItemRow key={item.id} item={item} />
            ))}
        </div>

        {/* Completed Divider */}
        {completedItems.length > 0 && (
            <div className="pt-4">
                <div className="flex items-center mb-2">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">No Carrinho ({completedItems.length})</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <div className="space-y-2 opacity-70">
                    {completedItems.map((item) => (
                        <ItemRow key={item.id} item={item} />
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Sticky Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center space-x-2">
            <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartAdd()}
                placeholder="Adicionar item (ex: 'leite, ovos, pão')..."
                className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
            <button 
                onClick={handleSmartAdd}
                disabled={!newItemName.trim() || isAdding}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
            >
                {isAdding ? (
                   <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                   <IconPlus className="w-6 h-6" />
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default GroceryList;