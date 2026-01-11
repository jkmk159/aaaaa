
import React from 'react';
import { ViewType, UserProfile } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  userProfile
}) => {
  const userName = userProfile?.email?.split('@')[0].toUpperCase() || 'USUÁRIO';

  return (
    <div className="p-4 md:p-8 space-y-10 animate-fade-in max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#141824] rounded-[48px] border border-gray-800 p-8 md:p-16 shadow-3xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
            CENTRAL DE COMANDO
          </div>
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
            OLÁ, <span className="text-blue-500">{userName}</span><br />
            PRONTO PARA <span className="text-white/50">VENDER?</span>
          </h2>
          <p className="text-gray-400 max-w-xl text-sm md:text-lg font-medium leading-relaxed">
            Bem-vindo ao seu ecossistema StreamHUB. Todas as ferramentas necessárias para gerenciar seus clientes e criar marketing de alto nível estão aqui.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => onNavigate('gestor-dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-[11px] transition-all shadow-xl shadow-blue-600/30 active:scale-95"
            >
              GESTÃO DE CLIENTES
            </button>
            <button 
              onClick={() => onNavigate('football')}
              className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-[11px] hover:bg-white/10 transition-all"
            >
              CRIAR BANNERS
            </button>
          </div>
        </div>
      </section>

      {/* Grid de Ferramentas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ToolCard 
          icon="⚽" 
          title="Futebol" 
          desc="Artes automáticas de jogos" 
          onClick={() => onNavigate('football')}
        />
        <ToolCard 
          icon="🎬" 
          title="Cinema" 
          desc="Filmes e Séries em 4K" 
          onClick={() => onNavigate('movie')}
        />
        <ToolCard 
          icon="🎨" 
          title="Logotipos" 
          desc="Sua marca com IA" 
          onClick={() => onNavigate('logo')}
        />
        <ToolCard 
          icon="✍️" 
          title="Copys" 
          desc="Textos que vendem" 
          onClick={() => onNavigate('sales-copy')}
        />
      </div>

      {/* Dicas e Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#141824] rounded-[40px] border border-gray-800 p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-blue-500/10">
            🤖
          </div>
          <div className="flex-1 space-y-3 text-center md:text-left">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
              OTIMIZE SEUS <span className="text-blue-500">ANÚNCIOS</span>
            </h3>
            <p className="text-xs text-gray-500 font-bold leading-relaxed uppercase tracking-wider">
              Use nossa Inteligência Artificial para analisar seus criativos antes de postar. 
              Criativos validados pela nossa IA convertem 3x mais.
            </p>
            <button 
              onClick={() => onNavigate('ad-analyzer')}
              className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
            >
              ANALISAR AGORA →
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0b0e14] rounded-[40px] border border-gray-800 p-8 flex flex-col justify-between shadow-2xl">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Status da Conta</p>
            <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Membro Ativo</h4>
          </div>
          <p className="text-[10px] text-gray-500 font-bold leading-relaxed mt-4 uppercase">
            Você tem acesso ilimitado a todos os geradores e ao gestor de clientes.
          </p>
          <button 
            onClick={() => onNavigate('pricing')}
            className="mt-6 w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10"
          >
            DETALHES DO PLANO
          </button>
        </div>
      </section>
    </div>
  );
};

const ToolCard = ({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="bg-[#141824] p-6 rounded-[32px] border border-gray-800 hover:border-blue-500/50 transition-all group text-left shadow-xl"
  >
    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
    <h4 className="text-sm font-black uppercase italic text-white tracking-tight">{title}</h4>
    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1 leading-tight">{desc}</p>
  </button>
);

export default Dashboard;
