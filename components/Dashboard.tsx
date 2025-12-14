import React, { useState } from 'react';
import { GroceryList, User } from '../types';
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX, IconUsers } from './Icons';

interface DashboardProps {
  lists: GroceryList[];
  currentUser: User;
  onSelectKey: (listId: string) => void;
  onCreateList: (name: string, icon: string) => void;
  onEditList: (listId: string, newName: string, newIcon: string) => void;
  onDeleteList: (listId: string) => void;
}

const EMOJI_OPTIONS = ['🛒', '🥬', '🥩', '🥖', '💊', '🎁', '🧹', '🎉', '🍼', '🏠', '🐶', '🛠️'];

const Dashboard: React.FC<DashboardProps> = ({ lists, currentUser, onSelectKey, onCreateList, onEditList, onDeleteList }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState(EMOJI_OPTIONS[0]);

  // States for Inline Editing and Deleting
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Determine greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // Determine list count text
  let listCountText = '';
  if (lists.length === 0) {
      listCountText = 'Sem listas ativas';
  } else if (lists.length === 1) {
      listCountText = '1 lista ativa';
  } else {
      listCountText = `${lists.length} listas ativas`;
  }

  // --- Create Handlers ---
  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newListName.trim()) {
      onCreateList(newListName.trim(), newListIcon);
      setNewListName('');
      setNewListIcon(EMOJI_OPTIONS[0]);
      setIsCreating(false);
    }
  };

  const cancelCreate = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsCreating(false);
      setNewListName('');
      setNewListIcon(EMOJI_OPTIONS[0]);
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
    <div className="space-y-6 pb-20">
      {/* Header Reduced */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{greeting}, {currentUser.name}</h1>
          <p className="text-slate-500 text-xs">{listCountText}</p>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden shadow-md ring-2 ring-white">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Lists Grid Reduced */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-base font-bold text-slate-800">Suas Listas</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                className={`group bg-white hover:bg-slate-50 transition-all duration-200 rounded-xl shadow-sm border ${isDeleting ? 'border-red-200 bg-red-50' : 'border-slate-100'} relative overflow-hidden flex flex-col`}
                onClick={() => !isEditing && !isDeleting && onSelectKey(list.id)}
              >
                 <div className={`absolute top-0 left-0 w-1 h-full ${list.color}`}></div> {/* Color strip */}
                 
                 <div className="p-4 flex-1 cursor-pointer">
                   <div className="flex justify-between items-start mb-2">
                     <div className="flex flex-col w-full">
                       
                       {isEditing ? (
                         // Edit Mode Layout
                         <div className="w-full space-y-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl bg-slate-100 p-1 rounded cursor-default">{editIcon}</span>
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
                                    className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1 text-base font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Escolha um ícone:</p>
                                <div className="flex flex-wrap gap-1">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditIcon(emoji);
                                            }}
                                            className={`w-7 h-7 flex items-center justify-center rounded-md text-base transition-colors ${editIcon === emoji ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-white hover:bg-slate-200'}`}
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
                           <span className="text-2xl">{list.icon}</span>
                           <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-emerald-600 transition-colors truncate">
                                        {list.name}
                                    </h3>
                                    {!isOwner && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 py-0 rounded font-bold border border-indigo-200">
                                            {list.ownerName || 'Outro'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center text-[11px] text-slate-400 mt-0.5">
                                    <span>{itemCount} itens</span>
                                    {(isShared || !isOwner) && (
                                        <span className="flex items-center ml-2 text-indigo-400">
                                            <IconUsers className="w-3 h-3 mr-1" />
                                            Grupo
                                        </span>
                                    )}
                                </div>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>

                   {!isEditing && (
                       <div className="space-y-1.5 mt-1">
                         <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                           <span>{checkedCount} / {itemCount}</span>
                           <span>{Math.round(progress)}%</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-slate-800'}`} 
                              style={{ width: `${progress}%` }}
                           ></div>
                         </div>
                       </div>
                   )}
                 </div>

                 {/* Actions Footer Reduced */}
                 <div className={`border-t p-1.5 flex justify-end space-x-1 transition-colors ${isDeleting ? 'bg-red-50 border-red-100' : 'bg-slate-50/50 border-slate-100'}`}>
                      
                      {isEditing ? (
                          <>
                            <button 
                                onClick={cancelEdit}
                                className="px-2 py-1 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded hover:bg-slate-100"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={(e) => saveEdit(e, list.id)}
                                className="px-2 py-1 text-[10px] font-semibold text-white bg-indigo-600 border border-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"
                            >
                                <IconCheck className="w-3 h-3" /> Salvar
                            </button>
                          </>
                      ) : isDeleting ? (
                          <div className="flex items-center w-full justify-between px-1">
                              <span className="text-[10px] font-bold text-red-600">Excluir?</span>
                              <div className="flex space-x-2">
                                <button 
                                    onClick={cancelDelete}
                                    className="px-2 py-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100"
                                >
                                    Não
                                </button>
                                <button 
                                    onClick={(e) => confirmDelete(e, list.id)}
                                    className="px-2 py-1 text-[10px] font-semibold text-white bg-red-600 border border-red-600 rounded hover:bg-red-700 shadow-sm"
                                >
                                    Sim
                                </button>
                              </div>
                          </div>
                      ) : (
                          <>
                            <button 
                                onClick={(e) => startEdit(e, list)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white bg-transparent border border-transparent hover:border-slate-200 rounded transition-all"
                                title="Editar Lista"
                            >
                                <IconEdit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={(e) => startDelete(e, list.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white bg-transparent border border-transparent hover:border-slate-200 rounded transition-all"
                                title="Excluir Lista"
                            >
                                <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </>
                      )}
                 </div>
              </div>
            );
          })}

          {/* Create New List Card Reduced */}
          {isCreating ? (
             <div className="flex flex-col p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 h-full min-h-[140px] relative shadow-lg">
                <label className="text-[10px] font-bold text-emerald-700 uppercase mb-2">Nova Lista</label>
                
                <div className="flex items-center space-x-2 mb-2">
                   <div className="text-2xl bg-white p-1 rounded-lg border border-emerald-100 shadow-sm">{newListIcon}</div>
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
                            setNewListIcon(EMOJI_OPTIONS[0]);
                          }
                      }}
                      className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                      placeholder="Nome da lista..."
                   />
                </div>

                <div className="mb-3">
                     <p className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">Ícone:</p>
                     <div className="flex flex-wrap gap-1">
                         {EMOJI_OPTIONS.map(emoji => (
                             <button
                                 key={emoji}
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     setNewListIcon(emoji);
                                 }}
                                 className={`w-7 h-7 flex items-center justify-center rounded text-base transition-colors ${newListIcon === emoji ? 'bg-emerald-200 ring-2 ring-emerald-500 text-emerald-900' : 'bg-white/80 hover:bg-white'}`}
                             >
                                 {emoji}
                             </button>
                         ))}
                     </div>
                </div>

                <div className="flex justify-end space-x-2 mt-auto">
                    <button 
                        onClick={cancelCreate}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                        title="Cancelar"
                    >
                        <IconX className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleCreateSubmit()}
                        disabled={!newListName.trim()}
                        className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                        title="Criar Lista"
                    >
                        <IconCheck className="w-4 h-4" />
                    </button>
                </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 group h-full min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-110 transition-transform shadow-sm">
                <IconPlus className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm text-slate-600 group-hover:text-emerald-700">Criar Nova Lista</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;