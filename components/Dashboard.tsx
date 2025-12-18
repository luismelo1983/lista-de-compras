
import React, { useState } from 'react';
import { GroceryList, User, Contact } from '../types';
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX, IconUsers, IconChevronUp, IconChevronDown } from './Icons';

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
  const [newContacts, setNewContacts] = useState<Contact[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editWebhook, setEditWebhook] = useState('');
  const [editContacts, setEditContacts] = useState<Contact[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  let listCountText = lists.length === 0 ? 'Sem listas ativas' : lists.length === 1 ? '1 lista ativa' : `${lists.length} listas ativas`;

  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newListName.trim()) {
      onCreateList(newListName.trim(), newListIcon, newContacts);
      setNewListName('');
      setNewListIcon(EMOJI_OPTIONS[0]);
      setNewContacts([]);
      setIsCreating(false);
    }
  };

  const addContact = (isEdit: boolean) => {
    const newContact = { name: '', phone: '' };
    if (isEdit) setEditContacts([...editContacts, newContact]);
    else setNewContacts([...newContacts, newContact]);
  };

  const removeContact = (index: number, isEdit: boolean) => {
    if (isEdit) setEditContacts(editContacts.filter((_, i) => i !== index));
    else setNewContacts(newContacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: 'name' | 'phone', value: string, isEdit: boolean) => {
    const list = isEdit ? [...editContacts] : [...newContacts];
    list[index][field] = value;
    if (isEdit) setEditContacts(list);
    else setNewContacts(list);
  };

  const startEdit = (e: React.MouseEvent, list: GroceryList) => {
      e.stopPropagation();
      setEditingId(list.id);
      setEditName(list.name);
      setEditIcon(list.icon);
      setEditWebhook(list.webhookUrl || '');
      setEditContacts(list.contacts ? [...list.contacts] : []);
      setDeletingId(null);
  };

  const saveEdit = (e: React.MouseEvent | React.KeyboardEvent, listId: string) => {
      e.stopPropagation();
      onEditList(listId, editName.trim(), editIcon, editWebhook, editContacts);
      setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{greeting}, {currentUser.name}</h1>
          <p className="text-slate-500 text-xs">{listCountText}</p>
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3">Suas Listas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lists.map((list, index) => {
            const isEditing = editingId === list.id;
            const isDeleting = deletingId === list.id;
            const isOwner = list.userId === currentUser.id;
            const progress = list.items.length === 0 ? 0 : (list.items.filter(i => i.checked).length / list.items.length) * 100;

            return (
              <div key={list.id} className={`group bg-white rounded-xl shadow-sm border ${isDeleting ? 'border-red-200 bg-red-50' : 'border-slate-100'} relative overflow-hidden flex flex-col`} onClick={() => !isEditing && !isDeleting && onSelectKey(list.id)}>
                 <div className={`absolute top-0 left-0 w-1 h-full ${list.color}`}></div>
                 <div className="p-4 flex-1 cursor-pointer">
                   {isEditing ? (
                     <div className="w-full space-y-3 cursor-default" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl bg-slate-100 p-1 rounded">{editIcon}</span>
                            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1 text-sm font-bold" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Webhook (BotConversa)</label>
                            <input type="text" value={editWebhook} onChange={e => setEditWebhook(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400 uppercase">Contatos Interessados</label><button onClick={() => addContact(true)} className="text-indigo-600 text-[10px] font-bold">+ Adicionar</button></div>
                            {editContacts.map((c, i) => (
                                <div key={i} className="flex gap-1">
                                    <input placeholder="Nome" value={c.name} onChange={e => updateContact(i, 'name', e.target.value, true)} className="w-1/2 text-xs border border-slate-200 rounded px-1.5 py-1" />
                                    <input placeholder="Tel (DDD+Número)" value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value, true)} className="w-1/2 text-xs border border-slate-200 rounded px-1.5 py-1" />
                                    <button onClick={() => removeContact(i, true)} className="text-red-400"><IconX className="w-3 h-3"/></button>
                                </div>
                            ))}
                        </div>
                     </div>
                   ) : (
                     <div className="flex items-center space-x-3 w-full">
                       <span className="text-2xl">{list.icon}</span>
                       <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 text-base leading-tight truncate">{list.name}</h3>
                            <div className="text-[11px] text-slate-400">{list.items.length} itens • {list.contacts?.length || 0} contatos</div>
                       </div>
                     </div>
                   )}
                   {!isEditing && (
                       <div className="mt-3 space-y-1">
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden"><div className="bg-slate-800 h-full transition-all" style={{width:`${progress}%`}}></div></div>
                       </div>
                   )}
                 </div>
                 <div className="border-t p-1.5 flex justify-end bg-slate-50/50 border-slate-100">
                      {isEditing ? (
                          <div className="flex space-x-2"><button onClick={() => setEditingId(null)} className="px-2 py-1 text-[10px] font-bold text-slate-500">Cancelar</button><button onClick={e => saveEdit(e, list.id)} className="px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 rounded">Salvar</button></div>
                      ) : isDeleting ? (
                          <div className="flex justify-between w-full px-2 items-center"><span className="text-[10px] font-bold text-red-600">Excluir?</span><div className="flex space-x-2"><button onClick={e => {e.stopPropagation(); setDeletingId(null)}} className="px-2 py-1 text-[10px]">Não</button><button onClick={e => {e.stopPropagation(); onDeleteList(list.id)}} className="px-2 py-1 text-[10px] bg-red-600 text-white rounded">Sim</button></div></div>
                      ) : (
                          <div className="flex justify-between w-full">
                            <div className="flex"><button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'up')}} className="p-1 text-slate-400 hover:text-indigo-600"><IconChevronUp className="w-3 h-3"/></button><button onClick={e => {e.stopPropagation(); onMoveList(list.id, 'down')}} className="p-1 text-slate-400 hover:text-indigo-600"><IconChevronDown className="w-3 h-3"/></button></div>
                            <div className="flex"><button onClick={e => startEdit(e, list)} className="p-1 text-slate-400 hover:text-indigo-600"><IconEdit className="w-3 h-3"/></button><button onClick={e => {e.stopPropagation(); setDeletingId(list.id)}} className="p-1 text-slate-400 hover:text-red-500"><IconTrash className="w-3 h-3"/></button></div>
                          </div>
                      )}
                 </div>
              </div>
            );
          })}

          {isCreating ? (
             <div className="flex flex-col p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 relative">
                <input autoFocus type="text" value={newListName} onChange={e => setNewListName(e.target.value)} className="w-full border-emerald-200 rounded px-2 py-1.5 text-sm mb-2" placeholder="Nome da lista..." />
                <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-700 uppercase">Contatos para Aviso</span><button onClick={() => addContact(false)} className="text-emerald-700 text-[10px] font-bold">+ Novo</button></div>
                    {newContacts.map((c, i) => (
                        <div key={i} className="flex gap-1">
                            <input placeholder="Nome" value={c.name} onChange={e => updateContact(i, 'name', e.target.value, false)} className="w-1/2 text-[10px] border border-emerald-100 rounded px-1 py-1" />
                            <input placeholder="Tel" value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value, false)} className="w-1/2 text-[10px] border border-emerald-100 rounded px-1 py-1" />
                            <button onClick={() => removeContact(i, false)} className="text-red-400"><IconX className="w-2.5 h-2.5"/></button>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 mt-auto"><button onClick={() => setIsCreating(false)} className="p-1 text-emerald-600"><IconX className="w-4 h-4" /></button><button onClick={handleCreateSubmit} disabled={!newListName.trim()} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold">Criar</button></div>
            </div>
          ) : (
            <button onClick={() => setIsCreating(true)} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all h-full min-h-[120px]">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1"><IconPlus className="w-4 h-4" /></div>
              <span className="font-semibold text-xs text-slate-500">Nova Lista</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
