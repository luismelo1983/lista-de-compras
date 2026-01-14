
import React, { useState } from 'react';
import { User, GroceryList, ChildPrivilege } from '../types';
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
  const [childPass, setChildPass] = useState('');
  const [childPrivilege, setChildPrivilege] = useState<ChildPrivilege>('view');
  const [childAllowedLists, setChildAllowedLists] = useState<string[]>([]);

  const isMaster = user.role === 'master' || user.role === 'admin';

  const handleAddChild = async () => {
    if (!childEmail || !childName) return;
    await storageService.createChildUser(user, {
        name: childName,
        email: childEmail,
        password: childPass,
        privilege: childPrivilege,
        allowedLists: childAllowedLists
    });
    alert("Novo membro adicionado ao grupo!");
    setChildEmail(''); setChildName(''); setChildPass(''); setChildAllowedLists([]);
  };

  const toggleList = (id: string) => {
    setChildAllowedLists(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{user.role === 'child' ? 'MEMBRO' : user.role.toUpperCase()} • {user.planType || 'Free'}</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Status da Assinatura</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Validade</span>
                            <span className="text-xs font-black text-emerald-600">{new Date(user.expiresAt || 0).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'group' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 space-y-4">
                        <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Adicionar Novo Membro</h3>
                        <input value={childName} onChange={e => setChildName(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold" placeholder="Nome do Membro" />
                        <input value={childEmail} onChange={e => setChildEmail(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold" placeholder="E-mail de Acesso" />
                        <input type="password" value={childPass} onChange={e => setChildPass(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold" placeholder="Senha Provisória" />
                        
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-indigo-400 uppercase">Permissão de Acesso</p>
                            <div className="flex gap-2">
                                <button onClick={() => setChildPrivilege('view')} className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${childPrivilege === 'view' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-400'}`}>Somente Ver</button>
                                <button onClick={() => setChildPrivilege('work')} className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${childPrivilege === 'work' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-400'}`}>Trabalhar Lista</button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-indigo-400 uppercase">Listas Liberadas</p>
                            <div className="flex flex-wrap gap-2">
                                {lists.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => toggleList(l.id)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${childAllowedLists.includes(l.id) ? 'bg-indigo-200 border-indigo-400 text-indigo-800' : 'bg-white border-slate-200 text-slate-400'}`}
                                    >
                                        {l.icon} {l.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleAddChild} className="w-full bg-indigo-600 text-white font-black py-3 rounded-2xl shadow-lg uppercase text-[10px] tracking-widest">Cadastrar Membro</button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default UserProfile;
