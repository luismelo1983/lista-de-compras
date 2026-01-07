
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
    // Principais e Categorias
    '🛒', '🏠', '🥘', '🍼', '🍎', '🥩', '🥖', '🧹', '🐶', '🚗', '💊', '🎉',
    '🥛', '🧀', '🥚', '🍗', '🐟', '🥦', '🥕', '🥔', '🍇', '🍌', '🍦', '🍫',
    '☕', '🍷', '🍺', '🥤', '🧻', '🧼', '🧴', '🔋', '💡', '🛠️', '🌱', '📦',
    '🚿', '🛁', '🧸', '📚', '🍕', '🍔', '🍟', '🍣', '🧂', '🍯', '🍩', '🍪',
    '🍓', '🥝', '🥭', '🌽', '🥬', '🍄', '🥐', '🥯', '🥞', '🥓', '🍝', '🍛',
    '🥟', '🍤', '🍮', '🍰', '🥧', '🥨', '🥜', '🌰', '🍵', '🥂', '🥃', '🏺',
    '🧤', '🧦', '🧣', '🌂', '🧵', '🧶', '🪡', '🧺', '🪣', '🧽', '🚽', '🍳', 
    '🧇', '🍖', '🥪', '🥗', '🍿', '🧃', '🧉', '🍱', '🍥', '🍙', '🍘', '🦑', 
    '🦐', '🦀', '🐡', '🐠', '🐟', '🐄', '🐖', '🐑', '🐓', '🦆', '🦉', '🦋', 
    '🐝', '🐞', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🦎', '🐍', '🦜', '🕊️', '🐇', 
    '🐹', '🐭', '🐱', '🐶',
    // Higiene e Banheiro
    '🪥', '🪒', '🚿', '🛀', '🧼', '🧴', '🧻', '🚽', '🧺', '🧹', '🧼',
    // Escritório e Tecnologia
    '💻', '🖱️', '⌨️', '📱', '🔋', '🔌', '💡', '🔦', '🕯️', '📺', '📻', '📷',
    '🖋️', '✏️', '🖍️', '📝', '📒', '📒', '🗞️', '📚', '✂️', '🖇️', '📌',
    // Ferramentas e Reparos
    '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧰', '🔧', '🪛', '🪚',
    // Bebidas e Drinks
    '🍶', '🍵', '☕', '🥛', '🍼', '🥤', '🧋', '🧃', '🧉', '🍺', '🍻', '🥂', 
    '🍷', '🥃', '🍸', '🍹', '🍾',
    // Padaria e Grãos
    '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🍚', '🍙', '🍛', '🍜', 
    '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡',
    // Vegetais e Frutas WhatsApp Style
    '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', 
    '🥜', '🌰', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', 
    '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍊'
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
      <header>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
          {greeting}, <span className="text-indigo-600">{currentUser.name.split(' ')[0]}</span>
        </h1>
      </header>

      {lists.length === 0 && !isCreating && (
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center space-y-3">
          <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto shadow-sm">🛒</div>
          <h2 className="font-bold text-indigo-900 text-sm">Nenhuma lista ainda?</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-md shadow-indigo-100 active:scale-95 transition-all"
          >
            Criar Agora
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {lists.map((list) => {
          const isEditing = editingId === list.id;
          const isDeleting = deletingId === list.id;
          const isShared = list.userId !== currentUser.id;

          return (
            <div 
              key={list.id} 
              className={`group bg-white rounded-xl shadow-sm border ${isDeleting ? 'border-red-200 bg-red-50' : 'border-slate-100'} transition-all hover:shadow-md relative overflow-hidden flex flex-col`} 
              onClick={() => !isEditing && !isDeleting && onSelectKey(list.id)}
            >
               {isShared && (
                 <div className="absolute top-1 right-1 bg-indigo-100 text-indigo-600 text-[7px] font-black px-1 py-0.5 rounded-full z-10 uppercase">
                   Membro
                 </div>
               )}

               <div className="p-3 flex-1 cursor-pointer">
                 {isEditing ? (
                   <div className="space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 items-center">
                        <select 
                          value={editIcon} 
                          onChange={e => setEditIcon(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded p-1 text-sm outline-none shrink-0"
                        >
                          {EMOJI_OPTIONS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                        </select>
                        <input 
                          autoFocus
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          className="flex-1 min-w-0 bg-white border border-indigo-200 rounded px-2 py-1 text-[10px] font-bold outline-none" 
                          onKeyDown={e => e.key === 'Enter' && saveEdit(e as any, list)}
                        />
                      </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center text-center w-full">
                     <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:bg-indigo-50 transition-all mb-2">
                        {list.icon}
                     </div>
                     <h3 className="font-extrabold text-slate-800 text-[13px] leading-tight truncate w-full px-1">{list.name}</h3>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{list.items.length} itens</span>
                   </div>
                 )}
               </div>

               <div className="px-3 py-1.5 border-t flex justify-between items-center bg-slate-50/50 border-slate-100">
                    {isEditing ? (
                        <div className="flex space-x-1 w-full">
                          <button onClick={() => setEditingId(null)} className="flex-1 py-1 text-[8px] font-black text-slate-500 bg-white border rounded uppercase">Sair</button>
                          <button onClick={e => saveEdit(e, list)} className="flex-1 py-1 text-[8px] font-black text-white bg-indigo-600 rounded uppercase">Salvar</button>
                        </div>
                    ) : isDeleting ? (
                        <div className="flex justify-between w-full items-center">
                          <div className="flex space-x-1">
                            <button onClick={e => {e.stopPropagation(); setDeletingId(null)}} className="px-1.5 py-0.5 text-[7px] font-bold text-slate-500 bg-white border rounded">NÃO</button>
                            <button onClick={e => {e.stopPropagation(); onDeleteList(list.id)}} className="px-1.5 py-0.5 text-[7px] font-bold bg-red-600 text-white rounded">SIM</button>
                          </div>
                        </div>
                    ) : (
                        <div className="flex justify-between w-full">
                          <div className="flex gap-1">
                            <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'up')}} className="p-1 text-slate-400 hover:text-indigo-600"><IconChevronUp className="w-3 h-3"/></button>
                            <button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'down')}} className="p-1 text-slate-400 hover:text-indigo-600"><IconChevronDown className="w-3 h-3"/></button>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={e => startEdit(e, list)} className="p-1 text-slate-400 hover:text-indigo-600"><IconEdit className="w-3 h-3"/></button>
                            <button onClick={e => {e.stopPropagation(); setDeletingId(list.id)}} className="p-1 text-slate-400 hover:text-red-500"><IconTrash className="w-3 h-3"/></button>
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
            className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all min-h-[100px] group"
          >
            <IconPlus className="w-4 h-4 mb-1" />
            <span className="font-black text-[8px] uppercase tracking-widest">Nova a.Lista</span>
          </button>
        )}
      </div>

      {isCreating && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-white p-4 rounded-xl border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95 max-w-xs w-full">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 text-center">Configurar Nova a.Lista</h4>
              <div className="space-y-4 mb-4">
                <div className="flex flex-col items-center gap-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase">Escolha um ícone</label>
                   <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg w-full">
                      {EMOJI_OPTIONS.map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={() => setNewListIcon(emoji)} 
                          className={`text-xl p-1 rounded-md transition-all flex items-center justify-center ${newListIcon === emoji ? 'bg-indigo-100 ring-1 ring-indigo-500 scale-110' : 'hover:bg-white'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                   </div>
                </div>
                <input 
                  autoFocus 
                  type="text" 
                  value={newListName} 
                  onChange={e => setNewListName(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Nome da lista..." 
                  onKeyDown={e => e.key === 'Enter' && handleCreateSubmit()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsCreating(false)} className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Cancelar</button>
                <button onClick={handleCreateSubmit} disabled={!newListName.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[9px] font-black shadow-lg">CRIAR LISTA</button>
              </div>
          </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
