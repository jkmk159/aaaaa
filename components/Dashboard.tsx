
import React, { useState, useEffect } from 'react';
import { ViewType, UserProfile, ResaleCustomer } from '../types';
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
  
  // Modais
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; type: 'add' | 'remove' }>({ open: false, type: 'add' });
  const [createResellerModal, setCreateResellerModal] = useState(false);
  
  // Forms
  const [amount, setAmount] = useState<number>(0);
  const [resellerForm, setResellerForm] = useState({ email: '', password: '', role: 'reseller' as 'reseller' });

  useEffect(() => {
    if (userProfile) {
      loadDashboardData();
    }
  }, [userProfile]);

  const loadDashboardData = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      // 1. Carregar métricas e usuários dependendo do cargo
      let resellersQuery = supabase.from('profiles').select('*');
      
      if (userProfile.role === 'admin') {
        // Admin vê todos os revendedores (que não sejam outros admins)
        resellersQuery = resellersQuery.eq('role', 'reseller');
      } else {
        // Revendedor vê apenas seus sub-revendedores
        resellersQuery = resellersQuery.eq('parent_id', userProfile.id);
      }

      const { data: resData } = await resellersQuery;
      if (resData) setResellers(resData);

      // 2. Contar clientes totais sob gestão (clientes finais criados pelo usuário ou seus filhos)
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      setMetrics({
        totalCustomers: customerCount || 0,
        totalResellers: resData?.length || 0,
        totalCreditsInCirculation: resData?.reduce((acc, curr) => acc + curr.credits, 0) || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || amount <= 0 || !userProfile) return;
    
    setLoading(true);
    const finalAmount = adjustModal.type === 'add' ? amount : -amount;

    try {
      const { error } = await supabase.rpc('adjust_credits', {
        p_target_user_id: selectedUser.id,
        p_amount: finalAmount,
        p_admin_id: userProfile.id,
        p_note: `${adjustModal.type === 'add' ? 'Adição' : 'Remoção'} manual via dashboard`
      });

      if (error) throw error;

      alert(`Créditos ${adjustModal.type === 'add' ? 'adicionados' : 'removidos'} com sucesso!`);
      setAdjustModal({ open: false, type: 'add' });
      setAmount(0);
      loadDashboardData();
      onRefreshProfile();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    try {
      // Nota: Em uma aplicação real, aqui você chamaria uma Edge Function 
      // para criar o usuário no Auth usando a Service Role.
      // Aqui, inserimos no profile para demonstrar a lógica do painel.
      const { error } = await supabase.from('profiles').insert({
        email: resellerForm.email,
        role: 'reseller',
        parent_id: userProfile.id,
        credits: 0
      });

      if (error) throw error;

      alert("Novo revendedor registrado com sucesso!");
      setCreateResellerModal(false);
      setResellerForm({ email: '', password: '', role: 'reseller' });
      loadDashboardData();
    } catch (err: any) {
      alert("Erro ao criar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-10 animate-fade-in max-w-7xl mx-auto">
      {/* HEADER E AÇÕES GLOBAIS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
            CENTRAL DE <span className="text-blue-500">MÉTRICAS</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Visão geral do ecossistema StreamHUB</p>
        </div>
        <button 
          onClick={() => setCreateResellerModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[24px] font-black uppercase italic tracking-widest text-xs transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3"
        >
          <span className="text-xl">⊕</span> NOVO REVENDEDOR
        </button>
      </div>

      {/* HEADER METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Saldo em Circulação" 
          value={metrics.totalCreditsInCirculation} 
          unit="Créditos" 
          icon="💰" 
          color="from-blue-600 to-blue-400"
        />
        <MetricCard 
          title={userProfile?.role === 'admin' ? "Total Revendedores" : "Meus Sub-Revendas"} 
          value={metrics.totalResellers} 
          unit="Usuários" 
          icon="👥" 
          color="from-purple-600 to-purple-400"
        />
        <MetricCard 
          title="Contas Criadas" 
          value={metrics.totalCustomers} 
          unit="Clientes" 
          icon="⚡" 
          color="from-emerald-600 to-emerald-400"
        />
      </section>

      {/* GESTÃO DE REVENDEDORES */}
      <div className="bg-[#141824] rounded-[40px] border border-gray-800 shadow-3xl overflow-hidden">
        <header className="p-8 border-b border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
              Gestão de <span className="text-blue-500">{userProfile?.role === 'admin' ? 'Revendas' : 'Sub-Revendas'}</span>
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Controle de saldos e permissões</p>
          </div>
          <div className="flex gap-2">
             <button onClick={loadDashboardData} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">🔄</button>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-8 py-5">Revendedor</th>
                <th className="px-8 py-5">Papel</th>
                <th className="px-8 py-5">Saldo Atual</th>
                <th className="px-8 py-5 text-right">Ações de Crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {resellers.length > 0 ? resellers.map(reseller => (
                <tr key={reseller.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-white uppercase italic">{reseller.email.split('@')[0]}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{reseller.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 tracking-widest">
                      {reseller.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="text-lg font-black italic text-white">{reseller.credits}</span>
                       <span className="text-[8px] font-bold text-gray-600 uppercase">cr</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right space-x-2">
                    <button 
                      onClick={() => { setSelectedUser(reseller); setAdjustModal({ open: true, type: 'add' }); }}
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20"
                    >
                      + Créditos
                    </button>
                    <button 
                      onClick={() => { setSelectedUser(reseller); setAdjustModal({ open: true, type: 'remove' }); }}
                      className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                    >
                      - Remover
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-700 font-black uppercase text-xs tracking-[0.4em] opacity-20 italic">
                    Nenhum revendedor vinculado à sua conta
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CRIAR REVENDEDOR */}
      {createResellerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setCreateResellerModal(false)}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[48px] border border-gray-800 shadow-3xl p-12 animate-fade-in">
            <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tighter">
              CRIAR <span className="text-blue-500">REVENDEDOR</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-10">Vincular novo parceiro à sua rede</p>
            
            <form onSubmit={handleCreateReseller} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail do Revendedor</label>
                <input 
                  type="email"
                  required
                  value={resellerForm.email}
                  onChange={e => setResellerForm({...resellerForm, email: e.target.value})}
                  placeholder="exemplo@gmail.com"
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha Provisória</label>
                <input 
                  type="password"
                  required
                  value={resellerForm.password}
                  onChange={e => setResellerForm({...resellerForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500 outline-none" 
                />
              </div>

              <div className="flex flex-col gap-3 pt-6">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-xl shadow-blue-600/30 active:scale-95"
                >
                  {loading ? 'CRIANDO...' : 'CADASTRAR REVENDEDOR'}
                </button>
                <button type="button" onClick={() => setCreateResellerModal(false)} className="w-full text-gray-600 font-bold uppercase text-[9px] tracking-[0.3em] py-2 hover:text-white transition-colors">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE DE CRÉDITOS */}
      {adjustModal.open && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setAdjustModal({ ...adjustModal, open: false })}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[48px] border border-gray-800 shadow-3xl p-12 animate-fade-in">
            <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tighter">
              {adjustModal.type === 'add' ? 'ADICIONAR' : 'REMOVER'} <span className={adjustModal.type === 'add' ? 'text-emerald-500' : 'text-red-500'}>CRÉDITOS</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-10">Alvo: {selectedUser.email}</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Quantidade</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={e => setAmount(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-6 text-2xl font-black text-white focus:border-blue-500 outline-none text-center italic" 
                />
              </div>

              <div className="flex flex-col gap-3 pt-6">
                <button 
                  onClick={handleAdjustCredits}
                  disabled={loading || amount <= 0}
                  className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm transition-all shadow-xl active:scale-95 disabled:opacity-20 ${
                    adjustModal.type === 'add' ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-red-600 shadow-red-900/20'
                  }`}
                >
                  {loading ? 'PROCESSANDO...' : `CONFIRMAR ${adjustModal.type === 'add' ? 'ADICIONAR' : 'REMOVER'}`}
                </button>
                <button onClick={() => setAdjustModal({ ...adjustModal, open: false })} className="w-full text-gray-600 font-bold uppercase text-[9px] tracking-[0.3em] py-2 hover:text-white transition-colors">CANCELAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon, color }: any) => (
  <div className="bg-[#141824] rounded-[40px] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`}></div>
    <div className="relative z-10 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-3xl">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">Real-Time</span>
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">{title}</h4>
        <p className="text-5xl font-black italic text-white tracking-tighter">
          {value}
          <span className="text-[10px] font-bold text-blue-500 ml-2 uppercase italic">{unit}</span>
        </p>
      </div>
    </div>
  </div>
);

export default Dashboard;
