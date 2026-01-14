
import React, { useState, useEffect } from 'react';
import { User, GroceryList, ListPrivilege } from '../types';
import * as storageService from '../services/storageService';
import { IconArrowLeft, IconEdit, IconTrash, IconPlus, IconX } from './Icons';

interface UserProfileProps {
  user: User;
  lists: GroceryList[];
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, lists, onBack }) => {
  const [tab, setTab] = useState<'profile' | 'group' | 'config'>('profile');
  const [members, setMembers] = useState<User[]>([]);
  
  // Estados para formulário de Membro
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [childEmail, setChildEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [childPhone, setChildPhone] = useState('');
  const [childPass, setChildPass] = useState('');
  const [listPermissions, setListPermissions] = useState<Record<string, ListPrivilege>>({});

  const isMasterOrAdmin = user.role === 'master' || user.role === 'admin';

  useEffect(() => {
    if (isMasterOrAdmin) {
      // Admins e Masters gerenciam membros vinculados ao seu próprio masterId (que para eles é o próprio ID)
      const unsub = storageService.getGroupMembers(user.id, setMembers);
      return () => unsub();
    }
  }, [user.id, isMasterOrAdmin]);

  // Inicializa permissões padrão
  useEffect(() => {
    if (!editingMemberId) {
      setListPermissions(lists.reduce((acc, list) => ({ ...acc, [list.id]: 'work' }), {}));
    }
  }, [lists, editingMemberId]);

  const resetForm = () => {
    setEditingMemberId(null);
    setChildEmail('');
    setChildName('');
    setChildPhone('');
    setChildPass('');
    setListPermissions(lists.reduce((acc, list) => ({ ...acc, [list.id]: 'work' }), {}));
  };

  const handleSaveMember = async () => {
    if (!childEmail || !childName) {
        alert("Preencha Nome e Email.");
        return;
    }

    try {
        if (editingMemberId) {
            await storageService.updateChildUser(editingMemberId, {
              name: childName,
              email: childEmail,
              phone: childPhone,
              listPermissions
            });
            alert("Membro atualizado com sucesso!");
          } else {
            if (!childPass) { alert("Senha é obrigatória para novos membros."); return; }
            await storageService.createChildUser(user, {
                name: childName,
                email: childEmail,
                phone: childPhone,
                password: childPass,
                listPermissions
            });
            alert("Ryan e outros membros agora podem logar!");
          }
          resetForm();
    } catch (e) {
        alert("Erro ao salvar membro.");
    }
  };

  const startEdit = (m: User) => {
    setEditingMemberId(m.id);
    setChildName(m.name);
    setChildEmail(m.email);
    setChildPhone(m.phone || '');
    setListPermissions(m.listPermissions || {});
    setTab('group');
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm("Deseja realmente remover este membro do grupo?")) {
      await storageService.deleteUser(id);
    }
  };

  const updatePermission = (listId: string, level: ListPrivilege) => {
    setListPermissions(prev => ({ ...prev, [listId]: level }));
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-slate-50 border-b px-6 py-4 flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 -ml-2 text-slate-600"><IconArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-black text-lg text-slate-800">Perfil aLista</h1>
        </div>

        <div className="flex border-b text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setTab('profile')} className={`flex-1 py-4 border-b-2 transition-all ${tab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent'}`}>Meu Perfil</button>
            {isMasterOrAdmin && <button onClick={() => setTab('group')} className={`flex-1 py-4 border-b-2 transition-all ${tab === 'group' ? 'border-indigo-600 text-indigo-600' : 'border-transparent'}`}>Membros</button>}
            {isMasterOrAdmin && <button onClick={() => setTab('config')} className={`flex-1 py-4 border-b-2 transition-all ${tab === 'config' ? 'border-indigo-600 text-indigo-600' : 'border-transparent'}`}>Config</button>}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {tab === 'profile' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <img src={user.avatar} alt="" className="w-16 h-16 rounded-2xl shadow-lg border-2 border-white ring-1 ring-slate-100" />
                        <div>
                            <p className="font-black text-slate-800 text-xl">{user.name}</p>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                {user.role === 'admin' ? 'ADMINISTRADOR' : user.role === 'master' ? 'USUÁRIO MASTER' : 'MEMBRO DO GRUPO'} • {user.planType?.toUpperCase() || 'PLANO ATIVO'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Assinatura</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Validade</span>
                            <span className="text-xs font-black text-emerald-600">
                                {user.role === 'admin' ? 'Vitalício (Admin)' : (user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : 'Ativa')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'group' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-10">
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membros Atuais ({members.length})</h3>
                        {members.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum membro cadastrado.</p>}
                        <div className="grid gap-3">
                            {members.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl shadow-sm">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm text-slate-800 truncate">{m.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{m.email}</p>
                                        {m.phone && <p className="text-[9px] text-indigo-500 font-black mt-0.5">{m.phone}</p>}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button onClick={() => startEdit(m)} className="p-2 text-indigo-600 bg-white border border-indigo-100 shadow-sm rounded-lg hover:bg-indigo-50"><IconEdit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteMember(m.id)} className="p-2 text-red-500 bg-white border border-red-100 shadow-sm rounded-lg hover:bg-red-50"><IconTrash className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 space-y-4 shadow-inner">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                {editingMemberId ? '✏️ Editar Membro' : '👤 Novo Membro do Grupo'}
                            </h3>
                            {editingMemberId && <button onClick={resetForm} className="text-indigo-400 hover:text-indigo-600"><IconX className="w-4 h-4" /></button>}
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <input value={childName} onChange={e => setChildName(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="Nome Completo" />
                            <input value={childEmail} onChange={e => setChildEmail(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="E-mail de Acesso" />
                            <input value={childPhone} onChange={e => setChildPhone(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="WhatsApp (ex: 55119...)" />
                            {!editingMemberId && <input type="password" value={childPass} onChange={e => setChildPass(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="Senha de Acesso" />}
                        </div>
                        
                        <div className="space-y-3 pt-2">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Definir Acesso às Listas</p>
                            <div className="space-y-2">
                                {lists.length === 0 && <p className="text-[10px] text-indigo-300 italic">Crie listas primeiro para definir permissões.</p>}
                                {lists.map(list => (
                                    <div key={list.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                        <span className="text-xs font-bold text-slate-700 truncate mr-2">{list.icon} {list.name}</span>
                                        <select 
                                            value={listPermissions[list.id] || 'none'} 
                                            onChange={e => updatePermission(list.id, e.target.value as ListPrivilege)}
                                            className="text-[10px] font-black uppercase bg-slate-50 border-none outline-none text-indigo-600 p-1 rounded cursor-pointer"
                                        >
                                            <option value="none">Bloqueado</option>
                                            <option value="view">Visualizar</option>
                                            <option value="work">Interagir</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSaveMember} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-[10px] tracking-widest mt-2 hover:bg-indigo-700 active:scale-95 transition-all">
                            {editingMemberId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default UserProfile;
