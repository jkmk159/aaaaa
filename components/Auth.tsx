
import React, { useState } from 'react';
import { supabase, checkSupabaseConnection } from '../lib/supabase';

interface AuthProps {
  initialIsSignUp?: boolean;
  onBack?: () => void;
  onDemoLogin?: (email?: string) => void;
}

export default function Auth({ initialIsSignUp = false, onBack, onDemoLogin }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isConfigured = checkSupabaseConnection();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email === 'jaja@jaja' && password === 'jajaja') {
      setLoading(true);
      setTimeout(() => {
        onDemoLogin?.('jaja@jaja');
        setLoading(false);
      }, 800);
      return;
    }

    if (!isConfigured) {
      setMessage({ 
        type: 'error', 
        text: 'CONFIGURAÇÃO AUSENTE: VITE_SUPABASE_ANON_KEY não encontrada.' 
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await (supabase.auth as any).signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail.' });
      } else {
        const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
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
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="w-full max-w-md z-10 animate-fade-in">
        {onBack && (
          <button 
            onClick={onBack}
            className="mb-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar
          </button>
        )}

        <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 shadow-2xl">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-black text-blue-500 tracking-tighter italic mb-2">
              Stream<span className="text-white">HUB</span>
            </h1>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Plataforma de Gestão e Marketing IPTV</p>
          </header>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center ${message.type === 'success' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm bg-blue-600 hover:bg-blue-700 transition-all shadow-xl">
              {loading ? 'PROCESSANDO...' : isSignUp ? 'CADASTRAR AGORA' : 'ENTRAR NO PAINEL'}
            </button>

            {!isConfigured && email !== 'jaja@jaja' && (
              <button type="button" onClick={() => onDemoLogin?.()} className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-white/10 transition-all">
                🚀 Entrar como Demo
              </button>
            )}
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-[10px] font-black text-gray-500 uppercase hover:text-blue-500">
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie sua conta agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
