import React, { useState } from 'react';
import { IconShoppingBag, IconEye, IconEyeOff } from './Icons';
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
          case 'auth/operation-not-allowed': return 'ERRO DE CONFIGURAÇÃO: O login por Email/Senha não está ativado no Firebase Console.';
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
        const user = await storageService.login(email, password);
        // Sucesso tratado pelo listener no App.tsx
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
      console.error("Auth Error Full Object:", err);
      const errorCode = err.code || 'unknown';
      setError(getFriendlyErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 border border-slate-100">
        
        <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200 mb-4">
                <IconShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Lista de <span className="text-indigo-600">Compras</span></h1>
            <p className="text-slate-400 text-sm mt-1">Seja feliz sem esquecer nada</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome de Exibição</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Ex: Casa Silva ou Repúblicas"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email de Login</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="exemplo@email.com"
              required
            />
          </div>

          {mode !== 'FORGOT_PASSWORD' && (
            <div>
               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Senha</label>
               <div className="relative">
                 <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                </button>
               </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">{error}</div>}
          {message && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg font-medium border border-green-100">{message}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all flex justify-center items-center"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
               mode === 'LOGIN' ? 'Entrar' : mode === 'REGISTER' ? 'Criar Conta' : 'Recuperar Senha'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 space-y-2">
          {mode === 'LOGIN' && (
             <>
               <p>Não tem uma conta? <button onClick={() => setMode('REGISTER')} className="text-indigo-600 font-bold hover:underline">Cadastre-se</button></p>
               <p><button onClick={() => setMode('FORGOT_PASSWORD')} className="text-slate-400 hover:text-slate-600">Esqueci a senha</button></p>
             </>
          )}
          {mode === 'REGISTER' && (
             <p>Já tem uma conta? <button onClick={() => setMode('LOGIN')} className="text-indigo-600 font-bold hover:underline">Faça Login</button></p>
          )}
          {mode === 'FORGOT_PASSWORD' && (
             <p>Lembrou a senha? <button onClick={() => setMode('LOGIN')} className="text-indigo-600 font-bold hover:underline">Faça Login</button></p>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Auth;