
import React, { useState, useEffect } from 'react';
import { Client, Server, Plan, ViewType } from './types';
import { supabase } from './lib/supabase';
import { createRemoteIptvUser, renewRemoteIptvUser } from './services/iptvService';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FootballBanners from './components/FootballBanners';
import MovieBanners from './components/MovieBanners';
import SeriesBanners from './components/SeriesBanners';
import LogoGenerator from './components/LogoGenerator';
import AdEditor from './components/AdEditor';
import AdAnalyzer from './components/AdAnalyzer';
import SalesCopy from './components/SalesCopy';
import Pricing from './components/Pricing';
import GestorDashboard from './components/GestorDashboard';
import GestorServidores from './components/GestorServidores';
import GestorClientes from './components/GestorClientes';
import GestorCalendario from './components/GestorCalendario';
import GestorPlanos from './components/GestorPlanos';
import GestorTemplateAI from './components/GestorTemplateAI';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  const getClientStatus = (dateStr: string): 'active' | 'expired' | 'near_expiry' => {
    const exp = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0,0,0,0);
    const diff = exp.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) return 'expired';
    if (days <= 5) return 'near_expiry';
    return 'active';
  };

  const addDuration = (date: Date, value: number, unit: 'months' | 'days') => {
    const d = new Date(date);
    if (unit === 'months') {
      d.setMonth(d.getMonth() + value);
    } else {
      d.setDate(d.getDate() + value);
    }
    return d.toISOString().split('T')[0];
  };

  const fetchData = async (userId: string) => {
    if (userId === 'demo-user-id') {
      setClients([{ id: '1', name: 'João Silva', username: 'joao123', phone: '11999999999', serverId: 'fixed-panel', planId: '1', expirationDate: '2025-12-31', status: 'active' }]);
      setPlans([{ id: '1', name: 'Mensal', price: 35, durationValue: 1, durationUnit: 'months' }]);
      setIsPro(true);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setIsPro(profile?.subscription_status === 'active');

    const { data: clientsData } = await supabase.from('clients').select('*');
    if (clientsData) setClients(clientsData.map(c => ({
      ...c,
      expirationDate: c.expiration_date,
      serverId: c.server_id,
      planId: c.plan_id,
      status: getClientStatus(c.expiration_date)
    })));

    const { data: plansData } = await supabase.from('plans').select('*');
    if (plansData) setPlans(plansData);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetClients = async (newClientsList: Client[]) => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Detecta se é uma nova criação comparando IDs que começam com "temp-"
    const newlyAdded = newClientsList.find(nc => nc.id.startsWith('temp-'));

    if (newlyAdded && userId !== 'demo-user-id') {
      const plan = plans.find(p => p.id === newlyAdded.planId);
      
      try {
        console.log("Chamando criação remota para:", newlyAdded.username);
        const remoteResponse = await createRemoteIptvUser({
          username: newlyAdded.username,
          password: newlyAdded.password,
          plan: plan?.name.toLowerCase() || 'starter',
          nome: newlyAdded.name,
          whatsapp: newlyAdded.phone
        });

        if (remoteResponse.success) {
          const creds = remoteResponse.data?.credenciais;
          if (creds) {
            newlyAdded.username = creds.usuario || newlyAdded.username;
            newlyAdded.password = creds.senha || newlyAdded.password;
            newlyAdded.url_m3u = creds.url_m3u;
          }
          alert("✅ Sucesso! Usuário criado no painel IPTV.");
        } else {
          alert(`⚠️ Aviso: Salvo localmente, mas o painel retornou: ${remoteResponse.message}`);
        }
      } catch (err) {
        console.error("Erro técnico na criação remota:", err);
      }

      // Salva no banco de dados definitivo
      const { data: savedClient, error } = await supabase.from('clients').insert([{
        name: newlyAdded.name,
        username: newlyAdded.username,
        password: newlyAdded.password,
        phone: newlyAdded.phone,
        server_id: 'fixed-panel',
        plan_id: newlyAdded.planId,
        expiration_date: newlyAdded.expirationDate,
        user_id: userId
      }]).select().single();

      if (error) {
        console.error("Erro ao salvar no banco:", error);
      } else {
        // Atualiza a lista local com o ID real do banco
        const updatedList = newClientsList.map(c => c.id === newlyAdded.id ? {
          ...c, 
          id: savedClient.id,
          status: getClientStatus(savedClient.expiration_date)
        } : c);
        setClients(updatedList);
        return;
      }
    }

    setClients(newClientsList);
  };

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
    if (userId && userId !== 'demo-user-id') {
      try {
        const remoteRes = await renewRemoteIptvUser(client.username, daysToAdd);
        if (remoteRes.success) alert("✅ Renovação remota concluída!");
        else alert(`⚠️ Erro na renovação: ${remoteRes.message}`);

        await supabase.from('clients').update({ 
          expiration_date: newExp, 
          plan_id: planId || client.planId 
        }).eq('id', clientId);
        
        fetchData(userId);
      } catch (err) {
        alert("❌ Erro ao processar renovação.");
      }
    } else {
      const updated = clients.map(c => c.id === clientId ? {...c, expirationDate: newExp!, planId: planId || c.planId, status: getClientStatus(newExp!)} : c);
      setClients(updated);
    }
  };

  if (loading) return null;
  if (!session && !showAuth) return <LandingPage onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />;
  if (!session && showAuth) return <Auth onBack={() => setShowAuth(false)} onDemoLogin={(email) => setSession({ user: { id: 'demo-user-id', email: email || 'demo@demo.com' } })} />;

  return (
    <div className="flex bg-[#0b0e14] text-white min-h-screen">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} userEmail={session.user.email} isPro={isPro} />
      <main className="flex-1 overflow-y-auto custom-scrollbar h-screen">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'football' && <FootballBanners />}
        {currentView === 'movie' && <MovieBanners />}
        {currentView === 'series' && <SeriesBanners />}
        {currentView === 'logo' && <LogoGenerator />}
        {currentView === 'editor' && <AdEditor />}
        {currentView === 'ad-analyzer' && <AdAnalyzer />}
        {currentView === 'sales-copy' && <SalesCopy />}
        {currentView === 'pricing' && <Pricing userEmail={session.user.email} isPro={isPro} />}
        {currentView === 'gestor-dashboard' && <GestorDashboard clients={clients} servers={[]} onNavigate={setCurrentView} onRenew={renewClient} getClientStatus={getClientStatus} />}
        {currentView === 'gestor-servidores' && <div className="p-8 text-center py-40 animate-fade-in"><div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">🖥️</div><h2 className="text-2xl font-black italic uppercase tracking-tighter">API FIXA <span className="text-blue-500">CONFIGURADA</span></h2><p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 max-w-sm mx-auto leading-relaxed">Conectado ao painel JordanTV via Edge Function.</p></div>}
        {currentView === 'gestor-clientes' && <GestorClientes clients={clients} setClients={handleSetClients} servers={[]} plans={plans} onRenew={renewClient} onDelete={(id) => setClients(clients.filter(c => c.id !== id))} getClientStatus={getClientStatus} addDays={addDuration as any} />}
        {currentView === 'gestor-calendario' && <GestorCalendario clients={clients} servers={[]} onNavigate={setCurrentView} />}
        {currentView === 'gestor-planos' && <GestorPlanos plans={plans} setPlans={setPlans} />}
        {currentView === 'gestor-template-ai' && <GestorTemplateAI clients={clients} plans={plans} getClientStatus={getClientStatus} />}
      </main>
    </div>
  );
};

export default App;
