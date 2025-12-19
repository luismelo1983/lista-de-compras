
import React, { useState } from 'react';
import { GroceryList as GroceryListType, GroceryItem, GeminiSuggestion, User, Contact } from '../types';
import { 
  IconArrowLeft, IconCheck, IconTrash, IconPlus, IconSparkles, 
  IconEdit, IconX, IconChevronUp, IconChevronDown, IconShare, 
  IconSettings, IconSortAlpha, IconShoppingBag, IconMagic, IconUsers 
} from './Icons';
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
  const [suggestions, setSuggestions] = useState<GeminiSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'members'>('config');
  
  // Smart Import
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Temp states for editing
  const [shareEmail, setShareEmail] = useState('');

  const activeItems = (list.items || []).filter(i => !i.checked);
  const completedItems = (list.items || []).filter(i => i.checked);

  const toggleItem = (item: GroceryItem) => {
    const updatedItems = list.items.map(i => i.id === item.id ? { ...i, checked: !item.checked } : i);
    const updatedList = { ...list, items: updatedItems };
    onUpdate(updatedList);
  };

  const addItem = (name: string, category: string = 'Geral', quantity?: number) => {
    if (!name.trim()) return;
    const newItem: GroceryItem = { 
      id: `i${Date.now() + Math.random()}`, 
      name: name.trim(), 
      checked: false, 
      category, 
      quantity: quantity || 1, 
      createdAt: Date.now() 
    };
    const updatedList = { ...list, items: [newItem, ...list.items] };
    onUpdate(updatedList);
    setNewItemName('');
    setNewItemQuantity('');
  };

  const deleteItem = (itemId: string) => {
    const updatedList = { ...list, items: list.items.filter(i => i.id !== itemId) };
    onUpdate(updatedList);
  };

  const handleSmartImport = async () => {
    if (!smartInput.trim()) return;
    setIsImporting(true);
    try {
      const parsed = await geminiService.organizeRawInput(smartInput);
      if (parsed.length > 0) {
        const newItems: GroceryItem[] = parsed.map(it => ({
          id: `i${Date.now() + Math.random()}`,
          name: it.name,
          checked: false,
          category: it.category,
          createdAt: Date.now()
        }));
        const updatedList = { ...list, items: [...newItems, ...list.items] };
        onUpdate(updatedList);
        setIsSmartImportOpen(false);
        setSmartInput('');
      }
    } catch (e) {
      alert("Erro ao processar com IA.");
    } finally {
      setIsImporting(false);
    }
  };

  const getAiSuggestions = async () => {
    setLoadingSuggestions(true);
    const itemNames = list.items.map(i => i.name);
    const result = await geminiService.generateSmartSuggestions(itemNames);
    setSuggestions(result);
    setLoadingSuggestions(false);
  };

  const handleAddShare = async () => {
    if (!shareEmail.trim()) return;
    await storageService.shareList(list.id, shareEmail.trim().toLowerCase());
    setShareEmail('');
  };

  const handleRemoveShare = async (email: string) => {
    await storageService.unshareList(list.id, email);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 -ml-2 text-slate-600 active:scale-90 transition-transform">
            <IconArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <span>{list.icon}</span> {list.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsSmartImportOpen(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <IconMagic className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <IconSettings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Input Manual */}
        <div className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <input 
            type="text" 
            placeholder="Adicionar item..." 
            className="flex-1 bg-transparent border-none outline-none text-sm px-2"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem(newItemName)}
          />
          <button 
            onClick={() => addItem(newItemName)}
            disabled={!newItemName.trim()}
            className="bg-indigo-600 text-white p-2 rounded-lg shadow-sm disabled:opacity-50"
          >
            <IconPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Lista Ativa */}
        <div className="space-y-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Para Comprar</h2>
          {activeItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic text-sm">Lista vazia. Tente a Importação Mágica!</div>
          ) : (
            activeItems.map(item => (
              <div key={item.id} className="group flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors shadow-sm">
                <button onClick={() => toggleItem(item)} className="w-6 h-6 border-2 border-slate-200 rounded-full flex items-center justify-center hover:border-indigo-500">
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                  {item.category && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{item.category}</span>}
                </div>
                <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all">
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sugestões IA */}
        <div className="pt-4 border-t border-slate-100">
          <button 
            onClick={getAiSuggestions} 
            disabled={loadingSuggestions}
            className="w-full py-3 border-2 border-dashed border-indigo-100 rounded-xl flex items-center justify-center gap-2 text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-colors"
          >
            <IconSparkles className={`w-4 h-4 ${loadingSuggestions ? 'animate-pulse' : ''}`} />
            {loadingSuggestions ? 'Gerando sugestões...' : 'Sugerir itens com IA'}
          </button>
          
          {suggestions.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2">
              {suggestions.map((s, idx) => (
                <div key={idx} className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-900">{s.name}</p>
                    <p className="text-[10px] text-indigo-600 italic">{s.reason}</p>
                  </div>
                  <button onClick={() => { addItem(s.name, s.category); setSuggestions(s => s.filter((_, i) => i !== idx)); }} className="bg-indigo-600 text-white p-1.5 rounded-lg">
                    <IconPlus className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista Comprada */}
        {completedItems.length > 0 && (
          <div className="space-y-2 pt-6">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrinho</h2>
            {completedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-transparent rounded-xl opacity-60">
                <button onClick={() => toggleItem(item)} className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <IconCheck className="w-3 h-3 text-white" />
                </button>
                <p className="text-sm line-through text-slate-500">{item.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Importação Inteligente */}
      {isSmartImportOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <IconMagic className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-tight text-sm">Importação Mágica</h3>
              </div>
              <button onClick={() => setIsSmartImportOpen(false)}><IconX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500">Cole uma mensagem do WhatsApp ou escreva o que precisa. A IA vai organizar tudo por categorias automaticamente.</p>
              <textarea 
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: preciso de 2kg de carne, leite, ovos e sabão em pó"
                value={smartInput}
                onChange={e => setSmartInput(e.target.value)}
              />
              <button 
                onClick={handleSmartImport}
                disabled={isImporting || !smartInput.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {isImporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconSparkles className="w-4 h-4" />}
                Processar com IA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurações / Membros */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('config')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${activeTab === 'config' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Configurações</button>
              <button onClick={() => setActiveTab('members')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${activeTab === 'members' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Membros</button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {activeTab === 'config' ? (
                <div className="space-y-4">
                   <p className="text-xs text-slate-500">Ajustes gerais para a lista <strong>{list.name}</strong>.</p>
                   {/* Aqui você pode adicionar edição de ícone ou Webhooks no futuro */}
                   <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-600">Fechar</button>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="E-mail da família..." 
                        className="flex-1 px-3 py-2 bg-slate-50 border rounded-lg text-sm"
                        value={shareEmail}
                        onChange={e => setShareEmail(e.target.value)}
                      />
                      <button onClick={handleAddShare} className="bg-indigo-600 text-white p-2 rounded-lg"><IconPlus className="w-4 h-4"/></button>
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs font-bold text-slate-600">{list.ownerName} (Dono)</span>
                      </div>
                      {list.sharedWith?.map(email => (
                        <div key={email} className="flex items-center justify-between p-2 border border-slate-100 rounded-lg">
                          <span className="text-xs text-slate-600">{email}</span>
                          <button onClick={() => handleRemoveShare(email)} className="text-red-400 p-1"><IconTrash className="w-3 h-3"/></button>
                        </div>
                      ))}
                   </div>
                   <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-600 mt-4">Fechar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroceryList;
