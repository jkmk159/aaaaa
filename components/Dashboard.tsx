
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
      {/* Hero Section de Boas-Vindas */}
      <section className="relative overflow-hidden bg-[#141824] rounded-[48px] border border-gray-800 p-8 md:p-16 shadow-3xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
            PAINEL DE CONTROLE CENTRAL
          </div>
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
            OLÁ, <span className="text-blue-500">{userName}</span><br />
            BEM-VINDO AO <span className="text-white/50">STREAMHUB</span>
          </h2>
          <p className="text-gray-400 max-w-xl text-sm md:text-lg font-medium leading-relaxed">
            Sua central completa para gestão de clientes e criação de marketing para IPTV. 
            Escolha uma ferramenta abaixo para começar.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => onNavigate('gestor-dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-[11px] transition-all shadow-xl shadow-blue-600/30 active:scale-95"
            >
              GESTÃO DE CLIENTES
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-[11px] hover:bg-white/10 transition-all"
            >
              ASSINATURA PRO
            </button>
          </div>
        </div>
      </section>

      {/* Atalhos de Ferramentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ToolCard 
          icon="⚽" 
          title="Futebol" 
          desc="Banners automáticos de jogos" 
          onClick={() => onNavigate('football')}
        />
        <ToolCard 
          icon="🎬" 
          title="Filmes" 
          desc="Catálogo TMDB em 4K" 
          onClick={() => onNavigate('movie')}
        />
        <ToolCard 
          icon="🎨" 
          title="Logotipos" 
          desc="Identidade com IA" 
          onClick={() => onNavigate('logo')}
        />
        <ToolCard 
          icon="✍️" 
          title="Sales Copy" 
          desc="Textos de alta conversão" 
          onClick={() => onNavigate('sales-copy')}
        />
      </div>

      {/* Call to Action IA */}
      <section className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-[40px] border border-blue-500/20 p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-blue-600/20">
          🤖
        </div>
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
            USE A <span className="text-blue-500">INTELIGÊNCIA ARTIFICIAL</span> PARA VENDER MAIS
          </h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">
            Crie legendas e analise seus anúncios com o Google Gemini.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('editor')}
          className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
        >
          ACESSAR IAs
        </button>
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
