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
      // 1. Carregar Revendedores (que possuem este usuário como pai ou todos se for admin principal)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'reseller')
        .order('created_at', { ascending: false });

      if (profilesData) setResellers(profilesData);

      // 2. Carregar Métricas
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

  // NOVA FUNÇÃO DE CADASTRO ATUALIZADA
  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Cria o usuário no Supabase Auth. 
      // O Trigger SQL 'on_auth_user_created' criará o perfil automaticamente.
      const { data, error } = await supabase.auth.signUp({
        email: resellerForm.email,
        password: resellerForm.password,
      });

      if (error) throw error;

      alert('Revendedor cadastrado com sucesso!');
      setCreateResellerModal(false);
      setResellerForm({ email: '', password: '', role: 'reseller' });
      loadDashboardData();
    } catch (error: any) {
      alert('Erro ao cadastrar: ' + error.message);
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
      onRefreshProfile(); // Atualiza o saldo do admin no topo
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"p-4 md:p-8 space-y-8 animate-in fade-in duration-700\">
      <div className=\"flex flex-col md:flex-row md:items-center justify-between gap-4\">
        <div>
          <h2 className=\"text-4xl font-black italic tracking-tighter text-white\">
            CENTRAL DE <span className=\"text-blue-500\">MÉTRICAS</span>
          </h2>
          <p className=\"text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1\">Visão geral do ecossistema StreamHub</p>
        </div>
        <button 
          onClick={() => setCreateResellerModal(true)}
          className=\"bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-3\"
        >
          <span className=\"text-xl\">⊕</span> NOVO REVENDEDOR
        </button>
      </div>

      {/* Grid de Métricas */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
        <MetricCard title=\"Saldo em Circulação\" value={metrics.totalCreditsInCirculation} unit=\"CRÉDITOS\" icon=\"💰\" color=\"from-blue-600 to-cyan-500\" />
        <MetricCard title=\"Total Revendedores\" value={metrics.totalResellers} unit=\"PARCEIROS\" icon=\"👥\" color=\"from-purple-600 to-pink-500\" />
        <MetricCard title=\"Total Clientes\" value={metrics.totalCustomers} unit=\"ATIVOS\" icon=\"📱\" color=\"from-green-600 to-emerald-500\" />
      </div>

      {/* Lista de Revendedores */}
      <div className=\"bg-[#141824] rounded-[40px] border border-gray-800 overflow-hidden shadow-2xl\">
        <div className=\"p-8 border-b border-gray-800 flex justify-between items-center\">
          <h3 className=\"text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]\">Gestão de Parceiros</h3>
        </div>
        <div className=\"overflow-x-auto\">
          <table className=\"w-full\">
            <thead>
              <tr className=\"text-left border-b border-gray-800/50\">
                <th className=\"px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest\">Revendedor</th>
                <th className=\"px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center\">Saldo</th>
                <th className=\"px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right\">Ações</th>
              </tr>
            </thead>
            <tbody className=\"divide-y divide-gray-800/30\">
              {resellers.map((reseller) => (
                <tr key={reseller.id} className=\"hover:bg-white/[0.02] transition-colors group\">
                  <td className=\"px-8 py-6\">
                    <div className=\"flex items-center gap-4\">
                      <div className=\"w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-black text-sm\">
                        {reseller.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className=\"text-sm font-bold text-white\">{reseller.email}</div>
                        <div className=\"text-[9px] text-gray-500 font-bold uppercase tracking-widest\">ID: {reseller.id.slice(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className=\"px-8 py-6 text-center\">
                    <span className=\"text-lg font-black text-blue-400\">{reseller.credits}</span>
                    <span className=\"text-[9px] font-bold text-gray-600 ml-2\">Crs</span>
                  </td>
                  <td className=\"px-8 py-6 text-right\">
                    <div className=\"flex justify-end gap-2\">
                      <button 
                        onClick={() => { setSelectedUser(reseller); setAdjustModal({ open: true, type: 'add' }); }}
                        className=\"bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all\"
                      >
                        Add Créditos
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(reseller); setAdjustModal({ open: true, type: 'remove' }); }}
                        className=\"bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all\"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Revendedor */}
      {createResellerModal && (
        <div className=\"fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm\">
          <div className=\"bg-[#0b0e14] border border-gray-800 w-full max-w-md rounded-[40px] p-10 relative overflow-hidden\">
             <div className=\"absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500\"></div>
             <div className=\"space-y-6\">
                <div className=\"text-center space-y-2\">
                  <h3 className=\"text-2xl font-black italic text-white uppercase\">Criar <span className=\"text-blue-500\">Revendedor</span></h3>
                  <p className=\"text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em]\">Vincular novo parceiro à sua rede</p>
                </div>
                
                <form onSubmit={handleCreateReseller} className=\"space-y-4\">
                  <div className=\"space-y-2\">
                    <label className=\"text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4\">E-mail do Revendedor</label>
                    <input 
                      type=\"email\"
                      required
                      value={resellerForm.email}
                      onChange={e => setResellerForm({...resellerForm, email: e.target.value})}
                      className=\"w-full bg-white/5 border border-gray-800 rounded-2xl px-6 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-colors\"
                      placeholder=\"exemplo@email.com\"
                    />
                  </div>
                  <div className=\"space-y-2 text-left\">
                    <label className=\"text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4\">Senha Provisória</label>
                    <input 
                      type=\"password\"
                      required
                      value={resellerForm.password}
                      onChange={e => setResellerForm({...resellerForm, password: e.target.value})}
                      className=\"w-full bg-white/5 border border-gray-800 rounded-2xl px-6 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-colors\"
                      placeholder=\"••••••\"
                    />
                  </div>
                  <div className=\"pt-4 flex flex-col gap-3\">
                    <button 
                      type=\"submit\"
                      disabled={loading}
                      className=\"w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black italic uppercase text-xs tracking-widest transition-all shadow-xl shadow-blue-900/20\"
                    >
                      {loading ? 'CRIANDO...' : 'CADASTRAR REVENDEDOR'}
                    </button>
                    <button 
                      type=\"button\"
                      onClick={() => setCreateResellerModal(false)}
                      className=\"w-full text-gray-600 font-bold uppercase text-[9px] tracking-[0.3em] py-2 hover:text-white transition-colors\"
                    >
                      CANCELAR
                    </button>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Modal Ajustar Créditos */}
      {adjustModal.open && (
        <div className=\"fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm\">
          <div className=\"bg-[#0b0e14] border border-gray-800 w-full max-w-sm rounded-[40px] p-10 relative overflow-hidden\">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${adjustModal.type === 'add' ? 'from-green-500 to-emerald-400' : 'from-red-500 to-pink-500'}`}></div>
            <div className=\"space-y-6\">
              <div className=\"text-center\">
                <h3 className=\"text-xl font-black italic text-white uppercase\">
                  {adjustModal.type === 'add' ? 'Adicionar' : 'Remover'} <span className={adjustModal.type === 'add' ? 'text-green-500' : 'text-red-500'}>Créditos</span>
                </h3>
                <p className=\"text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2\">{selectedUser?.email}</p>
              </div>

              <div className=\"space-y-4\">
                <input 
                  type=\"number\"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className=\"w-full bg-white/5 border border-gray-800 rounded-2xl px-6 py-5 text-center text-3xl font-black text-white focus:outline-none focus:border-blue-500/50\"
                  placeholder=\"0\"
                />
                <button 
                  onClick={handleAdjustCredits}
                  disabled={loading || amount <= 0}
                  className={`w-full py-5 rounded-2xl font-black italic uppercase text-xs tracking-widest transition-all shadow-xl ${
                    adjustModal.type === 'add' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                  }`}
                >
                  {loading ? 'PROCESSANDO...' : `CONFIRMAR ${adjustModal.type === 'add' ? 'ADICIONAR' : 'REMOVER'}`}
                </button>
                <button onClick={() => setAdjustModal({ ...adjustModal, open: false })} className=\"w-full text-gray-600 font-bold uppercase text-[9px] tracking-[0.3em] py-2 hover:text-white transition-colors\">CANCELAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon, color }: any) => (
  <div className=\"bg-[#141824] rounded-[40px] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group\">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`}></div>
    <div className=\"relative z-10 space-y-4\">
      <div className=\"flex justify-between items-center\">
        <span className=\"text-3xl\">{icon}</span>
        <span className=\"text-[9px] font-black uppercase tracking-[0.3em] text-gray-600\">Real-Time</span>
      </div>
      <div>
        <h4 className=\"text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1\">{title}</h4>
        <p className=\"text-5xl font-black text-white italic tracking-tighter\">{value}</p>
        <p className=\"text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2\">{unit}</p>
      </div>
    </div>
  </div>
);

export default Dashboard;
