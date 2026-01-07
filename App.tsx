import React, { useState, useEffect } from 'react';
import { Client, Server, Plan, ViewType } from './types';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GestorServidores from './components/GestorServidores';
import GestorClientes from './components/GestorClientes';
import GestorPlanos from './components/GestorPlanos';
import GestorDashboard from './components/GestorDashboard';
import GestorCalendario from './components/GestorCalendario';
import GestorTemplateAI from './components/GestorTemplateAI';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
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

  const syncServers = async (newServers: Server[]) => {
    setServers(newServers);
    await supabase.from('servers').upsert(newServers);
  };

  const deleteServer = async (id: string) => {
    const { error } = await supabase.from('servers').delete().eq('id', id);
    if (!error) setServers(servers.filter(s => s.id !== id));
    else alert("Erro ao deletar servidor do banco.");
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
    return days < 0 ? 'expired' : days < 5 ? 'near_expiry' : 'active';
  };

  if (loading) return null;
  if (!session) return <Auth onDemoLogin={() => setSession({ user: { email: 'demo@iptv.com' } } as any)} />;

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-gray-100">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} userEmail={session.user.email} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        
        {currentView === 'gestor-servidores' && (
          <GestorServidores servers={servers} setServers={syncServers} onDelete={deleteServer} />
        )}

        {currentView === 'gestor-clientes' && (
          <GestorClientes 
            clients={clients} 
            setClients={async (newClients) => {
              setClients(newClients);
              const last = newClients[newClients.length - 1];
              if (last) {
                const { id, ...data } = last;
                await supabase.from('clients').upsert([data]);
                fetchData();
              }
            }} 
            servers={servers} 
            plans={plans} 
            onRenew={() => {}} 
            onDelete={async (id) => {
              await supabase.from('clients').delete().eq('id', id);
              setClients(clients.filter(c => c.id !== id));
            }} 
            getClientStatus={getClientStatus} 
            addDays={addDuration} 
          />
        )}

        {currentView === 'gestor-planos' && <GestorPlanos plans={plans} setPlans={async (p) => { setPlans(p); await supabase.from('plans').upsert(p); }} />}
      </main>
    </div>
  );
};

export default App;
