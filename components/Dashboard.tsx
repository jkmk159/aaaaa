
import React, { useState, useEffect, useRef } from 'react';
import { ViewType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  userProfile,
  onRefreshProfile
}) => {
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([]);
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalManaged: 0,
    totalCreditsInCirculation: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adjustModal, setAdjustModal] = useState<{
    open: boolean;
    type: 'add' | 'remove';
    target: UserProfile | null;
  }>({ open: false, type: 'add', target: null });

  const [createModal, setCreateModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const loadingRef = useRef(false);

  useEffect(() => {
    if (userProfile) loadData();
  }, [userProfile]);

  const loadData = async () => {
    if (!userProfile || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Importante: .neq('id', userProfile.id) impede que você veja a si mesmo na lista
      let query = supabase
        .from('profiles')
        .select('id, email, role, credits, parent_id, updated_at')
        .neq('id', userProfile.id) 
        .order('updated_at', { ascending: false });

      if (userProfile.role !== 'admin') {
        query = query.eq('parent_id', userProfile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const safeData =
        data?.map(u => ({
          ...u,
          credits: Math.max(0, u.credits || 0)
        })) || [];

      setManagedUsers(safeData);

      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      setMetrics({
        totalManaged: safeData.length,
        totalCustomers: count || 0,
        totalCreditsInCirculation: safeData.reduce(
          (acc, u) => acc + (u.credits || 0),
          0
        )
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!adjustModal.target || !userProfile) return;

    const value = Math.abs(amount);
    if (value <= 0) return;

    setLoading(true);

    try {
      // A lógica de débito do Pai agora acontece DENTRO do banco via RPC
      const finalAmount = adjustModal.type === 'add' ? value : -value;

      const { error: rpcError } = await supabase.rpc('adjust_credits', {
        p_target_user_id: adjustModal.target.id,
        p_amount: finalAmount,
        p_admin_id: userProfile.id
      });

      if (rpcError) throw rpcError;

      setAdjustModal({ open: false, type: 'add', target: null });
      setAmount(0);
      alert("Créditos ajustados com sucesso!");
      await Promise.all([loadData(), onRefreshProfile()]);
    } catch (err: any) {
      alert("Falha no ajuste: " + (err.message || "Saldo insuficiente"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('create_reseller', {
        body: { 
          email: formData.email, 
          password: formData.password,
          parent_id: userProfile.id
        }
      });

      if (funcError) throw funcError;
      if (data?.error) throw new Error(data.error);

      alert("Revendedor criado! 1 crédito foi debitado da sua conta.");
      setCreateModal(false);
      setFormData({ email: '', password: '' });
      await Promise.all([loadData(), onRefreshProfile()]);
    } catch (err: any) {
      alert("Erro ao criar revenda: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Excluir permanentemente "${email}"?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-10 animate-gradient-slow max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">
            GESTÃO <span className="text-blue-500">REDE</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Saldo Atual: {userProfile?.credits || 0} créditos</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadData}
            className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 text-xl"
            title="Sincronizar"
          >
            🔄
          </button>
          <button 
            onClick={() => setCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] font-black uppercase italic tracking-widest text-[11px] transition-all shadow-xl shadow-blue-600/30 active:scale-95"
          >
            ⊕ CRIAR REVENDA (1 CR)
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Saldo em Circulação" value={metrics.totalCreditsInCirculation} unit="Créditos" icon="💰" color="text-blue-500" bg="bg-blue-600/5" />
        <MetricCard title="Sua Rede" value={metrics.totalManaged} unit="Parceiros" icon="👥" color="text-purple-500" bg="bg-purple-600/5" />
        <MetricCard title="Assinantes Ativos" value={metrics.totalCustomers} unit="Clientes" icon="⚡" color="text-emerald-500" bg="bg-emerald-600/5" />
      </section>

      <section className="bg-[#141824] rounded-[40px] border border-gray-800 shadow-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-[9px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-8 py-5">Identificação</th>
                <th className="px-8 py-5 text-center">Saldo Atual</th>
                <th className="px-8 py-5 text-right">Ações de Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {managedUsers.map(user => (
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
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Enviar
                    </button>
                    <button 
                      onClick={() => setAdjustModal({ open: true, type: 'remove', target: user })}
                      className="bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Estornar
                    </button>
                    <button onClick={() => handleDeleteUser(user.id, user.email)} className="text-red-500/30 hover:text-red-500 p-2">🗑️</button>
                  </td>
                </tr>
              ))}
              {managedUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-gray-700 uppercase font-black text-xs tracking-widest italic opacity-20">Nenhuma revenda cadastrada em sua rede</td>
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
              {adjustModal.type === 'add' ? 'ENVIAR' : 'ESTORNAR'} <span className={adjustModal.type === 'add' ? 'text-emerald-500' : 'text-orange-500'}>SALDO</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-6">Para: {adjustModal.target.email}</p>
            <div className="space-y-6">
              <input 
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-6 text-4xl font-black text-white focus:border-blue-500 outline-none text-center italic shadow-inner" 
              />
              <button 
                onClick={handleAdjustCredits}
                disabled={loading || amount <= 0}
                className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-xl ${
                  adjustModal.type === 'add' ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-orange-600 shadow-orange-900/20'
                }`}
              >
                {loading ? 'Sincronizando Banco...' : 'Confirmar Operação'}
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
            <h2 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter leading-none">NOVO <span className="text-blue-500">PARCEIRO</span></h2>
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-8">⚠️ Custo: 1 Crédito da sua conta</p>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="E-mail da Revenda"
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500 outline-none shadow-inner" 
              />
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Senha de Acesso"
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500 outline-none shadow-inner" 
              />
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Validando Saldo...' : 'Finalizar Cadastro'}
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
