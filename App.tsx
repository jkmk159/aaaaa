
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
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');

  const [clients, setClients] = useState<Client[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchData(session.user.id);
        setupRealtimeSubscription(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchData(session.user.id);
        setupRealtimeSubscription(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setupRealtimeSubscription = (userId: string) => {
    supabase
      .channel(`profile_changes_${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.new.subscription_status === 'active') {
            setSubscriptionStatus('active');
            alert("💎 PARABÉNS! Sua assinatura PRO foi ativada com sucesso.");
          }
        }
      )
      .subscribe();
  };

  const fetchData = async (userId: string) => {
    // Busca o status de assinatura
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single();
    
    // Se não houver perfil, o Trigger do SQL que enviei deve criar um, 
    // mas garantimos um valor padrão aqui por segurança visual.
    if (profile) {
      setSubscriptionStatus(profile.subscription_status as any);
    } else if (profileError) {
      console.warn("Perfil não encontrado, aguardando criação via trigger...");
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
        planId: c.plan_id,
        expirationDate: c.expiration_date,
        status: getClientStatus(c.expiration_date)
      })));
    }
  };

  const syncPlans = async (newPlans: Plan[]) => {
    setPlans(newPlans);
    const userId = session?.user.id;
    if (!userId) return;
    const toUpsert = newPlans.map(p => ({ id: p.id, user_id: userId, name: p.name, price: p.price, duration_value: p.durationValue, duration_unit: p.durationUnit }));
    await supabase.from('plans').upsert(toUpsert);
  };

  const syncServers = async (newServers: Server[]) => {
    setServers(newServers);
    const userId = session?.user.id;
    if (!userId) return;
    const toUpsert = newServers.map(s => ({ id: s.id, user_id: userId, name: s.name, url: s.url }));
    await supabase.from('servers').upsert(toUpsert);
  };

  const syncClients = async (newClients: Client[]) => {
    setClients(newClients);
    const userId = session?.user.id;
    if (!userId) return;
    const toUpsert = newClients.map(c => ({ id: c.id, user_id: userId, name: c.name, username: c.username, password: c.password, phone: c.phone, server_id: c.serverId, plan_id: c.planId, expiration_date: c.expirationDate }));
    await supabase.from('clients').upsert(toUpsert);
  };

  const isPro = subscriptionStatus === 'active';

  const addDuration = (date: Date, value: number, unit: 'months' | 'days') => {
    const d = new Date(date);
    if (unit === 'months') d.setMonth(d.getMonth() + value);
    else d.setDate(d.getDate() + value);
    return d.toISOString().split('T')[0];
  };

  function getClientStatus(expirationDate: string) {
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
    if (!manualDate) {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;
      const baseDate = new Date(client.expirationDate + 'T00:00:00') < new Date() ? new Date() : new Date(client.expirationDate + 'T00:00:00');
      newExp = addDuration(baseDate, plan.durationValue, plan.durationUnit);
    }
    const { error } = await supabase.from('clients').update({ expiration_date: newExp, plan_id: planId || client.planId }).eq('id', clientId);
    if (!error) fetchData(session!.user.id);
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-[#0b0e14]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session) return <Auth />;

  const renderContent = () => {
    const premiumViews: ViewType[] = ['editor', 'ad-analyzer', 'logo', 'sales-copy', 'gestor-template-ai'];
    if (!isPro && premiumViews.includes(currentView)) {
      return (
        <div className="p-20 text-center space-y-8 animate-fade-in">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-3xl mx-auto border border-blue-500/10">🔒</div>
          <h2 className="text-3xl font-black mb-4">RECURSO <span className="text-blue-500">PRO</span></h2>
          <p className="text-gray-400 max-w-md mx-auto">Esta ferramenta utiliza Inteligência Artificial avançada e está disponível apenas para assinantes ativos.</p>
          <button onClick={() => setCurrentView('pricing')} className="bg-blue-600 px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">Ver Planos e Assinar</button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} />;
      case 'football': return <FootballBanners />;
      case 'movie': return <MovieBanners />;
      case 'series': return <SeriesBanners />;
      case 'logo': return <LogoGenerator />;
      case 'pricing': return <Pricing userEmail={session!.user.email} isPro={isPro} />;
      case 'editor': return <AdEditor />;
      case 'ad-analyzer': return <AdAnalyzer />;
      case 'sales-copy': return <SalesCopy />;
      case 'gestor-dashboard': return <GestorDashboard clients={clients} servers={servers} onNavigate={setCurrentView} onRenew={renewClient} getClientStatus={getClientStatus} />;
      case 'gestor-servidores': return <GestorServidores servers={servers} setServers={syncServers} />;
      case 'gestor-clientes': return <GestorClientes clients={clients} setClients={syncClients} servers={servers} plans={plans} onRenew={renewClient} onDelete={(id) => supabase.from('clients').delete().eq('id', id).then(() => fetchData(session!.user.id))} getClientStatus={getClientStatus} addDays={(d, v) => addDuration(d, v, 'months')} />;
      case 'gestor-planos': return <GestorPlanos plans={plans} setPlans={syncPlans} />;
      case 'gestor-template-ai': return <GestorTemplateAI clients={clients} plans={plans} getClientStatus={getClientStatus} />;
      case 'gestor-calendario': return <GestorCalendario clients={clients} servers={servers} onNavigate={setCurrentView} />;
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-gray-100 overflow-x-hidden">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} userEmail={session?.user.email} />
      <main className="flex-1 min-h-screen overflow-y-auto pb-20 custom-scrollbar">
        <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-8 bg-[#0b0e14]/80 backdrop-blur sticky top-0 z-50">
           <div className="flex items-center space-x-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{currentView.replace('gestor-', 'GESTOR / ')}</span>
              {isPro && <span className="bg-blue-600/20 text-blue-500 text-[8px] px-2 py-1 rounded font-black tracking-widest uppercase border border-blue-500/20">Status: Assinante PRO</span>}
           </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
