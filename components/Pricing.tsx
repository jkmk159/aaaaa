
import React from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  userEmail?: string;
  isPro?: boolean;
}

const Pricing: React.FC<Props> = ({ userEmail, isPro }) => {
  const handleCheckout = async (planType: 'monthly' | 'yearly') => {
    const { data: { session } } = await (supabase.auth as any).getSession();
    const userId = session?.user?.id;

    if (!userId) {
      alert("Por favor, faça login primeiro.");
      return;
    }

    // Links do Stripe baseados no plano selecionado
    const links = {
      monthly: "https://buy.stripe.com/6oU9ATeXIfvlaC6fMc7kc01", 
      yearly: "https://buy.stripe.com/6oU9ATeXIfvlaC6fMc7kc01" // Substitua pelo link do anual no Stripe
    };
    
    const finalUrl = `${links[planType]}?prefilled_email=${encodeURIComponent(userEmail || '')}&client_reference_id=${userId}`;
    window.location.href = finalUrl;
  };

  if (isPro) {
    return (
      <div className="p-8 max-w-4xl mx-auto py-24 text-center space-y-10 animate-fade-in">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-2xl rotate-3">💎</div>
        <div className="space-y-4">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter">Você é um Membro <span className="text-blue-500">PREMIUM</span></h2>
          <p className="text-gray-400 font-medium max-w-md mx-auto">Seu acesso a todas as ferramentas de IA, geradores 4K e gestor ilimitado está liberado.</p>
        </div>
        <div className="pt-10 flex flex-col items-center gap-4">
           <button 
             onClick={() => window.location.href = 'https://billing.stripe.com/p/login/3cs5mC2n6g6h5w4'} 
             className="bg-white/5 border border-white/10 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
           >
             Gerenciar Assinatura (Portal Stripe)
           </button>
           <p className="text-[9px] text-gray-600 font-bold uppercase">Proxima cobrança automática em 30 dias</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto py-20 space-y-16 animate-fade-in">
      <header className="text-center">
        <h2 className="text-6xl font-black mb-6 tracking-tighter italic leading-none">ESCOLHA SEU <span className="text-blue-500">PODER</span></h2>
        <p className="text-gray-400 max-w-xl mx-auto font-medium text-lg leading-relaxed">
          Pare de perder tempo com banners manuais e cobranças esquecidas. Tenha um ecossistema completo para sua revenda.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* PLANO MENSAL */}
        <div className="bg-[#141824] border border-gray-800 rounded-[48px] p-12 hover:border-blue-500/50 transition-all group flex flex-col shadow-2xl">
          <div className="mb-10">
            <h3 className="text-xl font-black uppercase tracking-widest text-gray-500 mb-6">MENSAL PRO</h3>
            <div className="flex items-end gap-1">
              <span className="text-6xl font-black italic text-white">R$ 40</span>
              <span className="text-gray-600 font-bold mb-3">/mês</span>
            </div>
            <p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-widest">Acesso imediato após o pagamento</p>
          </div>
          
          <ul className="space-y-5 mb-12 flex-1">
            <FeatureItem text="Gestor de Clientes Ilimitado" />
            <FeatureItem text="Banners de Futebol Diários" />
            <FeatureItem text="Banners de Filmes & Séries" />
            <FeatureItem text="Legendas persuasivas via IA" />
            <FeatureItem text="Análise de Anúncios Profissional" />
          </ul>

          <button 
            onClick={() => handleCheckout('monthly')}
            className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase italic tracking-[0.2em] text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            Assinar Mensal
          </button>
        </div>

        {/* PLANO ANUAL */}
        <div className="bg-[#141824] border-2 border-blue-600 rounded-[48px] p-12 relative shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col scale-105">
          <div className="absolute top-0 right-12 -translate-y-1/2 bg-blue-600 text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2.5 rounded-full shadow-lg">MELHOR CUSTO-BENEFÍCIO</div>
          
          <div className="mb-10">
            <h3 className="text-xl font-black uppercase tracking-widest text-blue-500 mb-6 italic">ANUAL VIP</h3>
            <div className="flex items-end gap-1">
              <span className="text-6xl font-black italic text-white">R$ 290</span>
              <span className="text-gray-600 font-bold mb-3">/ano</span>
            </div>
            <p className="text-green-500 text-[10px] font-black uppercase mt-4 tracking-widest">Economia real de R$ 190,00 por ano</p>
          </div>

          <ul className="space-y-5 mb-12 flex-1">
            <FeatureItem text="Tudo do Plano Mensal" />
            <FeatureItem text="Acesso Vitalício enquanto durar o ano" />
            <FeatureItem text="Suporte Prioritário no WhatsApp" />
            <FeatureItem text="Gerador de Logos Profissionais" />
            <FeatureItem text="Novas IAs inclusas sem custo" />
          </ul>

          <button 
            onClick={() => handleCheckout('yearly')}
            className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase italic tracking-[0.2em] text-sm hover:bg-gray-100 transition-all shadow-xl shadow-white/10 active:scale-95"
          >
            Assinar Anual (VIP)
          </button>
        </div>
      </div>

      <footer className="text-center pt-10">
         <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em]">Pagamento Seguro via Stripe 💳</p>
      </footer>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center text-[13px] font-bold text-gray-300">
    <div className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center mr-4">
      <span className="text-blue-500 text-[10px]">✓</span>
    </div>
    {text}
  </li>
);

export default Pricing;
