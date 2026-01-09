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
      // Especificamos as colunas exatas para evitar erro 500 por colunas fantasmas
      let query = supabase
        .from('profiles')
        .select('id, email, role, credits, parent_id, created_at')
        .eq('role', 'reseller');

      // Se não for admin, filtra para ver apenas os sub-revendedores dele
      if (userProfile.role !== 'admin') {
        query = query.eq('parent_id', userProfile.id);
      }

      const { data: profilesData, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) {
        console.error('Erro na Database:', queryError.message);
        // Se der erro 500, a mensagem aparecerá aqui no console
        return;
      }

      if (profilesData) {
        setResellers(profilesData);
        
        const totalCredits = profilesData.reduce((acc, curr) => acc + (curr.credits || 0), 0) || 0;
        setMetrics({
          totalCustomers: 0,
          totalResellers: profilesData.length,
          totalCreditsInCirculation: totalCredits
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Se for revendedor comum, desconta crédito via RPC
      if (userProfile?.role !== 'admin') {
        const { error: rpcError } = await supabase.rpc('create_sub_reseller', {
          p_email: resellerForm.email,
          p_password: resellerForm.password,
          p_parent_id: userProfile?.id
        });
        if (rpcError) throw new Error(rpcError.message);
      }

      // 2. Cria o usuário no sistema de Autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: resellerForm.email,
        password: resellerForm.password,
      });

      if (authError) throw authError;

      // 3. VÍNCULO MANUAL (Garante que ele apareça na sua lista)
      if (authData.user && userProfile) {
        // Delay para garantir que o trigger do banco já tenha criado o perfil básico
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ parent_id: userProfile.id })
          .eq('id', authData.user.id);
          
        if (updateError) console.error("Erro ao vincular parent_id:", updateError.message);
      }

      alert('Revendedor criado com sucesso!');
      setCreateResellerModal(false);
      setResellerForm({ email: '', password: '' });
      
      // Recarrega os dados após um pequeno tempo
      setTimeout(() => {
        loadDashboardData();
        onRefreshProfile();
      }, 1000);

    } catch (error: any) {
      alert('Erro ao criar: ' + error.message);
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
        p_note: `Ajuste manual via Dashboard`
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
    <div className="p-4 md:p-8 space-y-8 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic">PAINEL DE <span className="text-blue-500">CONTROLE</span></h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Status: Conectado como {userProfile?.email}</p>
        </div>
        <button onClick={() => setCreateResellerModal(true)} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-blue-900/20">
          ⊕ NOVO REVENDA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141824] p-8 rounded-[30px] border border-gray-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600 opacity-5 blur-3xl"></div>
           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Créditos em Revendas</p>
           <p className="text-4xl font-black text-blue-400 italic">{metrics.totalCreditsInCirculation}</p>
        </div>
        <div className="bg-[#141824] p-8 rounded-[30px] border border-gray-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600 opacity-5 blur-3xl"></div>
           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Minhas Revendas</p>
           <p className="text-4xl font-black text-purple-400 italic">{metrics.totalResellers}</p>
        </div>
      </div>

      <div className="bg-[#141824] rounded-[30px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-800 bg-white/5">
           <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Lista de Parceiros Diretos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800/50">
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email do Revendedor</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Saldo Atual</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {resellers.length > 0 ? resellers.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-bold text-white">{r.email}</div>
                    <div className="text-[9px] text-gray-500 font-mono opacity-50">{r.id}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-2xl font-black text-blue-400">{r.credits}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedUser(r); setAdjustModal({ open: true, type: 'add' }); }} className="bg-green-600 hover:bg-green-500 w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors">+</button>
                      <button onClick={() => { setSelectedUser(r); setAdjustModal({ open: true, type: 'remove' }); }} className="bg-red-600 hover:bg-red-500 w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors">-</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-gray-600 text-xs font-bold uppercase tracking-[0.2em]">
                    Nenhum revendedor vinculado à sua conta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createResellerModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] p-10 rounded-[40px] border border-gray-800 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black mb-2 text-center">NOVO <span className="text-blue-500">REVENDA</span></h3>
            <p className="text-center text-[10px] text-gray-500 font-bold uppercase mb-8 tracking-widest">Custo: 1 Crédito por ativação</p>
            <form onSubmit={handleCreateReseller} className="space-y-4">
              <input type="email" placeholder="E-mail de acesso" className="w-full bg-white/5 border border-gray-800 p-4 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors" value={resellerForm.email} onChange={e => setResellerForm({...resellerForm, email: e.target.value})} required />
              <input type="password" placeholder="Senha provisória" className="w-full bg-white/5 border border-gray-800 p-4 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors" value={resellerForm.password} onChange={e => setResellerForm({...resellerForm, password: e.target.value})} required />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40">
                {loading ? 'PROCESSANDO...' : 'CONFIRMAR CADASTRO'}
              </button>
              <button type="button" onClick={() => setCreateResellerModal(false)} className="w-full text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {adjustModal.open && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] p-8 rounded-[30px] border border-gray-800 w-full max-w-sm">
            <h3 className="text-xl font-black mb-6 text-center uppercase tracking-tighter">
              {adjustModal.type === 'add' ? 'Adicionar' : 'Remover'} <span className="text-blue-500">Créditos</span>
            </h3>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-white/5 border border-gray-800 p-6 rounded-2xl text-center text-4xl font-black mb-6 focus:outline-none focus:border-blue-500 transition-colors" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setAdjustModal({...adjustModal, open: false})} className="bg-gray-800 p-4 rounded-xl font-bold text-xs uppercase">Sair</button>
              <button onClick={handleAdjustCredits} className={`p-4 rounded-xl font-black text-xs uppercase shadow-lg ${adjustModal.type === 'add' ? 'bg-green-600 shadow-green-900/20' : 'bg-red-600 shadow-red-900/20'}`}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
