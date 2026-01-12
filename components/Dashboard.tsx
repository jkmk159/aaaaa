
import React, { useState, useEffect } from 'react';
import { ViewType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

export interface MainDashboardProps {
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

const Dashboard: React.FC<MainDashboardProps> = ({
  onNavigate,
  userProfile,
  onRefreshProfile
}) => {
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'reseller' as 'reseller'
  });

  const isAdmin = userProfile?.role === 'admin';
  const userName = userProfile?.full_name || userProfile?.email?.split('@')[0].toUpperCase() || 'USUÁRIO';

  const fetchManagedUsers = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('*');
      
      // Se não for admin, filtra apenas os criados por ele
      if (!isAdmin) {
        query = query.eq('parent_id', userProfile.id);
      } else {
        // Admin vê todos menos ele mesmo
        query = query.neq('id', userProfile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false } as any);
      if (data) setManagedUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedUsers();
  }, [userProfile]);

  const handleCreateUser = async () => {
    if (!userProfile) return;
    
    // Validação de créditos para revendedores
    if (!isAdmin && (userProfile.credits || 0) < 1) {
      alert("Saldo de créditos insuficiente! Cada novo login custa 1 crédito.");
      return;
    }

    try {
      setLoading(true);
      // 1. Criar usuário no Auth (No cenário SaaS real, você usaria uma Edge Function ou Admin Auth)
      // Aqui simulamos a criação via banco já que RLS permite inserts
      const { data, error } = await supabase.from('profiles').insert({
        email: newUser.email,
        full_name: newUser.full_name,
        role: 'reseller',
        parent_id: userProfile.id,
        credits: 0,
        subscription_status: 'trial'
      });

      if (error) throw error;

      // 2. Descontar crédito do criador se não for admin
      if (!isAdmin) {
        await supabase
          .from('profiles')
          .update({ credits: (userProfile.credits || 0) - 1 })
          .eq('id', userProfile.id);
      }

      alert("Usuário criado com sucesso!");
      setIsModalOpen(false);
      onRefreshProfile();
      fetchManagedUsers();
    } catch (e: any) {
      alert("Erro ao criar usuário: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async () => {
    if (!selectedUser || !userProfile) return;

    try {
      setLoading(true);
      // Lógica de transferência
      if (!isAdmin && (userProfile.credits || 0) < creditAmount) {
        alert("Você não tem créditos suficientes para transferir.");
        return;
      }

      // Adiciona ao sub-revenda
      await supabase
        .from('profiles')
        .update({ credits: (selectedUser.credits || 0) + creditAmount })
        .eq('id', selectedUser.id);

      // Remove do pai (se não for admin)
      if (!isAdmin) {
        await supabase
          .from('profiles')
          .update({ credits: (userProfile.credits || 0) - creditAmount })
          .eq('id', userProfile.id);
      }

      alert("Créditos atualizados!");
      setIsCreditModalOpen(false);
      onRefreshProfile();
      fetchManagedUsers();
    } catch (e) {
      alert("Erro na operação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header com Saldo de Créditos */}
      <section className="relative overflow-hidden bg-[#141824] rounded-[48px] border border-gray-800 p-8 md:p-12 shadow-3xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
              REVENDA STREAMHUB PRO
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
              OLÁ, <span className="text-blue-500">{userName}</span>
            </h2>
            <p className="text-gray-400 max-w-md text-sm font-bold uppercase tracking-widest opacity-60">
              Gerencie seus revendedores e distribua créditos.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="bg-black/40 border border-white/5 p-6 rounded-[32px] min-w-[240px] text-center md:text-right shadow-inner">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">SALDO DISPONÍVEL</p>
               <div className="flex items-center justify-center md:justify-end gap-3">
                 <span className="text-5xl font-black italic text-white leading-none">
                   {isAdmin ? '∞' : (userProfile?.credits || 0)}
                 </span>
                 <span className="text-blue-500 font-black italic text-sm mt-4 uppercase">Créditos</span>
               </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3"
            >
              <span>⊕</span> CRIAR NOVO LOGIN
            </button>
          </div>
        </div>
      </section>

      {/* Lista de Revendedores */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Minha Rede de Revendedores</h3>
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{managedUsers.length} Logins Gerenciados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-[#141824] rounded-[32px] border border-gray-800 animate-pulse"></div>
            ))
          ) : managedUsers.length > 0 ? (
            managedUsers.map((user) => (
              <div key={user.id} className="bg-[#141824] p-6 rounded-[32px] border border-gray-800 hover:border-blue-500/40 transition-all group shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${user.subscription_status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                    {user.subscription_status?.toUpperCase() || 'TRIAL'}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/5">👤</div>
                  <div>
                    <h4 className="font-black text-white italic uppercase tracking-tighter line-clamp-1">{user.full_name || user.email.split('@')[0]}</h4>
                    <p className="text-[10px] text-gray-500 font-bold lowercase truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">CRÉDITOS</p>
                    <p className="text-2xl font-black italic text-white leading-none">{user.credits || 0}</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedUser(user); setIsCreditModalOpen(true); }}
                    className="bg-white/5 hover:bg-white/10 text-blue-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    ADD CRÉDITOS
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-[48px] opacity-30">
               <span className="text-6xl block mb-4">👥</span>
               <p className="text-sm font-black uppercase tracking-widest">Nenhum sub-revendedor criado</p>
            </div>
          )}
        </div>
      </section>

      {/* Atalhos Rápidos para Ferramentas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ToolCard icon="⚽" label="Futebol" onClick={() => onNavigate('football')} />
        <ToolCard icon="🎬" label="Filmes" onClick={() => onNavigate('movie')} />
        <ToolCard icon="🎨" label="Logos" onClick={() => onNavigate('logo')} />
        <ToolCard icon="📊" label="Clientes" onClick={() => onNavigate('gestor-dashboard')} />
      </div>

      {/* Modal Criar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[48px] border border-gray-800 p-10 animate-fade-in shadow-3xl">
            <h2 className="text-3xl font-black italic text-white mb-8 uppercase tracking-tighter">NOVO <span className="text-blue-500">REVENDEDOR</span></h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  value={newUser.full_name} 
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500" 
                  placeholder="Nome do revendedor"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                <input 
                  value={newUser.email} 
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500" 
                  placeholder="email@servidor.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha Provisória</label>
                <input 
                  type="password"
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500" 
                  placeholder="••••••••"
                />
              </div>
              
              <div className="pt-6 space-y-3">
                 <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">Custo: 1 CRÉDITO</p>
                 </div>
                 <button 
                  onClick={handleCreateUser} 
                  className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-xs italic tracking-widest transition-all hover:bg-blue-700 shadow-xl"
                 >
                   CONFIRMAR CRIAÇÃO
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Créditos */}
      {isCreditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsCreditModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-[#141824] rounded-[40px] border border-gray-800 p-10 animate-fade-in shadow-3xl">
            <h2 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">GESTÃO DE <span className="text-blue-500">SALDO</span></h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">Revendedor: {selectedUser.full_name || selectedUser.email}</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Quantidade de Créditos</label>
                <input 
                  type="number"
                  value={creditAmount} 
                  onChange={e => setCreditAmount(Number(e.target.value))}
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-6 text-2xl font-black italic text-center outline-none focus:border-blue-500" 
                />
              </div>

              <button 
                onClick={handleUpdateCredits}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs italic tracking-widest hover:bg-gray-200 transition-all shadow-xl"
              >
                CONFIRMAR TRANSFERÊNCIA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolCard = ({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="bg-[#141824] p-4 rounded-2xl border border-gray-800 hover:bg-white/[0.02] hover:border-blue-500/50 transition-all flex flex-col items-center justify-center gap-2">
    <span className="text-2xl">{icon}</span>
    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
  </button>
);

export default Dashboard;
