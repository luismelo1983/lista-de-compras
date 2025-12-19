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
    '🛒', '🥬', '🥩', '🥖', '💊', '🎁', '🧹', '🎉', '🍼', '🏠', '🐶', '🛠️',
    '🥕', '🍎', '🍌', '🥛', '🧀', '🍗', '🍳', '🍕', '🍔', '🍟', '🍦', '🍫',
    '☕', '🍺', '🍷', '🧼', '🧻', '📚', '✏️', '💻', '🪴', '🌸', '🚗', '⛺',
    '🏖️', '✈️', '🎮', '⚽', '🎨', '👗', '👔', '👠', '🕶️', '💍', '📦', '💡'
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
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{greeting}, {currentUser.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Você tem {lists.length} listas ativas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lists.map((list) => {
          const isEditing = editingId === list.id;
          const isDeleting = deletingId === list.id;
          const isShared = list.userId !== currentUser.id;
          const progress = list.items.length === 0 ? 0 : (list.items.filter(i => i.checked).length / list.items.length) * 100;

          return (
            <div 
              key={list.id} 
              className={`group bg-white rounded-2xl shadow-sm border ${isDeleting ? 'border-red-200 bg-red-50' : 'border-slate-100'} transition-all hover:shadow-md relative overflow-hidden flex flex-col`} 
              onClick={() => !isEditing && !isDeleting && onSelectKey(list.id)}
            >
               {isShared && (
                 <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg flex items-center gap-1 uppercase z-10">
                   <IconUsers className="w-2.5 h-2.5" /> Compartilhada
                 </div>
               )}

               <div className="p-5 flex-1 cursor-pointer">
                 {isEditing ? (
                   <div className="space-y-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <select 
                          value={editIcon} 
                          onChange={e => setEditIcon(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xl"
                        >
                          {EMOJI_OPTIONS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                        </select>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          className="flex-1 bg-white border border-indigo-300 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                      </div>
                   </div>
                 ) : (
                   <div className="flex items-start space-x-4 w-full">
                     <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                        {list.icon}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{list.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{list.items.length} itens</span>
                          {isShared && <span className="text-[10px] text-indigo-400 font-medium italic truncate max-w-[120px]">por {list.ownerName}</span>}
                        </div>
                     </div>
                   </div>
                 )}
                 {!isEditing && (
                    <div className="mt-5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase">
                        <span>Progresso</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-500 ease-out" style={{width:`${progress}%`}}></div>
                      </div>
                    </div>
                 )}
               </div>

               <div className="px-4 py-2 border-t flex justify-between items-center bg-slate-50/30 border-slate-100">
                    {isEditing ? (
                        <div className="flex space-x-2 w-full">
                          <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 bg-white border rounded-lg hover:bg-slate-50 transition-colors uppercase">Cancelar</button>
                          <button onClick={e => saveEdit(e, list)} className="flex-1 py-1.5 text-[10px] font-bold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors uppercase">Salvar</button>
                        </div>
                    ) : isDeleting ? (
                        <div className="flex justify-between w-full items-center">
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Excluir lista?</span>
                          <div className="flex space-x-2">
                            <button onClick={e => {e.stopPropagation(); setDeletingId(null)}} className="px-3 py-1 text-[10px] font-bold text-slate-500 bg-white border rounded-lg">NÃO</button>
                            <button onClick={e => {e.stopPropagation(); onDeleteList(list.id)}} className="px-3 py-1 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm">SIM, EXCLUIR</button>
                          </div>
                        </div>
                    ) : (
                        <div className="flex justify-between w-full">
                          <div className="flex gap-1">
                            <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'up')}} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all"><IconChevronUp className="w-3.5 h-3.5"/></button>
                            <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'down')}} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all"><IconChevronDown className="w-3.5 h-3.5"/></button>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={e => startEdit(e, list)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all"><IconEdit className="w-3.5 h-3.5"/></button>
                            <button onClick={e => {e.stopPropagation(); setDeletingId(list.id)}} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-all"><IconTrash className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                    )}
               </div>
            </div>
          );
        })}

        {isCreating ? (
           <div className="flex flex-col p-5 rounded-2xl border-2 border-indigo-400 bg-indigo-50 shadow-lg animate-in zoom-in-95">
              <div className="flex gap-2 mb-4">
                <select 
                  value={newListIcon} 
                  onChange={e => setNewListIcon(e.target.value)}
                  className="bg-white border border-indigo-200 rounded-xl p-2 text-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {EMOJI_OPTIONS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                </select>
                <input 
                  autoFocus 
                  type="text" 
                  value={newListName} 
                  onChange={e => setNewListName(e.target.value)} 
                  className="flex-1 border-indigo-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Nome da lista..." 
                  onKeyDown={e => e.key === 'Enter' && handleCreateSubmit()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">CANCELAR</button>
                <button 
                  onClick={handleCreateSubmit} 
                  disabled={!newListName.trim()} 
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all active:scale-95"
                >
                  CRIAR LISTA
                </button>
              </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsCreating(true)} 
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all h-full min-h-[140px] group"
          >
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-indigo-100 transition-colors">
              <IconPlus className="w-6 h-6" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest">Nova Lista</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;