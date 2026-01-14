
import React, { useState } from 'react';
import { GroceryList, User } from '../types';
import { IconPlus, IconTrash, IconChevronUp, IconChevronDown, IconSettings, IconEdit } from './Icons';

interface DashboardProps {
  lists: GroceryList[];
  currentUser: User;
  onSelectKey: (listId: string) => void;
  onCreateList: (name: string, icon: string) => void;
  onEditList: (listId: string, name: string, icon?: string, webhookUrl?: string, contactName?: string, contactPhone?: string) => void;
  onDeleteList: (listId: string) => void;
  onMoveList: (listId: string, direction: 'up' | 'down') => void;
  onNavigateAdmin?: () => void;
}

const EMOJI_OPTIONS = ['🛒', '🏠', '🥘', '🍼', '🍎', '🥩', '🥖', '🧹', '🐶', '🚗', '💊', '🎉'];

const Dashboard: React.FC<DashboardProps> = ({ lists, currentUser, onSelectKey, onCreateList, onEditList, onDeleteList, onMoveList, onNavigateAdmin }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState(EMOJI_OPTIONS[0]);
  
  const [editingList, setEditingList] = useState<GroceryList | null>(null);
  const [editName, setEditName] = useState('');
  const [editWebhook, setEditWebhook] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const roleLabel = currentUser.role === 'admin' ? 'ADM' : currentUser.role === 'master' ? 'MASTER' : 'MEMBRO';
  const isMaster = currentUser.role === 'master' || currentUser.role === 'admin';

  const openSettings = (e: React.MouseEvent, list: GroceryList) => {
    e.stopPropagation();
    setEditingList(list);
    setEditName(list.name);
    setEditWebhook(list.webhookUrl || '');
    setEditContactName(list.contactName || '');
    setEditContactPhone(list.contactPhone || '');
  };

  const handleSaveSettings = () => {
    if (editingList) {
      onEditList(editingList.id, editName, editingList.icon, editWebhook, editContactName, editContactPhone);
      setEditingList(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {greeting}, <span className="text-indigo-600">{currentUser.name.split(' ')[0]}</span>
                <span className="ml-2 text-[10px] text-slate-400 font-black">({roleLabel})</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gerencie suas listas</p>
        </div>
        {currentUser.role === 'admin' && (
            <button onClick={onNavigateAdmin} className="bg-slate-800 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-all">
                <IconSettings className="w-5 h-5" />
            </button>
        )}
      </header>

      <div className="flex flex-col gap-3">
        {lists.map((list) => (
          <div key={list.id} className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col" onClick={() => onSelectKey(list.id)}>
             <div className="p-4 flex items-center gap-4 cursor-pointer">
               <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0">{list.icon}</div>
               <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-800 text-base leading-tight truncate">{list.name}</h3>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{list.items.length} itens</span>
               </div>
             </div>
             {isMaster && (
                <div className="px-4 py-2 border-t flex justify-between items-center bg-slate-50/30 border-slate-100">
                    <div className="flex gap-2">
                        <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'up')}} className="p-1.5 text-slate-400 hover:text-indigo-600"><IconChevronUp className="w-4 h-4"/></button>
                        <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'down')}} className="p-1.5 text-slate-400 hover:text-indigo-600"><IconChevronDown className="w-4 h-4"/></button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={e => openSettings(e, list)} className="p-1.5 text-slate-400 hover:text-indigo-600" title="Configurações da Lista"><IconSettings className="w-4 h-4" /></button>
                        <button onClick={e => {e.stopPropagation(); if(confirm("Apagar lista permanentemente?")) onDeleteList(list.id)}} className="p-1.5 text-slate-400 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                    </div>
                </div>
             )}
          </div>
        ))}

        {isMaster && !isCreating && (
          <button onClick={() => setIsCreating(true)} className="flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
            <IconPlus className="w-5 h-5" />
            <span className="font-black text-[10px] uppercase tracking-widest">Nova Lista aLista</span>
          </button>
        )}
      </div>

      {/* Modal de Criação */}
      {isCreating && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-white p-6 rounded-3xl shadow-2xl animate-in zoom-in-95 max-w-xs w-full">
              <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-4 text-center">Criar Lista</h4>
              <input autoFocus type="text" value={newListName} onChange={e => setNewListName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mb-4" placeholder="Ex: Mercado da Semana" />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase">Sair</button>
                <button onClick={() => { onCreateList(newListName, newListIcon); setIsCreating(false); setNewListName('') }} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black shadow-lg uppercase">Confirmar</button>
              </div>
          </div>
         </div>
      )}

      {/* Modal de Parametrização */}
      {editingList && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-white p-6 rounded-3xl shadow-2xl animate-in zoom-in-95 max-w-sm w-full space-y-4">
              <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest text-center">Configurações da Lista</h4>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome da Lista</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Webhook Integração (URL)</label>
                <input type="text" value={editWebhook} onChange={e => setEditWebhook(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome Contato</label>
                  <input type="text" value={editContactName} onChange={e => setEditContactName(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold" placeholder="João" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Telefone WhatsApp</label>
                  <input type="text" value={editContactPhone} onChange={e => setEditContactPhone(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold" placeholder="55..." />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button onClick={() => setEditingList(null)} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase">Cancelar</button>
                <button onClick={handleSaveSettings} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black shadow-lg uppercase">Salvar Parâmetros</button>
              </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
