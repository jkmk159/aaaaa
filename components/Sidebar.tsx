
import React, { useState } from 'react';
import { ViewType } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  userEmail?: string;
  isPro?: boolean;
  isOpen?: boolean; 
  onClose?: () => void; 
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, userEmail, isPro, isOpen, onClose }) => {
  const [isGeneratorsOpen, setIsGeneratorsOpen] = useState(true);
  const [isAdsOpen, setIsAdsOpen] = useState(true);
  const [isBeOwnerOpen, setIsBeOwnerOpen] = useState(true);
  const [isGestorOpen, setIsGestorOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('supabase.auth.token');
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      await supabase.auth.signOut();
      window.location.assign('/'); 
    } catch (error) {
      console.error("Erro ao sair:", error);
      window.location.href = '/';
    }
  };

  const handleNav = (view: ViewType, restricted: boolean = true) => {
    if (restricted && !isPro) {
      onNavigate('pricing');
    } else {
      onNavigate(view);
    }
    if (onClose) onClose();
  };

  // FIXED: Properly type NavItem as a React.FC to allow 'key' prop and resolve TS errors
  const NavItem: React.FC<{ item: any; restricted?: boolean }> = ({ item, restricted = true }) => {
    const isActive = currentView === item.id;
    const locked = restricted && !isPro;

    return (
      <button 
        key={item.id} 
        onClick={() => handleNav(item.id as ViewType, restricted)} 
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all group ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-500 hover:bg-gray-800/50 hover:text-white'
        } ${locked ? 'opacity-60 grayscale' : ''}`}
      >
        <div className="flex items-center">
          <span className="mr-3 text-base">{item.icon}</span> 
          {item.label}
        </div>
        {locked && (
          <span className="text-[7px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-widest">PRO</span>
        )}
      </button>
    );
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
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] md:hidden animate-fade-in" onClick={onClose}></div>
      )}

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#141824] border-r border-gray-800 flex flex-col z-[80] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-blue-500 tracking-tighter italic">Stream<span className="text-white">HUB</span></h1>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 flex flex-col overflow-y-auto custom-scrollbar space-y-2">
          <button
            onClick={() => handleNav('dashboard', false)}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🏠</span> Painel Revenda
          </button>

          {/* GESTOR */}
          <div className="pt-2">
            <button onClick={() => setIsGestorOpen(!isGestorOpen)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-800 transition-all">
              <div className="flex items-center"><span className="mr-3 text-lg">💼</span> Gestor</div>
              <span className={`transition-transform duration-300 ${isGestorOpen ? 'rotate-180' : ''} text-[10px]`}>▼</span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isGestorOpen ? 'max-h-[500px] mt-2' : 'max-h-0'}`}>
              <div className="pl-6 space-y-1 border-l-2 border-blue-600/30 ml-6">
                {gestorItems.map((item) => <NavItem key={item.id} item={item} />)}
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
                {generatorItems.map((item) => <NavItem key={item.id} item={item} />)}
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
                 {adItems.map((item) => <NavItem key={item.id} item={item} />)}
              </div>
            </div>
          </div>

          <button onClick={() => handleNav('pricing', false)} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentView === 'pricing' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <span className="mr-3 text-lg">💎</span> Assinatura
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#0f121a] space-y-3">
          <div className="flex items-center space-x-3 bg-black/30 p-3 rounded-2xl border border-white/5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black italic shadow-lg text-xs text-white shrink-0 ${isPro ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gray-700'}`}>
              {userEmail?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-tight leading-none truncate text-white">{userEmail?.split('@')[0].toUpperCase() || 'USUÁRIO'}</p>
              <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isPro ? 'text-blue-500' : 'text-gray-500'}`}>
                {isPro ? 'STATUS PRO' : 'CONTA TRIAL'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10 disabled:opacity-50">
            <span>🚪</span> {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
