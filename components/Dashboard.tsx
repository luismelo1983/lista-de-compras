
import React, { useState } from 'react';
import { GroceryList, User, Contact } from '../types';
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX, IconChevronUp, IconChevronDown } from './Icons';

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
      <div>
        <h1 className="text-xl font-bold text-slate-800">{greeting}, {currentUser.name}</h1>
        <p className="text-slate-500 text-xs">{lists.length} listas ativas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lists.map((list) => {
          const isEditing = editingId === list.id;
          const isDeleting = deletingId === list.id;
          const progress = list.items.length === 0 ? 0 : (list.items.filter(i => i.checked).length / list.items.length) * 100;

          return (
            <div key={list.id} className={`bg-white rounded-xl shadow-sm border ${isDeleting ? 'border-red-200 bg-red-50' : 'border-slate-100'} relative overflow-hidden flex flex-col`} onClick={() => !isEditing && !isDeleting && onSelectKey(list.id)}>
               <div className="p-4 flex-1 cursor-pointer">
                 {isEditing ? (
                   <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1 text-sm font-bold" />
                   </div>
                 ) : (
                   <div className="flex items-center space-x-3 w-full">
                     <span className="text-2xl">{list.icon}</span>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-base leading-tight truncate">{list.name}</h3>
                        <div className="text-[11px] text-slate-400">{list.items.length} itens</div>
                     </div>
                   </div>
                 )}
                 {!isEditing && (
                    <div className="mt-3 w-full bg-slate-100 h-1 rounded-full overflow-hidden"><div className="bg-slate-800 h-full transition-all" style={{width:`${progress}%`}}></div></div>
                 )}
               </div>
               <div className="border-t p-1.5 flex justify-end bg-slate-50/50 border-slate-100">
                    {isEditing ? (
                        <div className="flex space-x-2"><button onClick={() => setEditingId(null)} className="px-2 py-1 text-[10px] font-bold text-slate-500">Cancelar</button><button onClick={e => saveEdit(e, list)} className="px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 rounded">Salvar</button></div>
                    ) : isDeleting ? (
                        <div className="flex justify-between w-full px-2 items-center"><span className="text-[10px] font-bold text-red-600">Excluir?</span><div className="flex space-x-2"><button onClick={e => {e.stopPropagation(); setDeletingId(null)}} className="px-2 py-1 text-[10px]">Não</button><button onClick={e => {e.stopPropagation(); onDeleteList(list.id)}} className="px-2 py-1 text-[10px] bg-red-600 text-white rounded">Sim</button></div></div>
                    ) : (
                        <div className="flex justify-between w-full">
                          <div className="flex"><button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'up')}} className="p-1 text-slate-400"><IconChevronUp className="w-3 h-3"/></button><button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'down')}} className="p-1 text-slate-400"><IconChevronDown className="w-3 h-3"/></button></div>
                          <div className="flex"><button onClick={e => startEdit(e, list)} className="p-1 text-slate-400"><IconEdit className="w-3 h-3"/></button><button onClick={e => {e.stopPropagation(); setDeletingId(list.id)}} className="p-1 text-slate-400"><IconTrash className="w-3 h-3"/></button></div>
                        </div>
                    )}
               </div>
            </div>
          );
        })}

        {isCreating ? (
           <div className="flex flex-col p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50">
              <input autoFocus type="text" value={newListName} onChange={e => setNewListName(e.target.value)} className="w-full border-emerald-200 rounded px-2 py-1.5 text-sm mb-2" placeholder="Nome da lista..." />
              <div className="flex justify-end space-x-2 mt-auto"><button onClick={() => setIsCreating(false)} className="p-1 text-emerald-600"><IconX className="w-4 h-4" /></button><button onClick={handleCreateSubmit} disabled={!newListName.trim()} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold">Criar</button></div>
          </div>
        ) : (
          <button onClick={() => setIsCreating(true)} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all h-full min-h-[100px]">
            <IconPlus className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-xs text-slate-500">Nova Lista</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
