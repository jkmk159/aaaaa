import React, { useState, useEffect } from 'react';
import { ViewType, Client, Server, Plan, UserProfile } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FootballBanners from './components/FootballBanners';
import MovieBanners from './components/MovieBanners';
import SeriesBanners from './components/SeriesBanners';
import Pricing from './components/Pricing';
import AdEditor from './components/AdEditor';
import LogoGenerator from './components/LogoGenerator';
import AdAnalyzer from './components/AdAnalyzer';
import SalesCopy from './components/SalesCopy';
import Auth from './components/Auth';

import GestorDashboard from './components/GestorDashboard';
import GestorServidores from './components/GestorServidores';
import GestorClientes from './components/GestorClientes';
import GestorTemplateAI from './components/GestorTemplateAI';
import GestorCalendario from './components/GestorCalendario';
import GestorPlanos from './components/GestorPlanos';

import { supabase } from './lib/supabase';
import { createRemoteIptvUser, renewRemoteIptvUser } from './services/iptvService';

const App: React.FC = () => {
  // 1. Definição de todos os Estados (Resolve os erros de 'Cannot find name')
  const [currentView, setCurrentView] = useState<ViewType | 'login' | 'signup'>('login');
  const [session, setSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const isPro = subscriptionStatus === 'active';

  // 2. Efeito de Inicialização
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          await fetchFullUserData(currentSession.user.id);
        }
      } catch (e) {
        console.error("Erro na sessão inicial:", e);
      } finally {
        setAuthLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchFullUserData(newSession.user.id);
        setCurrentView(prev => (prev === 'login' || prev === 'signup') ? 'dashboard' : prev);
      } else {
        setCurrentView('login');
        setUserProfile(null);
        setSubscriptionStatus('trial');
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Busca de Dados do Perfil e Operacionais
  const fetchFullUserData = async (userId: string) => {
    try {
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, email, role, credits, subscription_status')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
        setSubscriptionStatus(profile.subscription_status || 'trial');
      } else {
        setUserProfile({ id: userId, email: session?.user?.email || '', role: 'reseller', credits: 0 });
      }
      await fetchData(userId);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchData = async (userId: string) => {
    try {
      const [resClients, resServers, resPlans] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('servers').select('*'),
        supabase.from('plans').select('*')
      ]);

      if (resServers.data) setServers(resServers.data.map((s: any) => ({ id: s.id, name: s.name, url: s.url, apiKey: s.api_key || s.apiKey || '' })));
      if (resPlans.data) setPlans(resPlans.data.map((p: any) => ({ id: p.id, name: p.name, price: p.price, durationValue: p.duration_value, durationUnit: p.duration_unit })));
      if (resClients.data) {
        setClients(resClients.data.map((c: any) => ({
          id: c.id, name: c.name, username: c.username, password: c.password, phone: c.phone,
          serverId: c.server_id, planId: c.plan_id, expirationDate: c.expiration_date,
          status: getClientStatus(c.expiration_date), url_m3u: c.url_m3u
        })));
      }
    } catch (e) { console.error("Erro ao carregar listas."); }
  };

  // 4. Funções Auxiliares (Status e Salvar)
  function getClientStatus(expirationDate: string): 'active' | 'expired' | 'near_expiry' {
    const now = new Date();
    const exp = new Date(expirationDate + 'T00:00:00');
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 'expired' : diffDays <= 5 ? 'near_expiry' : 'active';
  }

  const handleSaveClient = async (client: Client) => {
    const userId = session?.user.id;
    if (!userId) return;

    let finalClient = { ...client };
    const isNew = !clients.find(c => c.id === client.id);

    if (isNew) {
      const server = servers.find(s => s.id === client.serverId);
      const plan = plans.find(p => p.id === client.planId);
      if (server?.apiKey && server?.url) {
        const res = await createRemoteIptvUser(server.url, server.apiKey, {
          username: client.username, password: client.password, 
          plan: plan?.name.toLowerCase() || 'starter', 
          nome: client.name, whatsapp: client.phone
        });
        if (res.success && res.data?.credenciais) {
          finalClient.username = res.data.credenciais.usuario;
          finalClient.password = res.data.credenciais.senha;
          finalClient.url_m3u = res.data.credenciais.url_m3u;
        }
      }
    }

    const { error } = await supabase.from('clients').upsert({
      id: finalClient.id, user_id: userId, name: finalClient.name, username: finalClient.username, 
      password: finalClient.password, phone: finalClient.phone, server_id: finalClient.serverId, 
      plan_id: finalClient.planId, expiration_date: finalClient.expirationDate, 
      url_m3u: finalClient.url_m3u
    });

    if (!error) fetchData(userId);
  };

  const renewClient = async (clientId: string, planId: string, manualDate?: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    let newExp = manualDate;
    const plan = plans.find(p => p.id === (planId || client.planId));
    if (!manualDate && plan) {
      const d = new Date(client.expirationDate + 'T00:00:00') < new Date() ? new Date() : new Date(client.expirationDate + 'T00:00:00');
      if (plan.durationUnit === 'months') d.setMonth(d.getMonth() + plan.durationValue);
      else d.setDate(d.getDate() + plan.durationValue);
      newExp = d.toISOString().split('T')[0];
    }
    const userId = session?.user.id;
    if (userId) {
      const server = servers.find(s => s.id === client.serverId);
      if (server?.apiKey && server?.url) await renewRemoteIptvUser(server.url, server.apiKey, client.username, 30);
      await supabase.from('clients').update({ expiration_date: newExp, plan_id: planId || client.planId }).eq('id', clientId);
      fetchData(userId);
    }
  };

  // 5. Renderização
  const renderContent = () => {
    if (currentView === 'login' || currentView === 'signup') {
      return <Auth initialIsSignUp={currentView === 'signup'} onBack={() => setCurrentView('login')} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView as any} userProfile={userProfile} onRefreshProfile={() => session && fetchFullUserData(session.user.id)} />;
      case 'football': return <FootballBanners />;
      case 'movie': return <MovieBanners />;
      case 'series': return <SeriesBanners />;
      case 'logo': return <LogoGenerator />;
      case 'pricing': return <Pricing userEmail={session?.user?.email} isPro={isPro} />;
      case 'editor': return <AdEditor />;
      case 'ad-analyzer': return <AdAnalyzer />;
      case 'sales-copy': return <SalesCopy />;
      case 'gestor-dashboard': return <GestorDashboard clients={clients} servers={servers} onNavigate={setCurrentView as any} onRenew={renewClient} getClientStatus={getClientStatus} />;
      case 'gestor-servidores': return <GestorServidores servers={servers} onAddServer={() => {}} onDeleteServer={() => {}} />;
      case 'gestor-clientes': return <GestorClientes clients={clients} setClients={() => {}} onSaveClient={handleSaveClient} servers={servers} plans={plans} onRenew={renewClient} onDelete={() => {}} getClientStatus={getClientStatus} addDays={(d) => d.toISOString()} />;
      case 'gestor-planos': return <GestorPlanos plans={plans} setPlans={setPlans} />;
      case 'gestor-template-ai': return <GestorTemplateAI clients={clients} plans={plans} getClientStatus={getClientStatus} />;
      case 'gestor-calendario': return <GestorCalendario clients={clients} servers={servers} onNavigate={setCurrentView as any} />;
      default: return <Dashboard onNavigate={setCurrentView as any} userProfile={userProfile} onRefreshProfile={() => session && fetchFullUserData(session.user.id)} />;
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const isAuthView = currentView === 'login' || currentView === 'signup';

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-gray-100 overflow-x-hidden selection:bg-blue-500/30">
      {!isAuthView && session && <Sidebar currentView={currentView as any} onNavigate={setCurrentView as any} userEmail={session?.user.email} isPro={isPro} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      <main className={`flex-1 min-h-screen overflow-y-auto pb-20 custom-scrollbar ${!isAuthView ? 'w-full' : ''}`}>
        {!isAuthView && session && (
          <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-4 md:px-8 bg-[#0b0e14]/80 backdrop-blur sticky top-0 z-50">
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/5 rounded-lg text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] truncate">{String(currentView).replace('gestor-', 'GESTOR / ')}</span>
            </div>
            {userProfile && (
              <div className="flex items-center gap-4">
                <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Créditos: {userProfile.credits || 0}</span>
                </div>
              </div>
            )}
          </header>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
