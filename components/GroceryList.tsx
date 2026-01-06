
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

type NotificationType = "Lista pronta para providência" | "Em separação" | "Na fila do caixa" | "Produtos separados";

const GroceryList: React.FC<GroceryListProps> = ({ list, currentUser, onBack, onUpdate }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [suggestions, setSuggestions] = useState<GeminiSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'members' | 'params'>('config');
  
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [shareEmail, setShareEmail] = useState('');
  
  // Parâmetros de aviso
  const [webhookUrl, setWebhookUrl] = useState(list.webhookUrl || '');
  const [contactName, setContactName] = useState(list.contactName || '');
  const [contactPhone, setContactPhone] = useState(list.contactPhone || '');
  const [isNotifying, setIsNotifying] = useState(false);
  const [showNotifyMenu, setShowNotifyMenu] = useState(false);

  const activeItems = (list.items || []).filter(i => !i.checked);
  const completedItems = (list.items || []).filter(i => i.checked);

  const toggleItem = (item: GroceryItem) => {
    const updatedItems = list.items.map(i => i.id === item.id ? { ...i, checked: !item.checked } : i);
    const updatedList = { ...list, items: updatedItems };
    onUpdate(updatedList);
  };

  const addItem = (name: string, category: string = 'Geral', quantity?: number) => {
    if (!name.trim()) return;
    const qty = quantity || 1;
    const newItem: GroceryItem = { 
      id: `i${Date.now() + Math.random()}`, 
      name: name.trim(), 
      checked: false, 
      category, 
      quantity: qty, 
      createdAt: Date.now() 
    };
    const updatedList = { ...list, items: [newItem, ...list.items] };
    onUpdate(updatedList);
    setNewItemName('');
    setNewItemQuantity('1');
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
          quantity: 1, 
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

  const handleSaveParams = async () => {
    await storageService.updateListMetadata(list.id, list.name, list.icon, webhookUrl, contactName, contactPhone);
    setIsSettingsOpen(false);
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
                pending_count: activeItems.length
            })
        });
        if (response.ok) {
            alert(`Aviso enviado: ${type}`);
        } else {
            throw new Error();
        }
    } catch (e) {
        alert("Falha ao enviar aviso. Verifique o Webhook.");
    } finally {
        setIsNotifying(false);
    }
  };

  const isNotifyEnabled = !!(list.webhookUrl && list.contactName && list.contactPhone);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 -ml-2 text-slate-600 active:scale-90 transition-transform">
            <IconArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <span>{list.icon}</span> {list.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isNotifyEnabled && (
              <button 
                onClick={() => setShowNotifyMenu(true)} 
                disabled={isNotifying}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-indigo-100 flex items-center gap-2 active:scale-95 transition-all mr-2"
              >
                {isNotifying ? "Enviando..." : "Avisar"}
              </button>
          )}
          <button onClick={() => setIsSmartImportOpen(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <IconMagic className="w-5 h-5" />
          </button>
          <button onClick={() => { setIsSettingsOpen(true); setActiveTab('config'); }} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <IconSettings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Input Manual com Quantidade */}
        <div className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 items-center shadow-inner">
          <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mr-1">Qtd</span>
            <input 
              type="number" 
              className="w-10 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
              value={newItemQuantity}
              onChange={e => setNewItemQuantity(e.target.value)}
              min="1"
            />
          </div>
          <input 
            type="text" 
            placeholder="O que comprar?" 
            className="flex-1 bg-transparent border-none outline-none text-sm px-2 font-bold text-slate-700"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem(newItemName, 'Geral', parseInt(newItemQuantity) || 1)}
          />
          <button 
            onClick={() => addItem(newItemName, 'Geral', parseInt(newItemQuantity) || 1)}
            disabled={!newItemName.trim()}
            className="bg-indigo-600 text-white p-2 rounded-lg shadow-md disabled:opacity-50 active:scale-90 transition-transform"
          >
            <IconPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Lista Ativa */}
        <div className="space-y-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
            <span>Para Comprar</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-full">{activeItems.length}</span>
          </h2>
          {activeItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic text-sm">Lista vazia. Comece a preencher!</div>
          ) : (
            activeItems.map(item => (
              <div key={item.id} className="group flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors shadow-sm">
                <button onClick={() => toggleItem(item)} className="w-6 h-6 border-2 border-slate-200 rounded-full flex items-center justify-center hover:border-indigo-500 bg-white">
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-700 truncate">
                    {item.quantity && item.quantity > 1 && <span className="text-indigo-600 mr-1.5 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">{item.quantity}x</span>}
                    {item.name}
                  </p>
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
            className="w-full py-3 border-2 border-dashed border-indigo-100 rounded-xl flex items-center justify-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors"
          >
            <IconSparkles className={`w-3.5 h-3.5 ${loadingSuggestions ? 'animate-pulse' : ''}`} />
            {loadingSuggestions ? 'IA Pensando...' : 'Sugerir Itens Inteligentes'}
          </button>
          
          {suggestions.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2">
              {suggestions.map((s, idx) => (
                <div key={idx} className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between animate-in slide-in-from-top-2">
                  <div className="flex-1">
                    <p className="text-xs font-black text-indigo-900">{s.name}</p>
                    <p className="text-[10px] text-indigo-600/70 italic leading-tight">{s.reason}</p>
                  </div>
                  <button onClick={() => { addItem(s.name, s.category); setSuggestions(s => s.filter((_, i) => i !== idx)); }} className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
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
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
              <span>No Carrinho</span>
              <span>{completedItems.length}</span>
            </h2>
            {completedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-transparent rounded-xl opacity-60">
                <button onClick={() => toggleItem(item)} className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                  <IconCheck className="w-3 h-3 text-white" />
                </button>
                <p className="text-sm line-through font-bold text-slate-500 flex-1">
                    {item.quantity && item.quantity > 1 && <span className="mr-1">{item.quantity}x</span>}
                    {item.name}
                </p>
                <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-300 hover:text-red-400">
                    <IconTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menu de Seleção de Aviso */}
      {showNotifyMenu && (
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
                  <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
                      <span className="text-xs font-black uppercase tracking-widest">Selecione o aviso</span>
                      <button onClick={() => setShowNotifyMenu(false)}><IconX className="w-5 h-5" /></button>
                  </div>
                  <div className="p-4 space-y-2">
                      {(["Lista pronta para providência", "Em separação", "Na fila do caixa", "Produtos separados"] as NotificationType[]).map(t => (
                          <button 
                            key={t}
                            onClick={() => handleNotify(t)}
                            className="w-full p-4 text-left text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors border border-slate-100 shadow-sm"
                          >
                            {t}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Modal Importação Inteligente */}
      {isSmartImportOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <IconMagic className="w-5 h-5" />
                <h3 className="font-black uppercase tracking-widest text-[10px]">Importação Mágica</h3>
              </div>
              <button onClick={() => setIsSmartImportOpen(false)}><IconX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Cole uma mensagem do WhatsApp ou escreva o que precisa. O aLista vai organizar tudo para você.</p>
              <textarea 
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: 2kg de carne, leite, ovos..."
                value={smartInput}
                onChange={e => setSmartInput(e.target.value)}
              />
              <button 
                onClick={handleSmartImport}
                disabled={isImporting || !smartInput.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {isImporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconSparkles className="w-4 h-4" />}
                Organizar com IA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurações / Membros / Parâmetros */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('config')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-colors ${activeTab === 'config' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50'}`}>Info</button>
              <button onClick={() => setActiveTab('params')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-colors ${activeTab === 'params' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50'}`}>Avisos</button>
              <button onClick={() => setActiveTab('members')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-colors ${activeTab === 'members' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50'}`}>Membros</button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {activeTab === 'config' && (
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Dono da Lista</p>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-[11px] text-white font-black uppercase">{list.ownerName?.charAt(0)}</div>
                        <span className="text-sm font-black text-slate-700">{list.ownerName}</span>
                      </div>
                   </div>
                   <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-100 py-3 rounded-xl text-[10px] font-black text-slate-500 hover:bg-slate-200 uppercase tracking-widest">Fechar</button>
                </div>
              )}

              {activeTab === 'params' && (
                  <div className="space-y-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Parâmetros BotConversa</p>
                      <div className="space-y-3">
                          <div>
                              <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Webhook URL</label>
                              <input 
                                type="text" 
                                value={webhookUrl}
                                onChange={e => setWebhookUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                                placeholder="https://api.botconversa.com.br/..."
                              />
                          </div>
                          <div>
                              <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Nome do Contato</label>
                              <input 
                                type="text" 
                                value={contactName}
                                onChange={e => setContactName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                                placeholder="Nome da pessoa a avisar"
                              />
                          </div>
                          <div>
                              <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Telefone do Contato</label>
                              <input 
                                type="tel" 
                                value={contactPhone}
                                onChange={e => setContactPhone(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                                placeholder="5511999999999"
                              />
                          </div>
                      </div>
                      <button onClick={handleSaveParams} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Salvar Parâmetros</button>
                  </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-4">
                   <div className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="E-mail do familiar..." 
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        value={shareEmail}
                        onChange={e => setShareEmail(e.target.value)}
                      />
                      <button onClick={handleAddShare} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md"><IconPlus className="w-4 h-4"/></button>
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso Compartilhado</h4>
                      <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <span className="text-[10px] font-black text-indigo-900">{list.ownerName} (Dono)</span>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      </div>
                      {list.sharedWith?.map(email => (
                        <div key={email} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                          <span className="text-[10px] text-slate-600 font-black">{email}</span>
                          <button onClick={() => handleRemoveShare(email)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><IconTrash className="w-3.5 h-3.5"/></button>
                        </div>
                      ))}
                   </div>
                   <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-100 py-3 rounded-xl text-[10px] font-black text-slate-500 hover:bg-slate-200 uppercase mt-4">Fechar</button>
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
