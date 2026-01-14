
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import * as storageService from '../services/storageService';
import { IconArrowLeft, IconCheck, IconX, IconUsers, IconPlus } from './Icons';

const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    // Agora usa assinatura em tempo real
    const unsubscribe = storageService.subscribeToAllUsers((list) => {
        setUsers(list);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPass) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }
    try {
        await storageService.createMasterUser({ 
            name: newName, 
            email: newEmail, 
            phone: newPhone, 
            password: newPass 
        });
        alert("Novo Usuário Master criado com sucesso! Ele já pode logar.");
        setShowCreate(false);
        setNewName(''); setNewEmail(''); setNewPhone(''); setNewPass('');
    } catch(err) {
        alert("Erro ao criar usuário.");
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const next = currentStatus === 'active' ? 'blocked' : 'active';
    await storageService.updateUserStatus(userId, next as any);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white animate-in slide-in-from-bottom duration-500 overflow-y-auto">
        <header className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-xl"><IconArrowLeft className="w-6 h-6" /></button>
            <h1 className="font-black text-xl uppercase tracking-widest">Gestão de Usuários</h1>
            <button onClick={() => setShowCreate(true)} className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20"><IconPlus className="w-6 h-6" /></button>
        </header>

        <div className="p-6 space-y-8">
            {showCreate && (
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 animate-in zoom-in-95 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-400">Criar Novo Usuário Master</h3>
                        <button onClick={() => setShowCreate(false)}><IconX className="w-5 h-5 text-white/40" /></button>
                    </div>
                    <form onSubmit={handleCreateMaster} className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase mb-1">Nome Completo</label>
                            <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: João Silva" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase mb-1">E-mail de Acesso</label>
                            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="email@exemplo.com" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase mb-1">WhatsApp</label>
                            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="55119..." />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase mb-1">Senha Provisória</label>
                            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
                        </div>
                        <button type="submit" className="md:col-span-2 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl uppercase text-xs tracking-widest mt-2 hover:bg-indigo-700 transition-all">Ativar Conta Master</button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-20 text-white/20 font-black uppercase tracking-[0.3em]">Carregando base...</div>
            ) : (
                <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <tr>
                                    <th className="px-6 py-4">Usuário / E-mail</th>
                                    <th className="px-6 py-4">Papel</th>
                                    <th className="px-6 py-4">Plano</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{u.name}</span>
                                                <span className="text-[10px] text-white/40">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : u.role === 'master' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-indigo-400 uppercase text-[10px]">{u.planType || 'Degustação'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleStatus(u.id, u.status)}
                                                className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg transition-all ${u.status === 'active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                                            >
                                                {u.status === 'active' ? 'Suspender' : 'Reativar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminPanel;
