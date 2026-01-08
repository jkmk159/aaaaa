
import React, { useState, useEffect } from 'react';
import { ViewType, Client, Server, Plan } from './types';
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
import LandingPage from './components/LandingPage';

import GestorDashboard from './components/GestorDashboard';
import GestorServidores from './components/GestorServidores';
import GestorClientes from './components/GestorClientes';
import GestorTemplateAI from './components/GestorTemplateAI';
import GestorCalendario from './components/GestorCalendario';
import GestorPlanos from './components/GestorPlanos';

import { supabase } from './lib/supabase';
import { createRemoteIptvUser, renewRemoteIptvUser } from './services/iptvService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType | 'login' | 'signup' | 'landing'>('landing');
  const [session, setSession] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchData(session.user.id);
        setupRealtimeSubscription(session.user.id);
        if (currentView === 'login' || currentView === 'signup' || currentView === 'landing') {
          setCurrentView('dashboard');
        }
      }
    });

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session) {
        fetchData(session.user.id);
        setupRealtimeSubscription(session.user.id);
        setCurrentView('dashboard');
      } else {
        setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDemoLogin = (email: string = 'demo@streamhub.com') => {
    const userId = email === 'jaja@jaja' ? 'master-user-id' : 'demo-user-id';
    setSession({ user: { email: email, id: userId } });
    setSubscriptionStatus('active');
    setCurrentView('dashboard');
    fetchData(userId);
  };

  const setupRealtimeSubscription = (userId: string) => {
    if (userId === 'demo-user-id' || userId === 'master-user-id') return;
    supabase
      .channel(`profile_changes_${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) => {
        if (payload.new.subscription_status) setSubscriptionStatus(payload.new.subscription_status);
      })
      .subscribe();
  };

  const fetchData = async (userId: string) => {
    if (userId === 'demo-user-id' || userId === 'master-user-id') {
      setServers([{ id: '1', name: 'Servidor VIP P2P', url: 'https://jordantv.shop/api/create_user.php', apiKey: 'demo' }]);
      setPlans([{ id: '1', name: 'Mensal PRO', price: 40, durationValue: 1, durationUnit: 'months' }]);
      setClients([{
        id: '1', name: 'Cliente de Teste', username: 'testuser', password: '123', phone: '551199999999',
        serverId: '1', planId: '1', expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'near_expiry'
      }]);
      return;
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('subscription_status').eq('id', userId).single();
      if (profile) setSubscriptionStatus(profile.subscription_status as any);

      const [resClients, resServers, resPlans] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('servers').select('*'),
        supabase.from('plans').select('*')
      ]);

      if (resServers.data) setServers(resServers.data.map((s: any) => ({ id: s.id, name: s.name, url: s.url, apiKey: s.api_key || s.apiKey || '' })));
      if (resPlans.data) setPlans(resPlans.data.map((p: any) => ({ id: p.id, name: p.name, price: p.price, durationValue: p.duration_value, durationUnit: p.duration_unit })));
      if (resClients.data) {
        setClients(resClients.data.map((c: any) => ({
          id: c.id, 
          name: c.name, 
          username: c.username, 
          password: c.password, 
          phone: c.phone,
          serverId: c.server_id, 
          planId: c.plan_id, 
          expiration_date: c.expiration_date, 
          expirationDate: c.expiration_date, 
          status: getClientStatus(c.expiration_date), 
          url_m3u: c.url_m3u
        })));
      }
    } catch (e) { console.error("Erro ao carregar dados."); }
  };

  const handleCreateServer = async (newServer: Server) => {
    const userId = session?.user.id;
    if (!userId) return;
    if (userId !== 'demo-user-id' && userId !== 'master-user-id') {
      await supabase.from('servers').insert({ id: newServer.id, user_id: userId, name: newServer.name, url: newServer.url, api_key: newServer.apiKey });
    }
    setServers([...servers, newServer]);
  };

  const handleDeleteServer = async (id: string) => {
    const userId = session?.user.id;
    if (!userId) return;
    if (userId !== 'demo-user-id' && userId !== 'master-user-id') {
      const { error } = await supabase.from('servers').delete().eq('id', id);
      if (error) return;
    }
    setServers(servers.filter(s => s.id !== id));
  };

  const handleSaveClient = async (client: Client) => {
    const userId = session?.user.id;
    if (!userId) return;

    let finalClient = { ...client };
    const isNew = !clients.find(c => c.id === client.id);

    if (isNew && userId !== 'demo-user-id' && userId !== 'master-user-id') {
      const server = servers.find(s => s.id === client.serverId);
      const plan = plans.find(p => p.id === client.planId);
      if (server?.apiKey && server?.url) {
        const res = await createRemoteIptvUser(server.url, server.apiKey, {
          username: client.username, 
          password: client.password, 
          plan: plan?.name.toLowerCase() || 'starter', 
          nome: client.name, 
          whatsapp: client.phone
        });
        
        if (res.success && res.data?.credenciais) {
          const creds = res.data.credenciais;
          if (!finalClient.username) finalClient.username = creds.usuario;
          if (!finalClient.password) finalClient.password = creds.senha;
          finalClient.url_m3u = creds.url_m3u;
        }
      }
    }

    if (userId !== 'demo-user-id' && userId !== 'master-user-id') {
      const { error } = await supabase.from('clients').upsert({
        id: finalClient.id, 
        user_id: userId, 
        name: finalClient.name, 
        username: finalClient.username, 
        password: finalClient.password,
        phone: finalClient.phone, 
        server_id: finalClient.serverId, 
        plan_id: finalClient.planId, 
        expiration_date: finalClient.expirationDate, 
        url_m3u: finalClient.url_m3u
      });
      
      if (error) {
        console.error("Erro ao salvar cliente:", error);
        return;
      }
      
      fetchData(userId); 
    } else {
      setClients(isNew ? [finalClient, ...clients] : clients.map(c => c.id === finalClient.id ? finalClient : c));
    }
  };

  const handleDeleteClient = async (id: string) => {
    const userId = session?.user.id;
    if (!userId) return;
    if (userId !== 'demo-user-id' && userId !== 'master-user-id') {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) return;
      fetchData(userId);
    } else {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  const isPro = subscriptionStatus === 'active';
  const addDuration = (date: Date, value: number, unit: 'months' | 'days') => {
    const d = new Date(date);
    if (unit === 'months') d.setMonth(d.getMonth() + value);
    else d.setDate(d.getDate() + value);
    return d.toISOString().split('T')[0];
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
    let daysToAdd = 30;
    const plan = plans.find(p => p.id === (planId || client.planId));
    if (!manualDate && plan) {
      daysToAdd = plan.durationUnit === 'months' ? plan.durationValue * 30 : plan.durationValue;
      const baseDate = new Date(client.expirationDate + 'T00:00:00') < new Date() ? new Date() : new Date(client.expirationDate + 'T00:00:00');
      newExp = addDuration(baseDate, plan.durationValue, plan.durationUnit);
    }
    const userId = session?.user.id;
    if (userId && userId !== 'demo-user-id' && userId !== 'master-user-id') {
      const server = servers.find(s => s.id === client.serverId);
      if (server?.apiKey && server?.url) await renewRemoteIptvUser(server.url, server.apiKey, client.username, daysToAdd);
      await supabase.from('clients').update({ expiration_date: newExp, plan_id: planId || client.planId }).eq('id', clientId);
      fetchData(userId);
    } else {
      setClients(clients.map(c => c.id === clientId ? { ...c, expirationDate: newExp!, planId: planId || c.planId, status: getClientStatus(newExp!) } : c));
    }
  };

  const renderContent = () => {
    if (currentView === 'landing' && !session) {
      return <LandingPage onLogin={() => setCurrentView('login')} onSignup={() => setCurrentView('signup')} />;
    }

    if (currentView === 'login' || currentView === 'signup') {
      return <Auth initialIsSignUp={currentView === 'signup'} onBack={() => setCurrentView('landing')} onDemoLogin={handleDemoLogin} />;
    }

    const premiumViews: ViewType[] = ['editor', 'ad-analyzer', 'logo', 'sales-copy', 'gestor-template-ai'];
    if (!isPro && premiumViews.includes(currentView as any)) {
      return (
        <div className="p-20 text-center space-y-8 animate-fade-in">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-3xl mx-auto border border-blue-500/10">🔒</div>
          <h2 className="text-3xl font-black mb-4">RECURSO <span className="text-blue-500">PRO</span></h2>
          <button onClick={() => setCurrentView('pricing')} className="bg-blue-600 px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs">Ver Planos</button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView as any} />;
      case 'football': return <FootballBanners />;
      case 'movie': return <MovieBanners />;
      case 'series': return <SeriesBanners />;
      case 'logo': return <LogoGenerator />;
      case 'pricing': return <Pricing userEmail={session!.user.email} isPro={isPro} />;
      case 'editor': return <AdEditor />;
      case 'ad-analyzer': return <AdAnalyzer />;
      case 'sales-copy': return <SalesCopy />;
      case 'gestor-dashboard': return <GestorDashboard clients={clients} servers={servers} onNavigate={setCurrentView as any} onRenew={renewClient} getClientStatus={getClientStatus} />;
      case 'gestor-servidores': return <GestorServidores servers={servers} onAddServer={handleCreateServer} onDeleteServer={handleDeleteServer} />;
      case 'gestor-clientes': return <GestorClientes clients={clients} setClients={() => {}} onSaveClient={handleSaveClient} servers={servers} plans={plans} onRenew={renewClient} onDelete={handleDeleteClient} getClientStatus={getClientStatus} addDays={(d, v) => addDuration(d, v, 'months')} />;
      case 'gestor-planos': return <GestorPlanos plans={plans} setPlans={(newPlans) => { setPlans(newPlans); }} />;
      case 'gestor-template-ai': return <GestorTemplateAI clients={clients} plans={plans} getClientStatus={getClientStatus} />;
      case 'gestor-calendario': return <GestorCalendario clients={clients} servers={servers} onNavigate={setCurrentView as any} />;
      default: return <Dashboard onNavigate={setCurrentView as any} />;
    }
  };

  const isAuthView = currentView === 'login' || currentView === 'signup' || currentView === 'landing';

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-gray-100 overflow-x-hidden selection:bg-blue-500/30">
      {!isAuthView && session && (
        <Sidebar 
          currentView={currentView as any} 
          onNavigate={setCurrentView as any} 
          userEmail={session?.user.email} 
          isPro={isPro} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <main className={`flex-1 min-h-screen overflow-y-auto pb-20 custom-scrollbar ${!isAuthView ? 'w-full' : ''}`}>
        {!isAuthView && session && (
          <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-4 md:px-8 bg-[#0b0e14]/80 backdrop-blur sticky top-0 z-50">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-white/5 rounded-lg text-gray-400"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] truncate max-w-[150px] md:max-w-none">
                {String(currentView).replace('gestor-', 'GESTOR / ')}
              </span>
              {isPro && <span className="bg-blue-600/20 text-blue-500 text-[8px] px-2 py-1 rounded font-black tracking-widest uppercase border border-blue-500/20 animate-pulse hidden sm:inline">PRO</span>}
            </div>
          </header>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
