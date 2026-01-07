
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
  const [authLoading, setAuthLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');

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
        if (currentView === 'login' || currentView === 'signup') {
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
        setCurrentView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDemoLogin = (email: string = 'demo@streamhub.com') => {
    const userId = email === 'jaja@jaja' ? 'master-user-id' : 'demo-user-id';
    setSession({
      user: { email: email, id: userId }
    });
    setSubscriptionStatus('active');
    setCurrentView('dashboard');
    fetchData(userId);
  };

  const setupRealtimeSubscription = (userId: string) => {
    if (userId === 'demo-user-id' || userId === 'master-user-id') return;
    supabase
      .channel(`profile_changes_${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.new.subscription_status) {
            setSubscriptionStatus(payload.new.subscription_status);
          }
        }
      )
      .subscribe();
  };

  const fetchData = async (userId: string) => {
    if (userId === 'demo-user-id' || userId === 'master-user-id') {
      setServers([{ id: '1', name: 'Servidor VIP P2P', url: 'dns.exemplo.com', apiKey: 'demo' }]);
      setPlans([{ id: '1', name: 'Mensal PRO', price: 40, durationValue: 1, durationUnit: 'months' }]);
      setClients([{
        id: '1',
        name: 'Cliente de Teste',
        username: 'testuser',
        password: '123',
        phone: '551199999999',
        serverId: '1',
        planId: '1',
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'near_expiry'
      }]);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setSubscriptionStatus(profile.subscription_status as any);
      }

      const [resClients, resServers, resPlans] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('servers').select('*'),
        supabase.from('plans').select('*')
      ]);

      if (resServers.data) setServers(resServers.data);
      if (resPlans.data) {
        setPlans(resPlans.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          durationValue: p.duration_value,
          durationUnit: p.duration_unit
        })));
      }
      if (resClients.data) {
        setClients(resClients.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          username: c.username,
          password: c.password,
          phone: c.phone,
          serverId: c.server_id,
          /* FIXED: Map 'plan_id' from database to 'planId' property expected by the Client interface */
          planId: c.plan_id,
          expirationDate: c.expiration_date,
          status: getClientStatus(c.expiration_date),
          url_m3u: c.url_m3u
        })));
      }
    } catch (e) {
      console.error("Erro ao carregar dados.");
    }
  };

  const syncPlans = async (newPlans: Plan[]) => {
    setPlans(newPlans);
    const userId = session?.user.id;
    if (!userId || userId === 'demo-user-id' || userId === 'master-user-id') return;
    const toUpsert = newPlans.map(p => ({ id: p.id, user_id: userId, name: p.name, price: p.price, duration_value: p.durationValue, duration_unit: p.durationUnit }));
    await supabase.from('plans').upsert(toUpsert);
  };

  const syncServers = async (newServers: Server[]) => {
    setServers(newServers);
    const userId = session?.user.id;
    if (!userId || userId === 'demo-user-id' || userId === 'master-user-id') return;
    const toUpsert = newServers.map(s => ({ id: s.id, user_id: userId, name: s.name, url: s.url, apiKey: s.apiKey }));
    await supabase.from('servers').upsert(toUpsert);
  };

  const syncClients = async (newClients: Client[]) => {
    const userId = session?.user?.id;
    if (!userId) return;
    const currentIds = clients.map(c => c.id);
    const newlyAdded = newClients.find(nc => !currentIds.includes(nc.id));
    let finalClients = [...newClients];
    if (newlyAdded && userId !== 'demo-user-id' && userId !== 'master-user-id') {
      const server = servers.find(s => s.id === newlyAdded.serverId);
      const plan = plans.find(p => p.id === newlyAdded.planId);
      if (server?.apiKey && server?.url) {
        const remoteResponse = await createRemoteIptvUser(server.url, server.apiKey, {
          username: newlyAdded.username,
          password: newlyAdded.password,
          plan: plan?.name.toLowerCase() || 'starter',
          nome: newlyAdded.name,
          whatsapp: newlyAdded.phone
        });
        if (remoteResponse.success && remoteResponse.data?.credenciais) {
          const creds = remoteResponse.data.credenciais;
          newlyAdded.username = creds.usuario || newlyAdded.username;
          newlyAdded.password = creds.senha || newlyAdded.password;
          newlyAdded.url_m3u = creds.url_m3u;
          finalClients = newClients.map(c => c.id === newlyAdded.id ? newlyAdded : c);
        }
      }
    }
    setClients(finalClients);
    if (userId !== 'demo-user-id' && userId !== 'master-user-id') {
      const toUpsert = finalClients.map(c => ({ 
        id: c.id, user_id: userId, name: c.name, username: c.username, password: c.password, 
        phone: c.phone, server_id: c.serverId, plan_id: c.planId, expiration_date: c.expirationDate, url_m3u: c.url_m3u 
      }));
      await supabase.from('clients').upsert(toUpsert);
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
    if (diffDays < 0) return 'expired';
    if (diffDays <= 5) return 'near_expiry';
    return 'active';
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
      if (server?.apiKey && server?.url) {
        await renewRemoteIptvUser(server.url, server.apiKey, client.username, daysToAdd);
      }
      await supabase.from('clients').update({ expiration_date: newExp, plan_id: planId || client.planId }).eq('id', clientId);
      fetchData(session!.user.id);
    } else {
      const updated = clients.map(c => c.id === clientId ? {...c, expirationDate: newExp!, planId: planId || c.planId, status: getClientStatus(newExp!)} : c);
      setClients(updated);
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-[#0b0e14]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!session) {
    return <Auth initialIsSignUp={currentView === 'signup'} onDemoLogin={handleDemoLogin} />;
  }

  const renderContent = () => {
    const premiumViews: ViewType[] = ['editor', 'ad-analyzer', 'logo', 'sales-copy', 'gestor-template-ai'];
    if (!isPro && premiumViews.includes(currentView as any)) {
      return (
        <div className="p-20 text-center space-y-8 animate-fade-in">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-3xl mx-auto border border-blue-500/10">🔒</div>
          <h2 className="text-3xl font-black mb-4">RECURSO <span className="text-blue-500">PRO</span></h2>
          <p className="text-gray-400 max-w-md mx-auto">Esta ferramenta requer assinatura ativa.</p>
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
      case 'gestor-servidores': return <GestorServidores servers={servers} setServers={syncServers} />;
      case 'gestor-clientes': return <GestorClientes clients={clients} setClients={syncClients} servers={servers} plans={plans} onRenew={renewClient} onDelete={(id) => (session.user.id !== 'demo-user-id' && session.user.id !== 'master-user-id') ? supabase.from('clients').delete().eq('id', id).then(() => fetchData(session!.user.id)) : setClients(clients.filter(c => c.id !== id))} getClientStatus={getClientStatus} addDays={(d, v) => addDuration(d, v, 'months')} />;
      case 'gestor-planos': return <GestorPlanos plans={plans} setPlans={syncPlans} />;
      case 'gestor-template-ai': return <GestorTemplateAI clients={clients} plans={plans} getClientStatus={getClientStatus} />;
      case 'gestor-calendario': return <GestorCalendario clients={clients} servers={servers} onNavigate={setCurrentView as any} />;
      default: return <Dashboard onNavigate={setCurrentView as any} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-gray-100 overflow-x-hidden selection:bg-blue-500/30">
      <Sidebar currentView={currentView as any} onNavigate={setCurrentView as any} userEmail={session?.user.email} isPro={isPro} />
      <main className="flex-1 min-h-screen overflow-y-auto pb-20 custom-scrollbar">
        <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-8 bg-[#0b0e14]/80 backdrop-blur sticky top-0 z-50">
           <div className="flex items-center space-x-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                {String(currentView).replace('gestor-', 'GESTOR / ')}
              </span>
              {isPro && <span className="bg-blue-600/20 text-blue-500 text-[8px] px-2 py-1 rounded font-black tracking-widest uppercase border border-blue-500/20 animate-pulse">PRO</span>}
           </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
