import React, { useState, useEffect } from 'react';
import { ViewType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userProfile, onRefreshProfile }) => {
  const [resellers, setResellers] = useState<UserProfile[]>([]);
  const [metrics, setMetrics] = useState({ totalCustomers: 0, totalResellers: 0, totalCreditsInCirculation: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; type: 'add' | 'remove' }>({ open: false, type: 'add' });
  const [createResellerModal, setCreateResellerModal] = useState(false);
  
  const [amount, setAmount] = useState<number>(0);
  const [resellerForm, setResellerForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (userProfile) {
      loadDashboardData();
    }
  }, [userProfile]);

  const loadDashboardData = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'reseller')
        .order('created_at', { ascending: false });

      if (profilesData) setResellers(profilesData);

      const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: resellersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'reseller');
      
      const totalCredits = profilesData?.reduce((acc, curr) => acc + (curr.credits || 0), 0) || 0;

      setMetrics({
        totalCustomers: customersCount || 0,
        totalResellers: resellersCount || 0,
        totalCreditsInCirculation: totalCredits
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReseller = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Se NÃO for admin (ex: vuvu@vuvu), tenta descontar o crédito primeiro via RPC
    if (userProfile?.role !== 'admin') {
      const { error: rpcError } = await supabase.rpc('create_sub_reseller', {
        p_email: resellerForm.email,
        p_password: resellerForm.password,
        p_parent_id: userProfile?.id
      });

      if (rpcError) throw new Error(rpcError.message);
    }

    // 2. Agora cria o usuário no Auth (isso dispara o seu trigger de perfil automaticamente)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: resellerForm.email,
      password: resellerForm.password,
    });

    if (authError) throw authError;

    alert('Revendedor criado! 1 crédito foi descontado do seu saldo.');
    setCreateResellerModal(false);
    setResellerForm({ email: '', password: '' });
    loadDashboardData();
    onRefreshProfile(); // Atualiza seu saldo na tela

  } catch (error: any) {
    alert(error.message);
  } finally {
    setLoading(false);
  }
};
  const handleAdjustCredits = async () => {
    if (!selectedUser || amount <= 0) return;
    setLoading(true);
    try {
      const finalAmount = adjustModal.type === 'add' ? amount : -amount;
      
      const { error } = await supabase.rpc('adjust_credits', {
        p_target_user_id: selectedUser.id,
        p_amount: finalAmount,
        p_admin_id: userProfile?.id,
        p_note: `${adjustModal.type === 'add' ? 'Adição' : 'Remoção'} manual de créditos`
      });

      if (error) throw error;

      alert('Saldo atualizado!');
      setAdjustModal({ ...adjustModal, open: false });
      setAmount(0);
      loadDashboardData();
      onRefreshProfile();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-white">
            CENTRAL DE <span className="text-blue-500">MÉTRICAS</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Gestão StreamHub</p>
        </div>
        <button 
          onClick={() => setCreateResellerModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-lg shadow-blue-900/40"
        >
          <span>⊕</span> NOVO REVENDEDOR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Créditos Totais" value={metrics.totalCreditsInCirculation} unit="UNIDADES" icon="💰" color="from-blue-600 to-cyan-500" />
        <MetricCard title="Revendedores" value={metrics.totalResellers} unit="PARCEIROS" icon="👥" color="from-purple-600 to-pink-500" />
        <MetricCard title="Clientes" value={metrics.totalCustomers} unit="ATIVOS" icon="📱" color="from-green-600 to-emerald-500" />
      </div>

      <div className="bg-[#141824] rounded-[30px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-gray-800 bg-[#1a1f2e]">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Gestão de Parceiros</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Iniciais</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Saldo</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {resellers.map((reseller) => (
                <tr key={reseller.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-600 flex items-center justify-center font-black text-white">
                      {reseller.email?.[0].toUpperCase()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-white">{reseller.email}</div>
                    <div className="text-[9px] text-gray-500 truncate max-w-[150px]">{reseller.id}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-lg font-black text-blue-400">{reseller.credits}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedUser(reseller); setAdjustModal({ open: true, type: 'add' }); }}
                        className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(reseller); setAdjustModal({ open: true, type: 'remove' }); }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"
                      >
                        -
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createResellerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#0b0e14] border border-gray-800 w-full max-w-md rounded-[40px] p-10">
             <h3 className="text-2xl font-black text-white uppercase text-center mb-6">Novo <span className="text-blue-500">Revendedor</span></h3>
             <form onSubmit={handleCreateReseller} className="space-y-4">
                <input 
                  type="email" required placeholder="E-mail"
                  value={resellerForm.email}
                  onChange={e => setResellerForm({...resellerForm, email: e.target.value})}
                  className="w-full bg-white/5 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500"
                />
                <input 
                  type="password" required placeholder="Senha"
                  value={resellerForm.password}
                  onChange={e => setResellerForm({...resellerForm, password: e.target.value})}
                  className="w-full bg-white/5 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-black text-white uppercase tracking-widest">
                  {loading ? 'CRIANDO...' : 'CADASTRAR'}
                </button>
                <button type="button" onClick={() => setCreateResellerModal(false)} className="w-full text-gray-500 text-[10px] font-bold uppercase">Cancelar</button>
             </form>
          </div>
        </div>
      )}

      {adjustModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#0b0e14] border border-gray-800 w-full max-w-sm rounded-[30px] p-8 text-white">
            <h3 className="text-xl font-black text-center mb-6 uppercase">
              {adjustModal.type === 'add' ? 'Adicionar' : 'Remover'} Créditos
            </h3>
            <input 
              type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
              className="w-full bg-white/5 border border-gray-800 rounded-xl px-6 py-4 text-center text-3xl font-black mb-6"
            />
            <button onClick={handleAdjustCredits} className={`w-full py-4 rounded-xl font-black uppercase ${adjustModal.type === 'add' ? 'bg-green-600' : 'bg-red-600'}`}>
              Confirmar
            </button>
            <button onClick={() => setAdjustModal({ ...adjustModal, open: false })} className="w-full mt-4 text-gray-500 font-bold uppercase text-[10px]">Sair</button>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon, color }: any) => (
  <div className="bg-[#141824] rounded-[30px] border border-gray-800 p-8 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 blur-2xl`}></div>
    <div className="relative z-10">
      <div className="text-2xl mb-4">{icon}</div>
      <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">{title}</h4>
      <p className="text-4xl font-black text-white italic">{value}</p>
      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">{unit}</p>
    </div>
  </div>
);

export default Dashboard;
