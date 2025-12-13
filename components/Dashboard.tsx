import React, { useState } from 'react';
import { GroceryList, User } from '../types';
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX, IconUsers } from './Icons';

interface DashboardProps {
  lists: GroceryList[];
  currentUser: User;
  onSelectKey: (listId: string) => void;
  onCreateList: (name: string) => void;
  onEditList: (listId: string, newName: string, newIcon: string) => void;
  onDeleteList: (listId: string) => void;
}

const EMOJI_OPTIONS = ['🛒', '🥬', '🥩', '🥖', '💊', '🎁', '🧹', '🎉', '🍼', '🏠', '🐶', '🛠️'];

const Dashboard: React.FC<DashboardProps> = ({ lists, currentUser, onSelectKey, onCreateList, onEditList, onDeleteList }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');

  // States for Inline Editing and Deleting
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Determine greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // --- Create Handlers ---
  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newListName.trim()) {
      onCreateList(newListName.trim());
      setNewListName('');
      setIsCreating(false);
    }
  };

  const cancelCreate = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsCreating(false);
      setNewListName('');
  };

  // --- Edit Handlers ---
  const startEdit = (e: React.MouseEvent, list: GroceryList) => {
      e.stopPropagation();
      setEditingId(list.id);
      setEditName(list.name);
      setEditIcon(list.icon);
      setDeletingId(null); // Close delete confirmation if open
  };

  const saveEdit = (e: React.MouseEvent | React.KeyboardEvent, listId: string) => {
      e.stopPropagation();
      const currentList = lists.find(l => l.id === listId);
      const nameChanged = editName.trim() && editName !== currentList?.name;
      const iconChanged = editIcon !== currentList?.icon;

      if (nameChanged || iconChanged) {
          onEditList(listId, editName.trim() || (currentList?.name || ''), editIcon);
      }
      setEditingId(null);
      setEditName('');
      setEditIcon('');
  };

  const cancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
      setEditName('');
      setEditIcon('');
  };

  // --- Delete Handlers ---
  const startDelete = (e: React.MouseEvent, listId: string) => {
      e.stopPropagation();
      setDeletingId(listId);
      setEditingId(null); // Close edit if open
  };

  const confirmDelete = (e: React.MouseEvent, listId: string) => {
      e.stopPropagation();
      onDeleteList(listId);
      setDeletingId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setDeletingId(null);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{greeting}, {currentUser.name}</h1>
          <p className="text-slate-500 text-sm">Vocês têm {lists.length} listas de compras ativas</p>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md ring-4 ring-white">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Lists Grid */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-slate-800">Suas Listas</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => {
            const itemCount = list.items.length;
            const checkedCount = list.items.filter(i => i.checked).length;
            const progress = itemCount === 0 ? 0 : (checkedCount / itemCount) * 100;
            const isEditing = editingId === list.id;
            const isDeleting = deletingId === list.id;
            
            // Check if user is owner or invited
            const isOwner = list.userId === currentUser.id;
            const isShared = list.sharedWith && list.sharedWith.length > 0;

            return (
              <div
                key={list.id}
                className={`group bg-white hover:bg-slate-50 transition-all duration-200 rounded-2xl shadow-sm border ${isDeleting ? 'border-red-200 bg-red-50' : 'border-slate-100'} relative overflow-hidden flex flex-col`}
                onClick={() => !isEditing && !isDeleting && onSelectKey(list.id)}
              >
                 <div className={`absolute top-0 left-0 w-1.5 h-full ${list.color}`}></div> {/* Color strip */}
                 
                 <div className="p-5 flex-1 cursor-pointer">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex flex-col w-full">
                       
                       {isEditing ? (
                         // Edit Mode Layout
                         <div className="w-full space-y-3">
                            <div className="flex items-center space-x-2">
                                <span className="text-3xl bg-slate-100 p-1 rounded cursor-default">{editIcon}</span>
                                <input 
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit(e, list.id);
                                        if (e.key === 'Escape') cancelEdit(e as any);
                                    }}
                                    autoFocus
                                    className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1.5 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Escolha um ícone:</p>
                                <div className="flex flex-wrap gap-2">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditIcon(emoji);
                                            }}
                                            className={`w-8 h-8 flex items-center justify-center rounded-md text-lg transition-colors ${editIcon === emoji ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-white hover:bg-slate-200'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                         </div>
                       ) : (
                         // View Mode Layout
                         <div className="flex items-center space-x-3 w-full">
                           <span className="text-3xl">{list.icon}</span>
                           <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-emerald-600 transition-colors truncate">
                                        {list.name}
                                    </h3>
                                    {!isOwner && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                                            De {list.ownerName || 'Outro'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center text-xs text-slate-400 mt-1">
                                    <span>{itemCount} itens no total</span>
                                    {(isShared || !isOwner) && (
                                        <span className="flex items-center ml-2 text-indigo-400">
                                            <IconUsers className="w-3 h-3 mr-1" />
                                            Compartilhado
                                        </span>
                                    )}
                                </div>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>

                   {!isEditing && (
                       <div className="space-y-2 mt-2">
                         <div className="flex justify-between text-sm text-slate-500 font-medium">
                           <span>{checkedCount} comprados</span>
                           <span>{Math.round(progress)}%</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-slate-800'}`} 
                              style={{ width: `${progress}%` }}
                           ></div>
                         </div>
                       </div>
                   )}
                 </div>

                 {/* Actions Footer - Only owner can delete generally, but we allow simple delete for now */}
                 <div className={`border-t p-2 flex justify-end space-x-2 transition-colors ${isDeleting ? 'bg-red-50 border-red-100' : 'bg-slate-50/50 border-slate-100'}`}>
                      
                      {isEditing ? (
                          <>
                            <button 
                                onClick={cancelEdit}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={(e) => saveEdit(e, list.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                            >
                                <IconCheck className="w-3 h-3" /> Salvar
                            </button>
                          </>
                      ) : isDeleting ? (
                          <div className="flex items-center w-full justify-between px-1">
                              <span className="text-xs font-bold text-red-600">Excluir lista?</span>
                              <div className="flex space-x-2">
                                <button 
                                    onClick={cancelDelete}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                                >
                                    Não
                                </button>
                                <button 
                                    onClick={(e) => confirmDelete(e, list.id)}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 shadow-sm"
                                >
                                    Sim, excluir
                                </button>
                              </div>
                          </div>
                      ) : (
                          <>
                            <button 
                                onClick={(e) => startEdit(e, list)}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white bg-transparent border border-transparent hover:border-slate-200 rounded-lg transition-all shadow-sm"
                                title="Editar Lista"
                            >
                                <IconEdit className="w-4 h-4" />
                            </button>
                            {/* Allow delete if owner. Could hide for shared users, but for now allow them to "remove" it from their view */}
                            <button 
                                onClick={(e) => startDelete(e, list.id)}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-white bg-transparent border border-transparent hover:border-slate-200 rounded-lg transition-all shadow-sm"
                                title="Excluir Lista"
                            >
                                <IconTrash className="w-4 h-4" />
                            </button>
                          </>
                      )}
                 </div>
              </div>
            );
          })}

          {/* Create New List Card */}
          {isCreating ? (
             <div className="flex flex-col p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50 h-full min-h-[160px] relative shadow-lg">
                <label className="text-xs font-bold text-emerald-700 uppercase mb-2">Nova Lista</label>
                <input 
                    autoFocus
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSubmit();
                        if (e.key === 'Escape') {
                           setIsCreating(false);
                           setNewListName('');
                        }
                    }}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 mb-4 shadow-sm"
                    placeholder="Ex: Farmácia, Churrasco..."
                />
                <div className="flex justify-end space-x-2 mt-auto">
                    <button 
                        onClick={cancelCreate}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Cancelar"
                    >
                        <IconX className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleCreateSubmit()}
                        disabled={!newListName.trim()}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                        title="Criar Lista"
                    >
                        <IconCheck className="w-5 h-5" />
                    </button>
                </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 group h-full min-h-[160px]"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform shadow-sm">
                <IconPlus className="w-6 h-6" />
              </div>
              <span className="font-semibold text-slate-600 group-hover:text-emerald-700">Criar Nova Lista</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;