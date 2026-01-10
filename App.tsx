
import React, { useState, useEffect, useCallback } from 'react';
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
  const [currentView, setCurrentView] = useState<ViewType | 'login' | 'signup'>('login');
  const [session, setSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isPro = subscriptionStatus === 'active';

  const [clients, setClients] = useState<Client[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const fetchFullUserData = useCallback(async (userId: string) => {
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
        setUserProfile({ id: userId, email: '', role: 'reseller', credits: 0 });
      }
      await fetchData(userId);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        if (session) {
          setSession(session);
          await fetchFullUserData(session.user.id);
          setCurrentView(v => (v === 'login' || v === 'signup') ? 'dashboard' : v);
        }
        setAuthLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setSession(newSession);
        if (newSession) {
          await fetchFullUserData(newSession.user.id);
          setCurrentView(v => (v === 'login' || v === 'signup') ? 'dashboard' : v);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserProfile(null);
        setCurrentView('login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchFullUserData]);

  const fetchData = async (userId: string) => {
    if (userId.includes('demo') || userId.includes('master')) return;
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
    } catch (e) { console.error("Erro fetch data."); }
  };

  const handleSaveClient = async (client: Client) => {
    const userId = session?.user.id;
    if (!userId) return;
    let finalClient = { ...client };
    if (!clients.find(c => c.id === client.id)) {
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
    await supabase.from('clients').upsert({
      id: finalClient.id, user_id: userId, name: finalClient.name, username: finalClient.username, 
      password: finalClient.password, phone: finalClient.phone, server_id: finalClient.serverId, 
      plan_id: finalClient.planId, expiration_date: finalClient.expirationDate, url_m3u: finalClient.url_m3u
    });
    fetchData(userId);
  };

  function getClientStatus(expirationDate: string): 'active' | 'expired' | 'near_expiry' {
    const now = new Date();
    const exp = new Date(expirationDate + 'T00:00:00');
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 'expired' : diffDays <= 5 ? 'near_expiry' : 'active';
  }

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

  const renderContent = () => {
    if (currentView === 'login' || currentView === 'signup') return <Auth initialIsSignUp={currentView === 'signup'} />;
    const premiumViews: ViewType[] = ['editor', 'ad-analyzer', 'logo', 'sales-copy', 'gestor-template-ai'];
    if (!isPro && premiumViews.includes(currentView as any)) return (
      <div className="p-20 text-center space-y-8 animate-fade-in">
        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-3xl mx-auto border border-blue-500/10">🔒</div>
        <h2 className="text-3xl font-black mb-4 text-white">RECURSO <span className="text-blue-500">PRO</span></h2>
        <button onClick={() => setCurrentView('pricing')} className="bg-blue-600 px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs">Ver Planos</button>
      </div>
    );
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
      case 'gestor-servidores': return <GestorServidores servers={servers} onAddServer={val => {}} onDeleteServer={val => {}} />;
      case 'gestor-clientes': return <GestorClientes clients={clients} setClients={val => {}} onSaveClient={handleSaveClient} servers={servers} plans={plans} onRenew={renewClient} onDelete={val => {}} getClientStatus={getClientStatus} addDays={(d, v) => d.toISOString()} />;
      case 'gestor-planos': return <GestorPlanos plans={plans} setPlans={setPlans} />;
      case 'gestor-template-ai': return <GestorTemplateAI clients={clients} plans={plans} getClientStatus={getClientStatus} />;
      case 'gestor-calendario': return <GestorCalendario clients={clients} servers={servers} onNavigate={setCurrentView as any} />;
      default: return <Dashboard onNavigate={setCurrentView as any} userProfile={userProfile} onRefreshProfile={() => session && fetchFullUserData(session.user.id)} />;
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-gray-100 overflow-x-hidden selection:bg-blue-500/30">
      {session && <Sidebar currentView={currentView as any} onNavigate={setCurrentView as any} userEmail={session?.user.email} isPro={isPro} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      <main className="flex-1 min-h-screen overflow-y-auto pb-20 custom-scrollbar">
        {session && (
          <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-4 md:px-8 bg-[#0b0e14]/80 backdrop-blur sticky top-0 z-50">
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/5 rounded-lg text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] truncate">{String(currentView).replace('gestor-', 'GESTOR / ')}</span>
            </div>
            {userProfile && (
              <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Créditos: {userProfile.credits || 0}</span>
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
