
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import * as storageService from '../services/storageService';
import { IconArrowLeft, IconCheck, IconX, IconUsers } from './Icons';

const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const list = await storageService.getAllUsersForAdmin();
    setUsers(list);
    setLoading(false);
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const next = currentStatus === 'active' ? 'blocked' : 'active';
    await storageService.updateUserStatus(userId, next as any);
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white animate-in slide-in-from-bottom duration-500">
        <header className="p-6 border-b border-white/10 flex items-center justify-between">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-xl"><IconArrowLeft className="w-6 h-6" /></button>
            <h1 className="font-black text-xl uppercase tracking-widest">Painel Administrativo</h1>
            <div className="w-10"></div>
        </header>

        <div className="p-6">
            <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
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
                                <td className="px-6 py-4 uppercase font-black text-[10px] tracking-tighter">{u.role}</td>
                                <td className="px-6 py-4 font-bold text-indigo-400">{u.planType}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => toggleStatus(u.id, u.status)}
                                        className="text-[10px] font-black uppercase px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20"
                                    >
                                        {u.status === 'active' ? 'Bloquear' : 'Ativar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AdminPanel;
