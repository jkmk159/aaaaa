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

  // FUNÇÃO DE SALVAMENTO DIRETO PARA EVITAR CONFLITOS
  const handleSaveServer = async (newServer: any) => {
    const { id, ...dataToSave } = newServer;
    // Garante que o user_id da sessão seja enviado
    const payload = { ...dataToSave, user_id: session?.user?.id };
    
    const { error } = await supabase.from('servers').insert([payload]);
    if (error) {
      alert("Erro no Banco: " + error.message);
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
            setServers={(list) => handleSaveServer(list[list.length - 1])} 
            onDelete={handleDeleteServer} 
          />
        )}

        {currentView === 'gestor-clientes' && (
          <GestorClientes 
            clients={clients} 
            servers={servers} 
            plans={plans}
            setClients={async (newList) => {
              const last = newList[newList.length - 1];
              const { id, ...data } = last;
              // Mapeia para os nomes exatos das colunas do seu banco (image_b335c9)
              const payload = {
                name: data.name,
                username: data.username,
                password: data.password,
                phone: data.phone,
                server_id: (data as any).serverId, 
                plan_id: (data as any).planId,
                expiration_date: (data as any).expirationDate,
                user_id: session?.user?.id
              };
              await supabase.from('clients').insert([payload]);
              fetchData();
            }}
            onDelete={async (id) => {
              await supabase.from('clients').delete().eq('id', id);
              fetchData();
            }}
            getClientStatus={(date) => 'active'}
            addDays={(d, v, u) => new Date().toISOString()}
            onRenew={() => {}}
          />
        )}
      </main>
    </div>
  );
};

export default App;
