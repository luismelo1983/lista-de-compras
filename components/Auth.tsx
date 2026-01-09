import React, { useState } from 'react';
import { IconLogo, IconEye, IconEyeOff } from './Icons';
import * as storageService from '../services/storageService';
import { User } from '../types';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getFriendlyErrorMessage = (errCode: string) => {
      switch(errCode) {
          case 'auth/invalid-email': return 'Email inválido.';
          case 'auth/user-disabled': return 'Usuário desativado.';
          case 'auth/user-not-found': return 'Usuário não encontrado.';
          case 'auth/wrong-password': return 'Senha incorreta.';
          case 'auth/email-already-in-use': return 'Este email já está em uso.';
          case 'auth/weak-password': return 'A senha é muito fraca (mínimo 6 caracteres).';
          case 'auth/invalid-credential': return 'Email ou senha incorretos.';
          case 'auth/operation-not-allowed': return 'Erro de configuração no Firebase.';
          case 'auth/network-request-failed': return 'Erro de rede. Verifique sua conexão.';
          case 'auth/too-many-requests': return 'Muitas tentativas. Tente novamente mais tarde.';
          default: return `Erro desconhecido: ${errCode}`;
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'LOGIN') {
        await storageService.login(email, password);
      } else if (mode === 'REGISTER') {
        if (!name || !email || !password) {
          setError('Preencha todos os campos.');
          setLoading(false);
          return;
        }
        await storageService.register(name, email, password);
      } else if (mode === 'FORGOT_PASSWORD') {
        await storageService.resetPassword(email);
        setMessage('Um link de redefinição foi enviado para seu email.');
        setTimeout(() => setMode('LOGIN'), 3000);
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-3">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-7 border border-slate-100">
        
        <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-2 rounded-2xl text-white shadow-xl shadow-indigo-100 mb-4 animate-bounce">
                <IconLogo className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">a.Lista</h1>
            <p className="text-slate-400 text-[11px] font-bold mt-2 lowercase">o poder das listas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" htmlFor="name">Nome Completo</label>
              <input 
                id="name"
                name="name"
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Ex: Família Melo"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" htmlFor="email">Email</label>
            <input 
              id="email"
              name="email"
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="exemplo@email.com"
              required
              autoComplete="username"
            />
          </div>

          {mode !== 'FORGOT_PASSWORD' && (
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" htmlFor="password">Senha</label>
               <div className="relative">
                 <input 
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete={mode === 'REGISTER' ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                </button>
               </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100 animate-shake">{error}</div>}
          {message && <div className="p-3 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-xl border border-green-100">{message}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex justify-center items-center text-xs uppercase tracking-widest"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
               mode === 'LOGIN' ? 'Acessar Conta' : mode === 'REGISTER' ? 'Começar Agora' : 'Resetar Senha'
            )}
          </button>
        </form>

        <div className="mt-7 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest space-y-3">
          {mode === 'LOGIN' && (
             <>
               <p className="lowercase">não tem uma conta? <button onClick={() => setMode('REGISTER')} className="text-indigo-600 hover:underline uppercase">Cadastre-se</button></p>
               <p><button onClick={() => setMode('FORGOT_PASSWORD')} className="text-slate-300 hover:text-slate-500 transition-colors">Esqueci a senha</button></p>
             </>
          )}
          {mode === 'REGISTER' && (
             <p className="lowercase">já tem uma conta? <button onClick={() => setMode('LOGIN')} className="text-indigo-600 hover:underline uppercase">Fazer Login</button></p>
          )}
          {mode === 'FORGOT_PASSWORD' && (
             <p className="lowercase">lembrou a senha? <button onClick={() => setMode('LOGIN')} className="text-indigo-600 hover:underline uppercase">Fazer Login</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
