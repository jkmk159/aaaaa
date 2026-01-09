
import React, { useState, useEffect } from 'react';
import { ViewType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userProfile, onRefreshProfile }) => {
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([]);
  const [metrics, setMetrics] = useState({ totalCustomers: 0, totalManaged: 0, totalCreditsInCirculation: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; type: 'add' | 'remove'; target: UserProfile | null }>({ 
    open: false, type: 'add', target: null 
  });
  const [createModal, setCreateModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (userProfile) {
      loadData();
    }
  }, [userProfile]);

  const loadData = async () => {
    if (!userProfile) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, role, credits, parent_id, updated_at')
        .order('updated_at', { ascending: false });

      if (userProfile.role !== 'admin') {
        query = query.eq('parent_id', userProfile.id);
      } else {
        query = query.neq('id', userProfile.id);
      }

      const { data: profiles, error: pError } = await query;
      if (pError) throw pError;

      const { count: customerCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      if (profiles) {
        setManagedUsers(profiles);
        const inCirculation = profiles.reduce((acc, curr) => acc + (curr.credits || 0), 0);
        setMetrics({
          totalManaged: profiles.length,
          totalCustomers: customerCount || 0,
          totalCreditsInCirculation: inCirculation
        });
      }
    } catch (err: any) {
      console.error('Erro no Dashboard:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!adjustModal.target || amount <= 0 || !userProfile) return;
    setLoading(true);
    try {
      const finalAmount = adjustModal.type === 'add' ? amount : -amount;
      
      if (userProfile.role !== 'admin' && adjustModal.type === 'add' && (userProfile.credits || 0) < amount) {
        alert("Erro: Você não possui saldo suficiente para transferir.");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ credits: (adjustModal.target.credits || 0) + finalAmount })
        .eq('id', adjustModal.target.id);

      if (error) {
        const { error: rpcError } = await supabase.rpc('adjust_credits', {
          p_target_user_id: adjustModal.target.id,
          p_amount: finalAmount,
          p_admin_id: userProfile.id
        });
        if (rpcError) throw rpcError;
      }

      setAdjustModal({ open: false, type: 'add', target: null });
      setAmount(0);
      await loadData();
      onRefreshProfile();
      alert("Créditos atualizados!");
    } catch (err: any) {
      alert("Falha: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`ATENÇÃO: Deseja realmente excluir permanentemente a revenda "${email}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      alert("Revendedor removido com sucesso.");
      await loadData();
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: upError } = await supabase
          .from('profiles')
          .upsert({ 
            id: authData.user.id,
            email: formData.email,
            parent_id: userProfile.id,
            role: 'reseller',
            credits: 0
          });
          
        if (upError) throw upError;
      }

      alert("Sucesso! O novo revendedor foi cadastrado na sua rede.");
      setCreateModal(false);
      setFormData({ email: '', password: '' });
      await loadData();
    } catch (err: any) {
      alert("Erro ao cadastrar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-10 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">
            DASHBOARD <span className="text-blue-500">REVENDAS</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Gestão de Equipe e Saldo</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadData}
            className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 text-xl"
          >
            🔄
          </button>
          <button 
            onClick={() => setCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] font-black uppercase italic tracking-widest text-[11px] transition-all shadow-xl shadow-blue-600/30 active:scale-95"
          >
            ⊕ NOVO REVENDEDOR
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-center">
          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">⚠️ Erro de Banco de Dados</p>
          <p className="text-gray-500 text-[9px] mt-2 uppercase">{error}</p>
          <p className="text-blue-500 text-[9px] mt-4 font-bold uppercase cursor-pointer hover:underline" onClick={() => window.location.reload()}>Recarregar Página</p>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Saldo na Rede" value={metrics.totalCreditsInCirculation} unit="Créditos" icon="💰" color="text-blue-500" bg="bg-blue-600/5" />
        <MetricCard title={userProfile?.role === 'admin' ? "Total Revendas" : "Sub-Revendas"} value={metrics.totalManaged} unit="Contas" icon="👥" color="text-purple-500" bg="bg-purple-600/5" />
        <MetricCard title="Clientes Finais" value={metrics.totalCustomers} unit="Ativos" icon="⚡" color="text-emerald-500" bg="bg-emerald-600/5" />
      </section>

      <section className="bg-[#141824] rounded-[40px] border border-gray-800 shadow-3xl overflow-hidden">
        <header className="p-8 border-b border-gray-800 bg-black/20 flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Listagem de Parceiros</h3>
          <span className="text-[8px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase">Sincronizado</span>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-[9px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-8 py-5">Usuário / E-mail</th>
                <th className="px-8 py-5 text-center">Créditos</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {managedUsers.length > 0 ? managedUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-white uppercase italic tracking-tight">{user.email.split('@')[0]}</p>
                    <p className="text-[10px] text-gray-600 font-bold">{user.email}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex items-center gap-2">
                       <span className="text-2xl font-black italic text-white tracking-tighter">{user.credits || 0}</span>
                       <span className="text-[8px] font-black text-blue-500 uppercase">cr</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right space-x-2">
                    <button 
                      onClick={() => setAdjustModal({ open: true, type: 'add', target: user })}
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-emerald-500/20"
                    >
                      + Crédito
                    </button>
                    <button 
                      onClick={() => setAdjustModal({ open: true, type: 'remove', target: user })}
                      className="bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-orange-500/20"
                    >
                      - Crédito
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                      title="Excluir Revendedor"
                    >
                      🗑️ Excluir
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="py-24 text-center opacity-20 font-black uppercase text-xs italic tracking-widest text-gray-500">Nenhum revendedor encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL AJUSTE */}
      {adjustModal.open && adjustModal.target && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setAdjustModal({ ...adjustModal, open: false })}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[40px] border border-gray-800 shadow-3xl p-10 animate-fade-in">
            <h2 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">
              {adjustModal.type === 'add' ? 'ADICIONAR' : 'REMOVER'} <span className={adjustModal.type === 'add' ? 'text-emerald-500' : 'text-orange-500'}>CRÉDITOS</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-10">Alvo: {adjustModal.target.email}</p>
            <div className="space-y-6">
              <input 
                type="number"
                value={amount}
                onChange={e => setAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-6 text-4xl font-black text-white focus:border-blue-500 outline-none text-center italic" 
              />
              <button 
                onClick={handleAdjustCredits}
                disabled={loading || amount <= 0}
                className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-xl active:scale-95 disabled:opacity-20 ${
                  adjustModal.type === 'add' ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-orange-600 shadow-orange-900/20'
                }`}
              >
                {loading ? 'PROCESSANDO...' : 'CONFIRMAR AJUSTE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO */}
      {createModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setCreateModal(false)}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[40px] border border-gray-800 shadow-3xl p-10 animate-fade-in">
            <h2 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter leading-none">NOVA <span className="text-blue-500">REVENDA</span></h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">Cadastre um parceiro para sua rede</p>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="E-mail do parceiro"
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500 outline-none" 
              />
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Senha inicial"
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500 outline-none" 
              />
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? 'CADASTRANDO...' : 'CADASTRAR REVENDEDOR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon, color, bg }: any) => (
  <div className={`rounded-[32px] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group ${bg}`}>
    <div className="relative z-10 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-500">{icon}</span>
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600">Sync Online</span>
      </div>
      <div>
        <h4 className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">{title}</h4>
        <p className={`text-4xl font-black italic tracking-tighter ${color}`}>
          {value}
          <span className="text-[9px] font-bold text-white/20 ml-2 uppercase italic">{unit}</span>
        </p>
      </div>
    </div>
  </div>
);

export default Dashboard;
