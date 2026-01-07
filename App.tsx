import React, { useState, useEffect } from 'react';
import { Client, Server, Plan, ViewType } from './types';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GestorServidores from './components/GestorServidores';
import GestorClientes from './components/GestorClientes';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: s } = await supabase.from('servers').select('*');
      const { data: c } = await supabase.from('clients').select('*');
      const { data: p } = await supabase.from('plans').select('*');
      if (s) setServers(s);
      if (c) setClients(c);
      if (p) setPlans(p);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      setLoading(false);
    });
  }, []);

  const handleSaveServer = async (newServer: any) => {
    // Remove o ID temporário e mapeia a chave da API para o nome da coluna no banco
    const payload = { 
      name: newServer.name,
      url: newServer.url,
      api_key: newServer.apiKey || newServer.api_key, 
      user_id: session?.user?.id 
    };
    
    const { error } = await supabase.from('servers').insert([payload]);
    if (error) {
      alert("Erro no Banco (Servers): " + error.message);
    } else {
      fetchData();
    }
  };

  const handleDeleteServer = async (id: string) => {
    const { error } = await supabase.from('servers').delete().eq('id', id);
    if (!error) fetchData();
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-gray-100">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} userEmail={session?.user?.email} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        
        {currentView === 'gestor-servidores' && (
          <GestorServidores 
            servers={servers} 
            setServers={(list: any[]) => handleSaveServer(list[list.length - 1])} 
            onDelete={handleDeleteServer} 
          />
        )}

        {currentView === 'gestor-clientes' && (
          <GestorClientes 
            clients={clients} 
            servers={servers} 
            plans={plans}
            setClients={async (newList: any[]) => {
              const last = newList[newList.length - 1];
              // Mapeia camelCase do frontend para snake_case do banco (conforme image_b335c9)
              const payload = {
                name: last.name,
                username: last.username,
                password: last.password,
                phone: last.phone,
                server_id: last.serverId || last.server_id, 
                plan_id: last.planId || last.plan_id,
                expiration_date: last.expirationDate || last.expiration_date,
                user_id: session?.user?.id
              };
              const { error } = await supabase.from('clients').insert([payload]);
              if (error) alert("Erro ao salvar cliente: " + error.message);
              fetchData();
            }}
            onDelete={async (id: string) => {
              await supabase.from('clients').delete().eq('id', id);
              fetchData();
            }}
            getClientStatus={(date: string) => {
              const days = (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
              return days < 0 ? 'expired' : days < 5 ? 'near_expiry' : 'active';
            }}
            addDays={(date: Date, months: number) => {
              const d = new Date(date);
              d.setMonth(d.getMonth() + months);
              return d.toISOString();
            }}
            onRenew={() => {}}
          />
        )}
      </main>
    </div>
  );
};

export default App;
