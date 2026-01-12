
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Lista de visualizações que EXIGEM status PRO
const PRO_VIEWS: ViewType[] = [
  'football', 'movie', 'series', 'logo', 'editor', 'ad-analyzer', 'sales-copy',
  'gestor-dashboard', 'gestor-servidores', 'gestor-clientes', 'gestor-calendario', 
  'gestor-planos', 'gestor-template-ai'
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType | 'login' | 'signup'>('login');
  const [session, setSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isMasterMode = useRef(false);
  const isPro = subscriptionStatus === 'active';

  const [clients, setClients] = useState<Client[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const getClientStatus = (expirationDate: string): 'active' | 'expired' | 'near_expiry' => {
    try {
      const now = new Date();
      const exp = new Date(expirationDate + 'T00:00:00');
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays < 0 ? 'expired' : diffDays <= 5 ? 'near_expiry' : 'active';
    } catch {
      return 'active';
    }
  };

  const addDaysHelper = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  const fetchData = useCallback(async (userId: string) => {
    if (!userId || isMasterMode.current) return;
    setDataLoading(true);
    try {
      // Usamos consultas separadas para que, se uma tabela não existir, as outras ainda carreguem
      const resServers = await supabase.from('servers').select('*');
      if (resServers.data) setServers(resServers.data.map((s: any) => ({ id: s.id, name: s.name, url: s.url, apiKey: s.api_key || s.apiKey || '' })));

      const resPlans = await supabase.from('plans').select('*');
      if (resPlans.data) setPlans(resPlans.data.map((p: any) => ({ id: p.id, name: p.name, price: p.price, durationValue: p.duration_value, durationUnit: p.duration_unit })));

      const resClients = await supabase.from('clients').select('*').order('created_at', { ascending: false });
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
          status: getClientStatus(c.expiration_date), 
          url_m3u: c.url_m3u
        })));
      }
    } catch (e) { 
      console.error("Erro ao carregar dados do banco:", e); 
    } finally { 
      setDataLoading(false); 
    }
  }, []);

  const fetchFullUserData = useCallback(async (userId: string) => {
    if (!userId || isMasterMode.current) return;
    try {
      const { data: profile, error } = await supabase.from('profiles').select('id, email, role, subscription_status, credits').eq('id', userId).maybeSingle();
      if (profile) {
        setUserProfile(profile);
        setSubscriptionStatus(profile.subscription_status || 'trial');
      }
      await fetchData(userId);
    } catch (e) { 
      console.error("Erro ao carregar perfil:", e); 
    }
  }, [fetchData]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setAuthLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          // Não aguardamos o fetch de dados para liberar a UI se demorar muito
          fetchFullUserData(initialSession.user.id);
          setCurrentView(prev => (prev === 'login' || prev === 'signup') ? 'dashboard' : prev);
        } else {
          setCurrentView('login');
        }
      } catch (e) {
        console.error("Falha crítica na inicialização:", e);
      } finally {
        // ESSENCIAL: Garante que o spinner de carregamento suma
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isMasterMode.current && event !== 'SIGNED_OUT') return;
      
      if (newSession) {
        setSession(newSession);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchFullUserData(newSession.user.id);
          if (event === 'SIGNED_IN') setCurrentView('dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        isMasterMode.current = false;
        setSession(null);
        setUserProfile(null);
        setSubscriptionStatus('trial');
        setCurrentView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchFullUserData]);

  const handleSaveClient = async (client: Client) => {
    const userId = session?.user.id;
    if (!userId || isMasterMode.current) return;
    try {
      await supabase.from('clients').upsert({
        id: client.id, 
        user_id: userId, 
        name: client.name, 
        username: client.username, 
        password: client.password, 
        phone: client.phone, 
        server_id: client.serverId, 
        plan_id: client.planId, 
        expiration_date: client.expirationDate, 
        url_m3u: client.url_m3u
      });
      fetchData(userId);
    } catch (e) {
      alert("Erro ao salvar cliente.");
    }
  };

  const renewClient = async (clientId: string, planId: string, manualDate?: string) => {
    const userId = session?.user.id;
    if (!userId || isMasterMode.current) return;
    try {
      await supabase.from('clients').update({ expiration_date: manualDate, plan_id: planId }).eq('id', clientId);
      fetchData(userId);
    } catch (e) {
      alert("Erro ao renovar cliente.");
    }
  };

  const handleDemoLogin = (email?: string) => {
    const finalEmail = email || 'jaja@jaja';
    isMasterMode.current = true;
    setSession({ user: { email: finalEmail, id: 'master' } });
    setUserProfile({ id: 'master', email: finalEmail, role: 'admin', credits: 999 });
    setSubscriptionStatus('active');
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (!session) return <Auth initialIsSignUp={currentView === 'signup'} onBack={() => setCurrentView('login')} onDemoLogin={handleDemoLogin} />;

    // BLOQUEIO CENTRALIZADO PARA USUÁRIOS TRIAL
    if (!isPro && PRO_VIEWS.includes(currentView as any)) {
      return <Pricing userEmail={session?.user?.email} isPro={false} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView as any} userProfile={userProfile} onRefreshProfile={() => !isMasterMode.current && session && fetchFullUserData(session.user.id)} />;
      case 'football': return <FootballBanners />;
      case 'movie': return <MovieBanners />;
      case 'series': return <SeriesBanners />;
      case 'logo': return <LogoGenerator />;
      case 'pricing': return <Pricing userEmail={session?.user?.email} isPro={isPro} />;
      case 'editor': return <AdEditor />;
      case 'ad-analyzer': return <AdAnalyzer />;
      case 'sales-copy': return <SalesCopy />;
      case 'gestor-dashboard': return <GestorDashboard clients={clients} servers={servers} onNavigate={setCurrentView as any} onRenew={renewClient} getClientStatus={getClientStatus} loading={dataLoading} />;
      case 'gestor-servidores': return <GestorServidores servers={servers} onAddServer={() => {}} onDeleteServer={() => {}} />;
      case 'gestor-clientes': return <GestorClientes clients={clients} setClients={setClients} onSaveClient={handleSaveClient} servers={servers} plans={plans} onRenew={renewClient} onDelete={() => {}} getClientStatus={getClientStatus} addDays={addDaysHelper} />;
      case 'gestor-planos': return <GestorPlanos plans={plans} setPlans={setPlans} />;
      case 'gestor-template-ai': return <GestorTemplateAI clients={clients} plans={plans} getClientStatus={getClientStatus} />;
      case 'gestor-calendario': return <GestorCalendario clients={clients} servers={servers} onNavigate={setCurrentView as any} />;
      default: return <Dashboard onNavigate={setCurrentView as any} userProfile={userProfile} onRefreshProfile={() => !isMasterMode.current && session && fetchFullUserData(session.user.id)} />;
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <div className="flex flex-col items-center">
        <h2 className="text-blue-500 font-black italic uppercase tracking-tighter text-2xl">Stream<span className="text-white">HUB</span></h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2 animate-pulse">Sincronizando com o servidor...</p>
      </div>
    </div>
  );

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
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] truncate">{String(currentView).replace('gestor-', 'GESTOR / ').toUpperCase()}</span>
            </div>
            {userProfile && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-gray-800">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">CRÉDITOS:</span>
                  <span className="text-xs font-black text-white italic">{userProfile.credits ?? 0}</span>
                </div>
                <div className={`border px-4 py-1.5 rounded-full ${isPro ? 'bg-blue-600/10 border-blue-500/20' : 'bg-gray-800/50 border-gray-700'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isPro ? 'text-blue-500' : 'text-gray-500'}`}>{isPro ? 'MEMBRO PRO' : 'CONTA TRIAL'}</span>
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
