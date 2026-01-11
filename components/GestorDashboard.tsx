
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
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden bg-[#141824] rounded-[48px] border border-gray-800 p-8 md:p-16 shadow-3xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
            PAINEL DE CONTROLE CENTRAL
          </div>
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
            BEM-VINDO AO <span className="text-blue-500">STREAMHUB,</span><br />
            {userName}
          </h2>
          <p className="text-gray-400 max-w-xl text-sm md:text-lg font-medium leading-relaxed">
            Sua plataforma completa para criação de conteúdo e gestão de IPTV. 
            Escolha uma das ferramentas abaixo para começar a escalar suas vendas hoje.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => onNavigate('gestor-dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-[11px] transition-all shadow-xl shadow-blue-600/30 active:scale-95"
            >
              ACESSAR MEU GESTOR
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-[11px] hover:bg-white/10 transition-all"
            >
              VER PLANOS PRO
            </button>
          </div>
        </div>
      </section>

      {/* Quick Access Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ToolCard 
          icon="⚽" 
          title="Futebol" 
          desc="Banners automáticos de jogos" 
          onClick={() => onNavigate('football')}
        />
        <ToolCard 
          icon="🎬" 
          title="Cinema" 
          desc="Artes de filmes e séries" 
          onClick={() => onNavigate('movie')}
        />
        <ToolCard 
          icon="🎨" 
          title="Logotipos" 
          desc="Crie sua marca com IA" 
          onClick={() => onNavigate('logo')}
        />
        <ToolCard 
          icon="🔍" 
          title="Análise" 
          desc="Otimize seus anúncios" 
          onClick={() => onNavigate('ad-analyzer')}
        />
      </div>

      {/* Stats Summary / Tips */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#141824] rounded-[40px] border border-gray-800 p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-blue-600/10 rounded-full flex items-center justify-center text-5xl shadow-inner border border-blue-500/10">
            🤖
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
              POTENCIALIZE COM <span className="text-blue-500">INTELIGÊNCIA ARTIFICIAL</span>
            </h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Sabia que anúncios com legendas geradas por IA têm 35% mais cliques? 
              Use nosso Gerador de Legendas para criar copies persuasivas em segundos.
            </p>
            <button 
              onClick={() => onNavigate('editor')}
              className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
            >
              CRIAR LEGENDA AGORA →
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 flex flex-col justify-between shadow-2xl shadow-blue-600/20">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 opacity-80">Dica do Dia</p>
            <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Mantenha seu DNS atualizado!</h4>
          </div>
          <p className="text-xs text-blue-100 font-bold leading-relaxed mt-4">
            Evite quedas no seu serviço conferindo regularmente as configurações de DNS no menu "Seja Dono".
          </p>
          <button 
            onClick={() => onNavigate('dns-setup')}
            className="mt-6 w-full bg-white text-blue-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
          >
            VER TUTORIAL DNS
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
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{desc}</p>
  </button>
);

export default Dashboard;
