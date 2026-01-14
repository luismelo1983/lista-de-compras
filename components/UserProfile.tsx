
import React, { useState } from 'react';
import { User, GroceryList, ListPrivilege } from '../types';
import * as storageService from '../services/storageService';
import { IconArrowLeft } from './Icons';

interface UserProfileProps {
  user: User;
  lists: GroceryList[];
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, lists, onBack }) => {
  const [tab, setTab] = useState<'profile' | 'group' | 'config'>('profile');
  const [childEmail, setChildEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [childPhone, setChildPhone] = useState('');
  const [childPass, setChildPass] = useState('');
  
  // Mapeamento de listId -> privilégio
  const [listPermissions, setListPermissions] = useState<Record<string, ListPrivilege>>(
    lists.reduce((acc, list) => ({ ...acc, [list.id]: 'work' }), {})
  );

  const isMaster = user.role === 'master' || user.role === 'admin';

  const handleAddChild = async () => {
    if (!childEmail || !childName || !childPass) {
        alert("Preencha Nome, Email e Senha.");
        return;
    }
    await storageService.createChildUser(user, {
        name: childName,
        email: childEmail,
        phone: childPhone,
        password: childPass,
        listPermissions: listPermissions
    });
    setChildEmail(''); setChildName(''); setChildPhone(''); setChildPass('');
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
            {isMaster && <button onClick={() => setTab('group')} className={`flex-1 py-4 border-b-2 transition-all ${tab === 'group' ? 'border-indigo-600 text-indigo-600' : 'border-transparent'}`}>Membros</button>}
            {isMaster && <button onClick={() => setTab('config')} className={`flex-1 py-4 border-b-2 transition-all ${tab === 'config' ? 'border-indigo-600 text-indigo-600' : 'border-transparent'}`}>Config</button>}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {tab === 'profile' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <img src={user.avatar} alt="" className="w-16 h-16 rounded-2xl shadow-lg border-2 border-white ring-1 ring-slate-100" />
                        <div>
                            <p className="font-black text-slate-800 text-xl">{user.name}</p>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                {user.role === 'admin' ? 'ADM' : user.role === 'master' ? 'MASTER' : 'MEMBRO'} • {user.planType?.toUpperCase() || 'GRÁTIS'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Assinatura</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Validade</span>
                            <span className="text-xs font-black text-emerald-600">
                                {user.role === 'admin' ? 'Vitalício' : (user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : 'Indefinido')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'group' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-10">
                    <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 space-y-4">
                        <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Adicionar Novo Membro</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <input value={childName} onChange={e => setChildName(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold" placeholder="Nome do Membro" />
                            <input value={childEmail} onChange={e => setChildEmail(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold" placeholder="E-mail de Acesso" />
                            <input value={childPhone} onChange={e => setChildPhone(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold" placeholder="Telefone (WhatsApp)" />
                            <input type="password" value={childPass} onChange={e => setChildPass(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold" placeholder="Senha Provisória" />
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-[9px] font-black text-indigo-400 uppercase">Privilégios por Lista</p>
                            <div className="space-y-2">
                                {lists.map(list => (
                                    <div key={list.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100">
                                        <span className="text-xs font-bold text-slate-700 truncate mr-2">{list.icon} {list.name}</span>
                                        <select 
                                            value={listPermissions[list.id] || 'none'} 
                                            onChange={e => updatePermission(list.id, e.target.value as ListPrivilege)}
                                            className="text-[10px] font-black uppercase bg-slate-50 border-none outline-none text-indigo-600"
                                        >
                                            <option value="none">Sem Acesso</option>
                                            <option value="view">Só Ver</option>
                                            <option value="work">Interagir</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleAddChild} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-[10px] tracking-widest mt-2">Cadastrar Membro</button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default UserProfile;
