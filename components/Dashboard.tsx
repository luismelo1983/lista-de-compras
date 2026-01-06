
import React, { useState } from 'react';
import { GroceryList, User, Contact } from '../types';
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX, IconChevronUp, IconChevronDown, IconUsers } from './Icons';

interface DashboardProps {
  lists: GroceryList[];
  currentUser: User;
  onSelectKey: (listId: string) => void;
  onCreateList: (name: string, icon: string) => void;
  onEditList: (listId: string, name: string, icon?: string, webhookUrl?: string, contactName?: string, contactPhone?: string) => void;
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
      onCreateList(newListName.trim(), newListIcon);
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
      onEditList(list.id, editName.trim(), editIcon, list.webhookUrl, list.contactName, list.contactPhone);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lists.map((list) => {
          const isEditing = editingId === list.id;
          const isDeleting = deletingId === list.id;
          const isShared = list.userId !== currentUser.id;
          const progress = list.items.length === 0 ? 0 : (list.items.filter(i => i.checked).length / list.items.length) * 100;

          return (
            <div 
              key={list.id} 
              className={`group bg-white rounded-2xl shadow-sm border ${isDeleting ? 'border-red-200 bg-red-50' : 'border-slate-100'} transition-all hover:shadow-lg relative overflow-hidden flex flex-col`} 
              onClick={() => !isEditing && !isDeleting && onSelectKey(list.id)}
            >
               {isShared && (
                 <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 uppercase z-10 shadow-sm">
                   <IconUsers className="w-2.5 h-2.5" /> Membro
                 </div>
               )}

               <div className="p-4 flex-1 cursor-pointer">
                 {isEditing ? (
                   <div className="space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <select 
                          value={editIcon} 
                          onChange={e => setEditIcon(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xl outline-none"
                        >
                          {EMOJI_OPTIONS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                        </select>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-sm font-bold outline-none" 
                        />
                      </div>
                   </div>
                 ) : (
                   <div className="flex items-center space-x-3 w-full">
                     <div className="bg-slate-50 w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-indigo-50 transition-all">
                        {list.icon}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-slate-800 text-base leading-tight truncate">{list.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-full">{list.items.length} itens</span>
                        </div>
                     </div>
                   </div>
                 )}
                 
                 {!isEditing && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{Math.round(progress)}% Completo</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width:`${progress}%`}}></div>
                      </div>
                    </div>
                 )}
               </div>

               <div className="px-4 py-2 border-t flex justify-between items-center bg-slate-50/50 border-slate-100">
                    {isEditing ? (
                        <div className="flex space-x-2 w-full">
                          <button onClick={() => setEditingId(null)} className="flex-1 py-1 text-[9px] font-black text-slate-500 bg-white border rounded-lg uppercase">Voltar</button>
                          <button onClick={e => saveEdit(e, list)} className="flex-1 py-1 text-[9px] font-black text-white bg-indigo-600 rounded-lg uppercase">OK</button>
                        </div>
                    ) : isDeleting ? (
                        <div className="flex justify-between w-full items-center">
                          <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Excluir?</span>
                          <div className="flex space-x-1">
                            <button onClick={e => {e.stopPropagation(); setDeletingId(null)}} className="px-2 py-1 text-[8px] font-bold text-slate-500 bg-white border rounded">NÃO</button>
                            <button onClick={e => {e.stopPropagation(); onDeleteList(list.id)}} className="px-2 py-1 text-[8px] font-bold bg-red-600 text-white rounded">SIM</button>
                          </div>
                        </div>
                    ) : (
                        <div className="flex justify-between w-full">
                          <div className="flex gap-1">
                            <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'up')}} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all"><IconChevronUp className="w-3.5 h-3.5"/></button>
                            <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'down')}} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all"><IconChevronDown className="w-3.5 h-3.5"/></button>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={e => startEdit(e, list)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all"><IconEdit className="w-3.5 h-3.5"/></button>
                            <button onClick={e => {e.stopPropagation(); setDeletingId(list.id)}} className="p-1.5 text-slate-400 hover:text-red-500 transition-all"><IconTrash className="w-3.5 h-3.5"/></button>
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
            className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all min-h-[120px] group"
          >
            <IconPlus className="w-6 h-6 mb-1" />
            <span className="font-black text-[9px] uppercase tracking-widest">Criar aLista</span>
          </button>
        )}

        {isCreating && (
           <div className="flex flex-col p-4 rounded-2xl border-2 border-indigo-500 bg-white shadow-lg animate-in zoom-in-95">
              <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3">Nova aLista</h4>
              <div className="flex gap-2 mb-4">
                <select 
                  value={newListIcon} 
                  onChange={e => setNewListIcon(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-2xl outline-none"
                >
                  {EMOJI_OPTIONS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                </select>
                <input 
                  autoFocus 
                  type="text" 
                  value={newListName} 
                  onChange={e => setNewListName(e.target.value)} 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none" 
                  placeholder="Nome..." 
                  onKeyDown={e => e.key === 'Enter' && handleCreateSubmit()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsCreating(false)} className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Cancelar</button>
                <button onClick={handleCreateSubmit} disabled={!newListName.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[9px] font-black shadow-md disabled:opacity-50">CRIAR</button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
