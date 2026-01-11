import React from 'react';
import { 
  LayoutDashboard, Users, Calendar, CreditCard, 
  Palette, Image as ImageIcon, Video, Tv, Type, 
  Lock, LogOut, X 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userEmail?: string;
  isPro?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ currentView, onNavigate, isOpen, onClose }: SidebarProps) => {
  const { profile, signOut } = useAuth();

  // Verifica se o usuário é PRO ou Admin
  const isProUser = profile?.subscription_status === 'active' || profile?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', name: 'Clientes', icon: Users },
    { id: 'calendario', name: 'Calendário', icon: Calendar },
    { id: 'planos', name: 'Planos e Preços', icon: CreditCard },
  ];

  const generatorItems = [
    { id: 'gerador-futebol', name: 'Gerador de Futebol', icon: ImageIcon, pro: true },
    { id: 'gerador-filmes', name: 'Gerador de Filmes', icon: Video, pro: true },
    { id: 'gerador-series', name: 'Gerador de Séries', icon: Tv, pro: true },
    { id: 'gerador-logos', name: 'Gerador de Logos', icon: Palette, pro: true },
    { id: 'gerador-legendas', name: 'Gerador de Legendas', icon: Type, pro: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0a0c14] border-r border-white/10 p-4 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">S</div>
            <span className="text-xl font-bold text-white italic">Stream<span className="text-blue-500">HUB</span></span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400"><X size={20}/></button>
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-4">Menu</div>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentView === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-4">Geradores</div>
            <div className="space-y-1">
              {generatorItems.map((item) => (
                <button
                  key={item.id}
                  disabled={!isProUser}
                  onClick={() => { if(isProUser) { onNavigate(item.id); onClose(); } }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    !isProUser ? 'opacity-50 cursor-not-allowed text-gray-600' : 
                    currentView === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {!isProUser && <Lock size={14} />}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-4">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-600/50 flex items-center justify-center text-blue-500 font-bold">
              {profile?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.email}</p>
              <p className="text-[10px] font-bold uppercase text-blue-500">
                {profile?.role === 'admin' ? 'ADMIN' : (isProUser ? 'PLANO PRO' : 'TRIAL')}
              </p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
