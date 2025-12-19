
import React, { useState } from 'react';
import { User } from '../types';
import * as storageService from '../services/storageService';
import { IconArrowLeft, IconLock, IconUsers } from './Icons';

interface UserProfileProps {
  user: User;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      if (name !== user.name) {
        await storageService.updateUserProfileName(name);
        setMsg({ type: 'success', text: 'Nome atualizado!' });
      }

      if (password) {
        if (password.length < 6) throw new Error('Mínimo 6 caracteres.');
        if (password !== confirmPassword) throw new Error('Senhas não coincidem.');
        await storageService.updateUserPassword(password);
        setMsg({ type: 'success', text: 'Senha atualizada!' });
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      setMsg({ type: 'error', text: error.message || 'Erro ao atualizar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForceUpdate = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(reg => reg.unregister());
            alert("Cache limpo. O app será reiniciado.");
            // Fix: window.location.reload() expected 0 arguments
            window.location.reload();
        });
    } else {
        // Fix: window.location.reload() expected 0 arguments
        window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-50 border-b px-4 py-3 flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 -ml-2 text-slate-600"><IconArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-bold text-lg text-slate-800">Meu Perfil</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
            <div className="flex flex-col items-center mb-6">
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full shadow-md ring-4 ring-white mb-3" />
                <p className="text-sm text-slate-500">{user.email}</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-sm mx-auto">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome</label>
                    <div className="relative">
                        <IconUsers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Alterar Senha</label>
                    <div className="space-y-2">
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                </div>

                {msg.text && <div className={`p-3 rounded-lg text-xs font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg.text}</div>}

                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg shadow-sm text-sm">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>

                <div className="pt-8 border-t mt-4 text-center">
                    <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-widest">Opções de Desenvolvedor</p>
                    <button type="button" onClick={handleForceUpdate} className="text-[10px] text-indigo-500 font-bold border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-colors">
                        Forçar Atualização de Versão
                    </button>
                    <p className="text-[9px] text-slate-400 mt-2 italic px-4">Use este botão se o app estiver com uma versão antiga ou apresentando erros.</p>
                </div>
            </form>
        </div>
    </div>
  );
};

export default UserProfile;
