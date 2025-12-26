
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 shadow-2xl">
          <header className="text-center mb-10">
            <h1 className="text-3xl font-black text-blue-500 tracking-tighter italic mb-2">
              Stream<span className="text-white">HUB</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">
              {isSignUp ? 'Crie sua conta profissional' : 'Acesse sua conta profissional'}
            </p>
          </header>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {message.text}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'PROCESSANDO...' : isSignUp ? 'CADASTRAR AGORA' : 'ENTRAR NA PLATAFORMA'}
            </button>
          </form>

          <footer className="mt-8 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
              className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </footer>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.4em]">Tecnologia Segura & Criptografada</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
