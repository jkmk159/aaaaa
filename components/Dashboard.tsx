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
      // Seleção explícita de colunas para evitar o Erro 500 de cache/colunas fantasmas
      let query = supabase
        .from('profiles')
        .select('id, email, role, credits, parent_id, created_at')
        .eq('role', 'reseller');

      // Se não for admin, filtra para ver apenas os sub-revendedores dele
      if (userProfile.role !== 'admin') {
        query = query.eq('parent_id', userProfile.id);
      }

      const { data: profilesData, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) throw queryError;

      if (profilesData) {
        setResellers(profilesData);
        const totalCredits = profilesData.reduce((acc, curr) => acc + (curr.credits || 0), 0);
        setMetrics({
          totalCustomers: 0,
          totalResellers: profilesData.length,
          totalCreditsInCirculation: totalCredits
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Lógica de crédito via RPC
      if (userProfile?.role !== 'admin') {
        const { error: rpcError } = await supabase.rpc('create_sub_reseller', {
          p_email: resellerForm.email,
          p_password: resellerForm.password,
          p_parent_id: userProfile?.id
        });
        if (rpcError) throw new Error(rpcError.message);
      }

      // 2. Cadastro no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: resellerForm.email,
        password: resellerForm.password,
      });

      if (authError) throw authError;

      // 3. VÍNCULO FORÇADO: Garante que o usuário apareça na sua lista
      if (authData.user && userProfile) {
        // Delay necessário para o banco processar o trigger de criação
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await supabase
          .from('profiles')
          .update({ parent_id: userProfile.id })
          .eq('id', authData.user.id);
      }

      alert('Revendedor criado com sucesso!');
      setCreateResellerModal(false);
      setResellerForm({ email: '', password: '' });
      
      // Recarregamento forçado
      setTimeout(() => {
        loadDashboardData();
        onRefreshProfile();
      }, 1000);

    } catch (error: any) {
      alert('Erro: ' + error.message);
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
        p_note: `Ajuste manual`
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
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          Dashboard <span className="text-blue-500">Revendas</span>
        </h2>
        <button 
          onClick={() => setCreateResellerModal(true)} 
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
        >
          ⊕ Novo Revendedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141824] p-8 rounded-[30px] border border-gray-800">
           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Créditos em Revendas</p>
           <p className="text-4xl font-black text-blue-400 italic">{metrics.totalCreditsInCirculation}</p>
        </div>
        <div className="bg-[#141824] p-8 rounded-[30px] border border-gray-800">
           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Minhas Revendas</p>
           <p className="text-4xl font-black text-purple-400 italic">{metrics.totalResellers}</p>
        </div>
      </div>

      <div className="bg-[#141824] rounded-[30px] border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Usuário / E-mail</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Créditos</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {resellers.length > 0 ? resellers.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6 font-bold text-sm">{r.email}</td>
                <td className="px-8 py-6 text-center">
                  <span className="text-2xl font-black text-blue-500">{r.credits}</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setSelectedUser(r); setAdjustModal({ open: true, type: 'add' }); }} className="bg-green-600 hover:bg-green-500 w-10 h-10 rounded-xl font-bold transition-colors">+</button>
                    <button onClick={() => { setSelectedUser(r); setAdjustModal({ open: true, type: 'remove' }); }} className="bg-red-600 hover:bg-red-500 w-10 h-10 rounded-xl font-bold transition-colors">-</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-8 py-20 text-center text-gray-600 font-bold uppercase text-[10px] tracking-[0.3em]">
                  Nenhum revendedor encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createResellerModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] p-10 rounded-[40px] border border-gray-800 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black mb-8 text-center uppercase tracking-tighter">Cadastrar <span className="text-blue-500">Revenda</span></h3>
            <form onSubmit={handleCreateReseller} className="space-y-4">
              <input type="email" placeholder="E-mail" className="w-full bg-white/5 border border-gray-800 p-4 rounded-2xl focus:border-blue-500 focus:outline-none" value={resellerForm.email} onChange={e => setResellerForm({...resellerForm, email: e.target.value})} required />
              <input type="password" placeholder="Senha" className="w-full bg-white/5 border border-gray-800 p-4 rounded-2xl focus:border-blue-500 focus:outline-none" value={resellerForm.password} onChange={e => setResellerForm({...resellerForm, password: e.target.value})} required />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl font-black uppercase tracking-widest transition-all">
                {loading ? 'CRIANDO...' : 'CONFIRMAR'}
              </button>
              <button type="button" onClick={() => setCreateResellerModal(false)} className="w-full text-gray-500 text-[10px] font-bold uppercase tracking-widest">Voltar</button>
            </form>
          </div>
        </div>
      )}

      {adjustModal.open && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] p-10 rounded-[40px] border border-gray-800 w-full max-w-sm">
            <h3 className="text-xl font-black mb-6 text-center uppercase">{adjustModal.type === 'add' ? 'Adicionar' : 'Remover'} Créditos</h3>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-white/5 border border-gray-800 p-6 rounded-2xl text-center text-4xl font-black mb-6 focus:border-blue-500 focus:outline-none" />
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setAdjustModal({...adjustModal, open: false})} className="bg-gray-800 p-4 rounded-2xl font-bold text-[10px] uppercase">Sair</button>
               <button onClick={handleAdjustCredits} className={`p-4 rounded-2xl font-black text-[10px] uppercase ${adjustModal.type === 'add' ? 'bg-green-600' : 'bg-red-600'}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
