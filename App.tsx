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

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, plansRes, serversRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('plans').select('*'),
        supabase.from('servers').select('*')
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (plansRes.data) setPlans(plansRes.data);
      if (serversRes.data) setServers(serversRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleSetClients = async (newClients: Client[]) => {
    setClients(newClients);
    const lastClient = newClients[newClients.length - 1];
    if (lastClient) {
      // Removemos o ID manual para deixar o Supabase gerar o UUID e evitar erro 409
      const { id, ...clientData } = lastClient;
      await supabase.from('clients').upsert([clientData]);
      fetchData(); // Recarrega para pegar o ID oficial do banco
    }
  };

  const syncServers = async (newServers: Server[]) => {
    setServers(newServers);
    await supabase.from('servers').upsert(newServers);
  };

  const syncPlans = async (newPlans: Plan[]) => {
    setPlans(newPlans);
    await supabase.from('plans').upsert(newPlans);
  };

  const addDuration = (date: Date, value: number, unit: 'months' | 'days'): string => {
    const d = new Date(date);
    if (unit === 'months') d.setMonth(d.getMonth() + value);
    else d.setDate(d.getDate() + value);
    return d.toISOString();
  };

  const getClientStatus = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) return 'expired';
    if (days < 5) return 'near_expiry';
    return 'active';
  };

  const renewClient = async (clientId: string, planId: string, manualDate?: string) => {
    const client = clients.find(c => c.id === clientId);
    const plan = plans.find(p => p.id === planId);
    if (!client) return;

    const newDate = manualDate || addDuration(new Date(client.expirationDate), plan?.durationValue || 1, plan?.durationUnit || 'months');
    
    await supabase.from('clients').update({ 
      expirationDate: newDate,
      planId: planId 
    }).eq('id', clientId);
    
    fetchData();
  };

  if (loading) return null;
  if (!session) return <Auth onDemoLogin={() => setSession({ user: { email: 'demo@iptv.com' } } as any)} />;

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-gray-100">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} userEmail={session.user.email} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'gestor-dashboard' && <GestorDashboard clients={clients} servers={servers} onNavigate={setCurrentView} onRenew={renewClient} getClientStatus={getClientStatus} />}
        
        {/* CORREÇÃO: Renderiza o componente real de servidores em vez de texto fixo */}
        {currentView === 'gestor-servidores' && <GestorServidores servers={servers} setServers={syncServers} />}
        
        {/* CORREÇÃO: Agora passa a lista de servers real */}
        {currentView === 'gestor-clientes' && (
          <GestorClientes 
            clients={clients} 
            setClients={handleSetClients} 
            servers={servers} 
            plans={plans} 
            onRenew={renewClient} 
            onDelete={async (id) => {
              await supabase.from('clients').delete().eq('id', id);
              setClients(clients.filter(c => c.id !== id));
            }} 
            getClientStatus={getClientStatus} 
            addDays={addDuration} 
          />
        )}
        
        {currentView === 'gestor-planos' && <GestorPlanos plans={plans} setPlans={syncPlans} />}
        {currentView === 'gestor-calendario' && <GestorCalendario clients={clients} servers={servers} onNavigate={setCurrentView} />}
        {currentView === 'gestor-template-ai' && <GestorTemplateAI clients={clients} plans={plans} getClientStatus={getClientStatus} />}
      </main>
    </div>
  );
};

export default App;
