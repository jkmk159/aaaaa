import React, { useState, useEffect } from 'react';
import { ViewType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

export interface MainDashboardProps {
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (v: any) => void;
  placeholder?: string;
  type?: string;
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'reseller' as 'reseller'
  });

  const isAdmin = userProfile?.role === 'admin';

  const fetchManagedUsers = async () => {
    try {
      setLoading(true);
      let query = supabase.from('profiles').select('*');
      
      if (!isAdmin) {
        query = query.eq('parent_id', userProfile?.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setManagedUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.id) {
      fetchManagedUsers();
    }
  }, [userProfile?.id]);

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: newUser.full_name,
            phone: newUser.phone,
            role: newUser.role,
            parent_id: userProfile?.id,
            subscription_status: 'trial',
            credits: 0
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
        
        setIsModalOpen(false);
        setNewUser({ email: '', password: '', full_name: '', phone: '', role: 'reseller' });
        fetchManagedUsers();
      }
    } catch (error: any) {
      alert('Erro ao criar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // TRECHO CORRIGIDO PARA EVITAR ERRO TS18048
  const handleUpdateCredits = async (action: 'add' | 'remove') => {
    if (!selectedUser || creditAmount <= 0) return;

    try {
      setLoading(true);
      const currentCredits = selectedUser.credits || 0; // Garante que é um número
      const newAmount = action === 'add' 
        ? currentCredits + creditAmount 
        : Math.max(0, currentCredits - creditAmount);

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newAmount })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setIsCreditModalOpen(false);
      setCreditAmount(0);
      fetchManagedUsers();
    } catch (error: any) {
      alert('Erro ao atualizar créditos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = managedUsers.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="relative overflow-hidden bg-[#141824] border border-gray-800 rounded-[2rem] p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-600/10 px-3 py-1 rounded-full border border-blue-500/20 mb-4">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                REVENDA STREAMHUB PRO
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
              OLÁ, <span className="text-blue-500 uppercase">{userProfile?.full_name?.split(' ')[0] || 'USUÁRIO'}</span>
            </h1>
            <p className="text-gray-400 mt-2 font-medium max-w-md">
              Gerencie sua rede e controle os créditos dos seus revendedores com precisão.
            </p>
          </div>

          <div className="bg-black/40 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl min-w-[240px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SALDO DISPONÍVEL</span>
              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-500">💎</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white italic">
                {isAdmin ? '∞' : (userProfile?.credits || 0)}
              </span>
              <span className="text-[10px] font-black text-blue-500 uppercase italic">Créditos</span>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>+</span> CRIAR NOVO LOGIN
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Revendedores */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Minha Rede</h2>
            <span className="bg-blue-600/20 text-blue-500 text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-500/20">
              {filteredUsers.length} REVENDAS
            </span>
          </div>
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141824] border border-gray-800 rounded-xl px-4 py-2 text-xs text-white w-64 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-[#141824] border border-gray-800 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="group relative bg-[#141824] border border-gray-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all hover:bg-white/[0.02]">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-600/20">
                      👤
                    </div>
                    <div>
                      <h3 className="font-black text-white text-sm uppercase italic leading-none mb-1">
                        {user.full_name || 'NÃO INFORMADO'}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-medium">{user.email}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${
                    user.subscription_status === 'active' 
                      ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                      : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
                  }`}>
                    {user.subscription_status || 'trial'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-gray-800/50 mb-6">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">CRÉDITOS</span>
                  <span className="text-xl font-black text-white italic">{user.credits || 0}</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsCreditModalOpen(true);
                    }}
                    className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-blue-500/20 active:scale-95"
                  >
                    Add Créditos
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#141824] border border-gray-800 rounded-[2rem] border-dashed">
            <span className="text-4xl mb-4 block opacity-20">👥</span>
            <p className="text-gray-500 font-black text-xs uppercase tracking-widest">Nenhuma revenda encontrada</p>
          </div>
        )}
      </div>

      {/* Modal Criar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141824] border border-gray-800 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white italic uppercase italic">Novo Revendedor</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              
              <div className="space-y-4">
                <InputGroup label="Nome Completo" value={newUser.full_name} onChange={(v: any) => setNewUser({...newUser, full_name: v})} placeholder="Ex: João Silva" />
                <InputGroup label="E-mail de Acesso" value={newUser.email} onChange={(v: any) => setNewUser({...newUser, email: v})} placeholder="contato@exemplo.com" type="email" />
                <InputGroup label="Telefone / WhatsApp" value={newUser.phone} onChange={(v: any) => setNewUser({...newUser, phone: v})} placeholder="(11) 99999-9999" />
                <InputGroup label="Senha Provisória" value={newUser.password} onChange={(v: any) => setNewUser({...newUser, password: v})} placeholder="Mínimo 6 caracteres" type="password" />
              </div>

              <button 
                onClick={handleCreateUser}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'CRIANDO...' : 'CRIAR ACESSO AGORA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Créditos */}
      {isCreditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141824] border border-gray-800 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">💎</div>
              <div>
                <h2 className="text-xl font-black text-white italic uppercase italic">Gerenciar Créditos</h2>
                <p className="text-gray-500 text-[10px] font-black uppercase mt-1">Usuário: {selectedUser.full_name}</p>
              </div>

              <div className="p-6 bg-black/40 rounded-3xl border border-gray-800">
                <input 
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  className="bg-transparent text-4xl font-black text-white text-center w-full focus:outline-none italic"
                />
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2 block">Quantidade</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleUpdateCredits('add')}
                  className="bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] italic shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  ➕ ADICIONAR
                </button>
                <button 
                  onClick={() => handleUpdateCredits('remove')}
                  className="bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] italic shadow-lg shadow-red-600/20 active:scale-95"
                >
                  ➖ REMOVER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
      placeholder={placeholder}
    />
  </div>
);

export default Dashboard;
