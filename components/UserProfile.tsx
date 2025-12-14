import React, { useState } from 'react';
import { User } from '../types';
import * as storageService from '../services/storageService';
import { IconArrowLeft, IconCheck, IconLock, IconUsers } from './Icons';

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
        setMsg({ type: 'success', text: 'Nome atualizado com sucesso!' });
      }

      if (password) {
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
        }
        await storageService.updateUserPassword(password);
        setMsg({ type: 'success', text: 'Senha atualizada com sucesso!' });
        setPassword('');
        setConfirmPassword('');
      }
      
      if (name === user.name && !password) {
          setMsg({ type: 'info', text: 'Nenhuma alteração detectada.' });
      }

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
          setMsg({ type: 'error', text: 'Para alterar a senha, saia e entre novamente.' });
      } else {
          setMsg({ type: 'error', text: error.message || 'Erro ao atualizar perfil.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0">
            <button onClick={onBack} className="p-1.5 -ml-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                <IconArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg text-slate-800">Meu Perfil</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
            <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-md ring-4 ring-white mb-3">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-slate-500">{user.email}</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-sm mx-auto">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome de Exibição</label>
                    <div className="relative">
                        <IconUsers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Alterar Senha</label>
                    
                    <div className="space-y-3">
                        <div className="relative">
                            <IconLock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nova senha"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="relative">
                            <IconLock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirme a nova senha"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Deixe em branco se não quiser alterar.</p>
                </div>

                {msg.text && (
                    <div className={`p-3 rounded-lg text-xs font-medium ${
                        msg.type === 'error' ? 'bg-red-50 text-red-600' : 
                        msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                        {msg.text}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex justify-center items-center mt-4 text-sm"
                >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </form>
        </div>
    </div>
  );
};

export default UserProfile;