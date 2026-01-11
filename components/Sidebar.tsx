import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Palette, 
  Image as ImageIcon, 
  Video, 
  Tv, 
  Type,
  Lock, // Ícone de cadeado para itens bloqueados
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  // Função para verificar se o usuário tem acesso PRO
  const isPro = profile?.subscription_status === 'active' || profile?.role === 'admin';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', pro: false },
    { name: 'Clientes', icon: Users, path: '/clientes', pro: false },
    { name: 'Calendário', icon: Calendar, path: '/calendario', pro: false },
    { name: 'Planos e Preços', icon: CreditCard, path: '/planos', pro: false },
  ];

  const generatorItems = [
    { name: 'Gerador de Futebol', icon: ImageIcon, path: '/gerador-futebol', pro: true },
    { name: 'Gerador de Filmes', icon: Video, path: '/gerador-filmes', pro: true },
    { name: 'Gerador de Séries', icon: Tv, path: '/gerador-series', pro: true },
    { name: 'Gerador de Logos', icon: Palette, path: '/gerador-logos', pro: true },
    { name: 'Gerador de Legendas', icon: Type, path: '/gerador-legendas', pro: true },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-[#0a0c14] border-r border-white/10 p-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
        <span className="text-xl font-bold text-white italic">Stream<span className="text-blue-500">HUB</span></span>
      </div>

      <nav className="flex-1 space-y-8">
        {/* Menu Principal */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-4">
            Menu
          </div>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  router.pathname === item.path ? 'bg-blue-600/10 text-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Geradores com Trava PRO */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-4">
            Geradores
          </div>
          <div className="space-y-1">
            {generatorItems.map((item) => {
              const active = router.pathname === item.path;
              
              if (isPro) {
                return (
                  <Link key={item.path} href={item.path}>
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      active ? 'bg-blue-600/10 text-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                      <item.icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </Link>
                );
              }

              // Versão bloqueada para usuários Trial
              return (
                <div key={item.path} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-gray-600 cursor-not-allowed group">
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <Lock size={14} className="text-gray-700" />
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Perfil e Logout */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold border border-white/10">
            {profile?.email?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{profile?.email}</p>
            <p className="text-xs text-blue-500 font-bold uppercase tracking-tighter">
              {profile?.role === 'admin' ? 'Admin' : (profile?.subscription_status === 'active' ? 'Plano Pro' : 'Conta Trial')}
            </p>
          </div>
        </div>
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair da Conta</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
