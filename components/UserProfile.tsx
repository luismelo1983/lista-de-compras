import React, { useState } from 'react';
import { User, GroceryList } from '../types';
import * as storageService from '../services/storageService';
import { IconArrowLeft, IconLock, IconUsers, IconSettings } from './Icons';

interface UserProfileProps {
  user: User;
  lists: GroceryList[];
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, lists, onBack }) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // List Settings State
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

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

  const handleListSelect = (id: string) => {
      setSelectedListId(id);
      const list = lists.find(l => l.id === id);
      if (list) {
          setWebhookUrl(list.webhookUrl || '');
          setContactName(list.contactName || '');
          setContactPhone(list.contactPhone || '');
      }
  };

  const handleUpdateListParams = async () => {
    if (!selectedListId) return;
    setLoading(true);
    try {
        const list = lists.find(l => l.id === selectedListId);
        if (list) {
            await storageService.updateListMetadata(
                selectedListId, 
                list.name, 
                list.icon, 
                webhookUrl, 
                contactName, 
                contactPhone
            );
            setMsg({ type: 'success', text: 'Parâmetros da lista atualizados!' });
        }
    } catch (e) {
        setMsg({ type: 'error', text: 'Erro ao salvar parâmetros.' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-50 border-b px-4 py-3 flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 -ml-2 text-slate-600"><IconArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-bold text-lg text-slate-800">Meu Perfil</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-20">
            <div className="flex flex-col items-center mb-6">
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full shadow-md ring-4 ring-white mb-3" />
                <p className="text-sm text-slate-500 font-bold">{user.email}</p>
            </div>

            <div className="space-y-8 max-w-sm mx-auto">
                {/* Perfil Básico */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Dados Pessoais</h2>
                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Nome</label>
                        <div className="relative">
                            <IconUsers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Alterar Senha (opcional)</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" style={{WebkitAppearance: 'none'}} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar" style={{WebkitAppearance: 'none'}} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white font-black py-3 rounded-xl shadow-sm text-[10px] uppercase tracking-widest">
                        Atualizar Perfil
                    </button>
                </form>

                {/* Configurações das Listas (Transferido da GroceryList) */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1 flex items-center gap-2">
                        <IconSettings className="w-3 h-3"/> Parâmetros das Listas
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Selecione a Lista</label>
                            <select 
                                value={selectedListId} 
                                onChange={(e) => handleListSelect(e.target.value)}
                                className="w-full px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-900 outline-none"
                            >
                                <option value="">Escolha uma lista...</option>
                                {lists.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
                            </select>
                        </div>

                        {selectedListId && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Webhook URL (BotConversa)</label>
                                    <input 
                                        type="text" 
                                        value={webhookUrl}
                                        onChange={e => setWebhookUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Nome Contato</label>
                                        <input 
                                            type="text" 
                                            value={contactName}
                                            onChange={e => setContactName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">WhatsApp</label>
                                        <input 
                                            type="tel" 
                                            value={contactPhone}
                                            onChange={e => setContactPhone(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                            placeholder="55119..."
                                        />
                                    </div>
                                </div>
                                <button onClick={handleUpdateListParams} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl shadow-lg text-[10px] uppercase tracking-widest">
                                    Salvar Parâmetros da Lista
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {msg.text && (
                    <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {msg.text}
                    </div>
                )}

                <div className="pt-8 border-t text-center">
                    <button type="button" onClick={() => window.location.reload()} className="text-[10px] text-indigo-500 font-bold border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors uppercase tracking-widest">
                        Forçar Atualização de Versão
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserProfile;
