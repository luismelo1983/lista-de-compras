
import React, { useState } from 'react';
import { IconLogo, IconEye, IconEyeOff } from './Icons';
import * as storageService from '../services/storageService';
import { User } from '../types';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
  onNavigateSales: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onNavigateSales }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await storageService.login(email, password);
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
            <div className="shadow-2xl mb-4">
                <IconLogo className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">aLista</h1>
            <p className="text-slate-400 text-[11px] font-bold mt-2 lowercase tracking-tight">inteligente & compartilhada</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seu E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="ex: voce@email.com"
              required
            />
          </div>

          <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sua Senha</label>
             <div className="relative">
               <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
              >
                {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
              </button>
             </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100 text-center animate-shake">
                {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98] flex justify-center items-center text-xs uppercase tracking-widest"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Entrar Agora'}
          </button>
        </form>

        <div className="mt-10 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-2">novo por aqui?</p>
            <button 
                onClick={onNavigateSales}
                className="text-indigo-600 font-black text-xs uppercase underline decoration-2 underline-offset-4 hover:text-indigo-800 transition-colors"
            >
                assine aLista e comece agora!
            </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
