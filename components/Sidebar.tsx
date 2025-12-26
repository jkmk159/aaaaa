
import React, { useState } from 'react';
import { ViewType } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, userEmail }) => {
  const [isGeneratorsOpen, setIsGeneratorsOpen] = useState(true);
  const [isAdsOpen, setIsAdsOpen] = useState(true);
  const [isBeOwnerOpen, setIsBeOwnerOpen] = useState(true);
  const [isGestorOpen, setIsGestorOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const generatorItems = [
    { id: 'football', label: 'Gerador de Futebol', icon: '⚽' },
    { id: 'movie', label: 'Gerador de Filmes', icon: '🎬' },
    { id: 'series', label: 'Gerador de Séries', icon: '📺' },
    { id: 'logo', label: 'Gerador de Logos', icon: '🎨' },
    { id: 'editor', label: 'Gerador de Legendas', icon: '🤖' },
  ];

  const adItems = [
    { id: 'ad-analyzer', label: 'Analisador de Anúncios', icon: '🔍' },
    { id: 'sales-copy', label: 'Copy de Vendas', icon: '✍️' },
  ];

  const ownerItems = [
    { id: 'tutorial-owner', label: 'Como ser Dono', icon: '👑' },
    { id: 'dns-setup', label: 'Configurar DNS', icon: '🌐' },
  ];

  const gestorItems = [
    { id: 'gestor-dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'gestor-servidores', label: 'Servidores', icon: '🖥️' },
    { id: 'gestor-clientes', label: 'Clientes', icon: '👥' },
    { id: 'gestor-calendario', label: 'Calendário', icon: '📅' },
    { id: 'gestor-planos', label: 'Planos e Preços', icon: '💰' },
    { id: 'gestor-template-ai', label: 'Template & AI', icon: '🤖' },
  ];

  return (
    <aside className="w-64 bg-[#141824] border-r border-gray-800 flex flex-col h-screen sticky top-0 z-[60]">
      <div className="p-8">
        <h1 className="text-2xl font-extrabold text-blue-500 tracking-tighter italic">Stream<span className="text-white">HUB</span></h1>
      </div>

      <nav className="flex-1 px-4 py-2 flex flex-col overflow-y-auto custom-scrollbar space-y-2">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="mr-3 text-lg">🏠</span> Início
        </button>

        {/* GESTOR */}
        <div className="pt-2">
          <button onClick={() => setIsGestorOpen(!isGestorOpen)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-800 transition-all">
            <div className="flex items-center"><span className="mr-3 text-lg">💼</span> Gestor</div>
            <span className={`transition-transform duration-300 ${isGestorOpen ? 'rotate-180' : ''} text-[10px]`}>▼</span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${isGestorOpen ? 'max-h-[500px] mt-2' : 'max-h-0'}`}>
            <div className="pl-6 space-y-1 border-l-2 border-blue-600/30 ml-6">
              {gestorItems.map((item) => (
                <button key={item.id} onClick={() => onNavigate(item.id as ViewType)} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${currentView === item.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-800/50 hover:text-white'}`}>
                  <span className="mr-3 text-base">{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GERADORES */}
        <div>
          <button onClick={() => setIsGeneratorsOpen(!isGeneratorsOpen)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-800 transition-all">
            <div className="flex items-center"><span className="mr-3 text-lg">🛠️</span> Geradores</div>
            <span className={`transition-transform duration-300 ${isGeneratorsOpen ? 'rotate-180' : ''} text-[10px]`}>▼</span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${isGeneratorsOpen ? 'max-h-[350px] mt-2' : 'max-h-0'}`}>
            <div className="pl-6 space-y-1 border-l-2 border-gray-800 ml-6">
              {generatorItems.map((item) => (
                <button key={item.id} onClick={() => onNavigate(item.id as ViewType)} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${currentView === item.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-800/50 hover:text-white'}`}>
                  <span className="mr-3 text-base">{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ANÚNCIOS */}
        <div>
          <button onClick={() => setIsAdsOpen(!isAdsOpen)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-800 transition-all">
            <div className="flex items-center"><span className="mr-3 text-lg">📢</span> Anúncios</div>
            <span className={`transition-transform duration-300 ${isAdsOpen ? 'rotate-180' : ''} text-[10px]`}>▼</span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${isAdsOpen ? 'max-h-[350px] mt-2' : 'max-h-0'}`}>
            <div className="pl-6 space-y-1 border-l-2 border-gray-800 ml-6">
               {adItems.map((item) => (
                <button key={item.id} onClick={() => onNavigate(item.id as ViewType)} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${currentView === item.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-800/50 hover:text-white'}`}>
                  <span className="mr-3 text-base">{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SEJA DONO (RESTAURADO) */}
        <div>
          <button onClick={() => setIsBeOwnerOpen(!isBeOwnerOpen)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-800 transition-all">
            <div className="flex items-center"><span className="mr-3 text-lg">👑</span> Seja Dono</div>
            <span className={`transition-transform duration-300 ${isBeOwnerOpen ? 'rotate-180' : ''} text-[10px]`}>▼</span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${isBeOwnerOpen ? 'max-h-[350px] mt-2' : 'max-h-0'}`}>
            <div className="pl-6 space-y-1 border-l-2 border-gray-800 ml-6">
              {ownerItems.map((item) => (
                <button key={item.id} onClick={() => onNavigate(item.id as ViewType)} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${currentView === item.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-800/50 hover:text-white'}`}>
                  <span className="mr-3 text-base">{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => onNavigate('pricing')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentView === 'pricing' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
          <span className="mr-3 text-lg">💎</span> Assinatura
        </button>
      </nav>

      <div className="p-4 border-t border-gray-800 bg-[#0f121a] space-y-3">
        <div className="flex items-center space-x-3 bg-black/30 p-3 rounded-2xl border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black italic shadow-lg text-xs text-white">
            {userEmail?.[0].toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-tight leading-none truncate text-white">{userEmail?.split('@')[0]}</p>
            <p className="text-[8px] text-blue-500 font-bold uppercase tracking-widest mt-1">Status Ativo</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10"
        >
          <span>🚪</span> Sair da Conta
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
