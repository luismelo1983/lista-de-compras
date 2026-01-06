
import React, { useState } from 'react';
import { GroceryList, User, Contact } from '../types';
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX, IconChevronUp, IconChevronDown, IconUsers } from './Icons';

interface DashboardProps {
  lists: GroceryList[];
  currentUser: User;
  onSelectKey: (listId: string) => void;
  onCreateList: (name: string, icon: string, contacts: Contact[]) => void;
  onEditList: (listId: string, newName: string, newIcon: string, newWebhookUrl: string, newContacts: Contact[]) => void;
  onDeleteList: (listId: string) => void;
  onMoveList: (listId: string, direction: 'up' | 'down') => void;
}

const EMOJI_OPTIONS = [
    '🛒', '🏠', '🥘', '🍼', '🍎', '🥩', '🥖', '🧹', '🐶', '🚗', '💊', '🎉'
];

const Dashboard: React.FC<DashboardProps> = ({ lists, currentUser, onSelectKey, onCreateList, onEditList, onDeleteList, onMoveList }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState(EMOJI_OPTIONS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newListName.trim()) {
      onCreateList(newListName.trim(), newListIcon, []);
      setNewListName('');
      setIsCreating(false);
    }
  };

  const startEdit = (e: React.MouseEvent, list: GroceryList) => {
      e.stopPropagation();
      setEditingId(list.id);
      setEditName(list.name);
      setEditIcon(list.icon);
      setDeletingId(null);
  };

  const saveEdit = (e: React.MouseEvent | React.KeyboardEvent, list: GroceryList) => {
      e.stopPropagation();
      onEditList(list.id, editName.trim(), editIcon, list.webhookUrl || '', list.contacts || []);
      setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            {greeting}, <span className="text-indigo-600">{currentUser.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            aLista Ativa • {lists.length} Listas
          </p>
        </div>
      </header>

      {lists.length === 0 && !isCreating && (
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-10 text-center space-y-4">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">🛒</div>
          <h2 className="font-bold text-indigo-900">Nenhuma lista ainda?</h2>
          <p className="text-indigo-600/60 text-sm max-w-xs mx-auto">Organize sua rotina criando sua primeira lista no aLista.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 active:scale-95 transition-all"
          >
            Criar Agora
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lists.map((list) => {
          const isEditing = editingId === list.id;
          const isDeleting = deletingId === list.id;
          const isShared = list.userId !== currentUser.id;
          const progress = list.items.length === 0 ? 0 : (list.items.filter(i => i.checked).length / list.items.length) * 100;

          return (
            <div 
              key={list.id} 
              className={`group bg-white rounded-3xl shadow-sm border ${isDeleting ? 'border-red-200 bg-red-50' : 'border-slate-100'} transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col`} 
              onClick={() => !isEditing && !isDeleting && onSelectKey(list.id)}
            >
               {isShared && (
                 <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 uppercase z-10 shadow-sm">
                   <IconUsers className="w-3 h-3" /> Membro
                 </div>
               )}

               <div className="p-6 flex-1 cursor-pointer">
                 {isEditing ? (
                   <div className="space-y-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <select 
                          value={editIcon} 
                          onChange={e => setEditIcon(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                          {EMOJI_OPTIONS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                        </select>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                      </div>
                   </div>
                 ) : (
                   <div className="flex items-center space-x-4 w-full">
                     <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
                        {list.icon}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight truncate">{list.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">{list.items.length} itens</span>
                          {isShared && <span className="text-[10px] text-indigo-400 font-bold truncate">Por {list.ownerName}</span>}
                        </div>
                     </div>
                   </div>
                 )}
                 
                 {!isEditing && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Progresso</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full transition-all duration-1000 ease-out rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width:`${progress}%`}}></div>
                      </div>
                    </div>
                 )}
               </div>

               <div className="px-6 py-4 border-t flex justify-between items-center bg-slate-50/50 border-slate-100">
                    {isEditing ? (
                        <div className="flex space-x-2 w-full">
                          <button onClick={() => setEditingId(null)} className="flex-1 py-2 text-[10px] font-black text-slate-500 bg-white border rounded-xl hover:bg-slate-50 transition-colors uppercase">Voltar</button>
                          <button onClick={e => saveEdit(e, list)} className="flex-1 py-2 text-[10px] font-black text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 transition-colors uppercase">Atualizar</button>
                        </div>
                    ) : isDeleting ? (
                        <div className="flex justify-between w-full items-center animate-in slide-in-from-right-2">
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Excluir lista?</span>
                          <div className="flex space-x-2">
                            <button onClick={e => {e.stopPropagation(); setDeletingId(null)}} className="px-4 py-1.5 text-[10px] font-bold text-slate-500 bg-white border rounded-lg">NÃO</button>
                            <button onClick={e => {e.stopPropagation(); onDeleteList(list.id)}} className="px-4 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-md">SIM</button>
                          </div>
                        </div>
                    ) : (
                        <div className="flex justify-between w-full">
                          <div className="flex gap-1">
                            <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'up')}} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><IconChevronUp className="w-4 h-4"/></button>
                            <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'down')}} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><IconChevronDown className="w-4 h-4"/></button>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={e => startEdit(e, list)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><IconEdit className="w-4 h-4"/></button>
                            <button onClick={e => {e.stopPropagation(); setDeletingId(list.id)}} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"><IconTrash className="w-4 h-4"/></button>
                          </div>
                        </div>
                    )}
               </div>
            </div>
          );
        })}

        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)} 
            className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all h-full min-h-[180px] group"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-100 group-hover:scale-110 transition-all shadow-sm">
              <IconPlus className="w-6 h-6" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest text-center">Nova Lista aLista</span>
          </button>
        )}

        {isCreating && (
           <div className="flex flex-col p-6 rounded-3xl border-2 border-indigo-500 bg-white shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-200">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Nova Lista aLista</h4>
              <div className="flex gap-3 mb-6">
                <select 
                  value={newListIcon} 
                  onChange={e => setNewListIcon(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-3xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  {EMOJI_OPTIONS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                </select>
                <input 
                  autoFocus 
                  type="text" 
                  value={newListName} 
                  onChange={e => setNewListName(e.target.value)} 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" 
                  placeholder="Nome da lista..." 
                  onKeyDown={e => e.key === 'Enter' && handleCreateSubmit()}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setIsCreating(false)} className="px-5 py-3 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase">Cancelar</button>
                <button 
                  onClick={handleCreateSubmit} 
                  disabled={!newListName.trim()} 
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-xl shadow-indigo-200 disabled:opacity-50 transition-all active:scale-95"
                >
                  CRIAR LISTA
                </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
