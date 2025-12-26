
import React from 'react';
import { ViewType } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 space-y-12">
      {/* SEÇÃO HERO: BANNER PRINCIPAL DE CHAMADA */}
      <header className="relative py-16 px-10 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900 to-black border border-white/10">
         <div className="relative z-10 max-w-2xl">
            {/* TÍTULO DE IMPACTO HERO */}
            <h2 className="text-5xl font-black tracking-tighter mb-4 italic leading-none">DOMINE O MERCADO DE <span className="text-blue-500">IPTV</span></h2>
            {/* SUBTÍTULO HERO */}
            <p className="text-lg text-gray-300 mb-8">Aumente suas vendas com banners profissionais automáticos e legendas criadas por inteligência artificial.</p>
            {/* BOTÕES DE AÇÃO HERO */}
            <div className="flex gap-4">
               <button 
                 onClick={() => onNavigate('football')}
                 className="bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
               >
                 Começar Agora
               </button>
               <button 
                 onClick={() => onNavigate('pricing')}
                 className="bg-white/10 backdrop-blur px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
               >
                 Ver Planos
               </button>
            </div>
         </div>
         {/* EFEITO DE LUZ DECORATIVA NO FUNDO */}
         <div className="absolute right-[-100px] bottom-[-100px] w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full"></div>
      </header>

      {/* SEÇÃO DE FERRAMENTAS RÁPIDAS (CARDS) */}
      <section>
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Nossas Ferramentas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD: GERADOR DE FUTEBOL */}
          <ToolCard 
            icon="⚽" 
            title="Jogos do Dia" 
            desc="Gere banners dos principais campeonatos do mundo com odds atualizadas em segundos." 
            onClick={() => onNavigate('football')}
          />
          {/* CARD: GERADOR DE CINEMA */}
          <ToolCard 
            icon="🎬" 
            title="Catálogo de Filmes" 
            desc="Banners prontos para WhatsApp e Instagram usando dados reais do TMDB API." 
            onClick={() => onNavigate('movie')}
          />
          {/* CARD: EDITOR COM INTELIGÊNCIA ARTIFICIAL */}
          <ToolCard 
            icon="🤖" 
            title="Editor IA" 
            desc="Editor visual simplificado e gerador de legendas com o poder do Gemini." 
            onClick={() => onNavigate('editor')}
          />
        </div>
      </section>

      {/* SEÇÃO DE RECURSOS E PLANO PRO RÁPIDO */}
      <section className="bg-[#141824] p-8 rounded-2xl border border-gray-800">
         <div className="flex flex-col md:flex-row items-center gap-8">
            {/* LISTA DE BENEFÍCIOS ESQUERDA */}
            <div className="flex-1 space-y-4">
               <h3 className="text-2xl font-bold">Ganhe tempo, venda mais.</h3>
               <p className="text-gray-400">Automatizamos a parte chata da criação de conteúdo para que você foque no que importa: atender seus clientes e crescer seu negócio de IPTV.</p>
               <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-300"><span className="text-green-500 mr-2">✓</span> Banners 1080x1080 perfeitos para Feed e Status.</li>
                  <li className="flex items-center text-sm text-gray-300"><span className="text-green-500 mr-2">✓</span> Inteligência Artificial integrada (Google Gemini).</li>
                  <li className="flex items-center text-sm text-gray-300"><span className="text-green-500 mr-2">✓</span> Dados reais de esportes e cinema.</li>
               </ul>
            </div>
            {/* CARD DE PREÇO RESUMIDO DIREITA */}
            <div className="w-full md:w-64 bg-blue-600/10 border border-blue-500/20 p-6 rounded-xl flex flex-col items-center text-center">
               <span className="text-4xl mb-4">💎</span>
               <h4 className="font-bold mb-2">Plano Pro</h4>
               <p className="text-2xl font-black mb-4">R$ 40<span className="text-sm font-normal">/mês</span></p>
               <button 
                 onClick={() => onNavigate('pricing')}
                 className="w-full bg-blue-600 py-2 rounded-lg text-sm font-bold shadow-lg"
               >
                 Assinar Agora
               </button>
            </div>
         </div>
      </section>
    </div>
  );
};

/* COMPONENTE INTERNO PARA OS CARDS DE FERRAMENTA */
const ToolCard = ({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) => (
  <button onClick={onClick} className="text-left bg-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-blue-500 transition-all hover:translate-y-[-4px] group">
    {/* ÍCONE DO CARD COM ANIMAÇÃO */}
    <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform">{icon}</span>
    {/* TÍTULO DO CARD */}
    <h4 className="text-xl font-bold mb-2">{title}</h4>
    {/* DESCRIÇÃO DO CARD */}
    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
  </button>
);

export default Dashboard;
