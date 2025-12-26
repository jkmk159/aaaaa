
import React from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  userEmail?: string;
  isPro?: boolean;
}

const Pricing: React.FC<Props> = ({ userEmail, isPro }) => {
  const handleCheckout = async (planType: 'monthly' | 'yearly') => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      alert("Por favor, faça login primeiro.");
      return;
    }

    // Link do seu produto no Stripe
    const stripePaymentLink = "https://buy.stripe.com/6oU9ATeXIfvlaC6fMc7kc01"; 
    
    // client_reference_id é o que nossa Edge Function usa para saber quem pagou
    const finalUrl = `${stripePaymentLink}?prefilled_email=${encodeURIComponent(userEmail || '')}&client_reference_id=${userId}`;
    
    window.location.href = finalUrl;
  };

  if (isPro) {
    return (
      <div className="p-8 max-w-4xl mx-auto py-20 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center text-4xl mx-auto border border-blue-500/30">💎</div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Você já é um Membro <span className="text-blue-500">PRO</span></h2>
        <p className="text-gray-400 font-medium">Sua assinatura está ativa. Aproveite todas as ferramentas ilimitadas e o suporte VIP.</p>
        <div className="pt-8">
           <button 
             onClick={() => window.location.href = 'https://billing.stripe.com/p/login/3cs5mC2n6g6h5w4'} 
             className="text-xs font-black uppercase text-gray-500 hover:text-white underline tracking-widest"
           >
             Gerenciar Assinatura (Portal do Cliente)
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto py-20 text-center space-y-16">
      <header>
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic">Escolha seu <span className="text-blue-500">Plano</span></h2>
        <p className="text-gray-400 max-w-lg mx-auto font-medium">Libere o poder da Inteligência Artificial e automatize sua revenda hoje mesmo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-[#141824] border border-gray-800 rounded-[40px] p-10 hover:border-blue-500 transition-all flex flex-col">
          <h3 className="text-xl font-black uppercase tracking-widest text-gray-500 mb-4">Mensal Profissional</h3>
          <div className="flex items-end justify-center gap-1 mb-8">
            <span className="text-5xl font-black italic">R$ 45</span>
            <span className="text-gray-600 font-bold mb-2">/mês</span>
          </div>
          <ul className="text-left space-y-4 mb-10 flex-1">
            <FeatureItem text="Gestor de Clientes Ilimitado" />
            <FeatureItem text="IA Gemini para Legendas" />
            <FeatureItem text="Gerador de Banners 4K" />
            <FeatureItem text="Análise de Anúncios IA" />
          </ul>
          <button 
            onClick={() => handleCheckout('monthly')}
            className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
          >
            Assinar Mensal
          </button>
        </div>

        <div className="bg-[#141824] border-2 border-blue-600 rounded-[40px] p-10 relative shadow-2xl shadow-blue-600/10 flex flex-col scale-105">
          <div className="absolute top-0 right-10 -translate-y-1/2 bg-blue-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">Melhor Valor</div>
          <h3 className="text-xl font-black uppercase tracking-widest text-white mb-4">Anual Vitalício</h3>
          <div className="flex items-end justify-center gap-1 mb-2">
            <span className="text-5xl font-black italic">R$ 350</span>
            <span className="text-gray-600 font-bold mb-2">/ano</span>
          </div>
          <p className="text-green-500 text-[10px] font-black uppercase mb-8 tracking-widest">Economize R$ 190 ao ano</p>
          <ul className="text-left space-y-4 mb-10 flex-1">
            <FeatureItem text="Tudo do Plano Mensal" />
            <FeatureItem text="Suporte VIP WhatsApp" />
            <FeatureItem text="Acesso antecipado a novas IAs" />
            <FeatureItem text="Sem limites de geração IA" />
          </ul>
          <button 
            onClick={() => handleCheckout('yearly')}
            className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase italic tracking-widest hover:bg-gray-200 transition-all shadow-xl shadow-white/10"
          >
            Assinar Anual (PRO)
          </button>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center text-sm font-bold text-gray-300">
    <span className="mr-3 text-green-500 text-lg">✓</span> {text}
  </li>
);

export default Pricing;
