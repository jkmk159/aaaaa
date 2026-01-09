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
      let query = supabase
  .from('profiles')
  .select('id, email, role, credits, parent_id, created_at')
  .eq('role', 'reseller');

      if (userProfile.role !== 'admin') {
        query = query.eq('parent_id', userProfile.id);
      }

      const { data: profilesData } = await query.order('created_at', { ascending: false });
      if (profilesData) setResellers(profilesData);

      const totalCredits = profilesData?.reduce((acc, curr) => acc + (curr.credits || 0), 0) || 0;
      setMetrics({
        totalCustomers: 0, // Placeholder
        totalResellers: profilesData?.length || 0,
        totalCreditsInCirculation: totalCredits
      });
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Se for revendedor, tenta descontar crédito primeiro
      if (userProfile?.role !== 'admin') {
        const { error: rpcError } = await supabase.rpc('create_sub_reseller', {
          p_email: resellerForm.email,
          p_password: resellerForm.password,
          p_parent_id: userProfile?.id
        });
        if (rpcError) throw new Error(rpcError.message);
      }

      // 2. Cria o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: resellerForm.email,
        password: resellerForm.password,
      });

      if (authError) throw authError;

      // 3. O PULO DO GATO: Força o parent_id via código se o trigger falhar
      if (authData.user && userProfile) {
        // Aguarda um pequeno delay para o trigger original terminar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ parent_id: userProfile.id })
          .eq('id', authData.user.id);
          
        if (updateError) console.error("Erro ao vincular pai:", updateError);
      }

      alert('Revendedor criado com sucesso!');
      setCreateResellerModal(false);
      setResellerForm({ email: '', password: '' });
      
      // Recarrega
      setTimeout(() => {
        loadDashboardData();
        onRefreshProfile();
      }, 500);

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
        <h2 className="text-3xl font-black italic">PAINEL DE <span className="text-blue-500">CONTROLE</span></h2>
        <button onClick={() => setCreateResellerModal(true)} className="bg-blue-600 px-6 py-3 rounded-xl font-bold text-xs">⊕ NOVO REVENDA</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141824] p-6 rounded-[30px] border border-gray-800">
           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Créditos em Revendas</p>
           <p className="text-3xl font-black text-blue-400">{metrics.totalCreditsInCirculation}</p>
        </div>
        <div className="bg-[#141824] p-6 rounded-[30px] border border-gray-800">
           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Minhas Revendas</p>
           <p className="text-3xl font-black text-purple-400">{metrics.totalResellers}</p>
        </div>
      </div>

      <div className="bg-[#141824] rounded-[30px] border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">Email</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase text-center">Créditos</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {resellers.map((r) => (
              <tr key={r.id}>
                <td className="px-6 py-4 font-bold text-sm">{r.email}</td>
                <td className="px-6 py-4 text-center font-black text-blue-500 text-xl">{r.credits}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setSelectedUser(r); setAdjustModal({ open: true, type: 'add' }); }} className="bg-green-600 p-2 rounded-lg">+</button>
                  <button onClick={() => { setSelectedUser(r); setAdjustModal({ open: true, type: 'remove' }); }} className="bg-red-600 p-2 rounded-lg">-</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createResellerModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] p-8 rounded-[30px] border border-gray-800 w-full max-w-md">
            <h3 className="text-xl font-black mb-6 text-center">CRIAR NOVO REVENDA</h3>
            <form onSubmit={handleCreateReseller} className="space-y-4">
              <input type="email" placeholder="Email" className="w-full bg-white/5 border border-gray-800 p-4 rounded-xl" value={resellerForm.email} onChange={e => setResellerForm({...resellerForm, email: e.target.value})} required />
              <input type="password" placeholder="Senha" className="w-full bg-white/5 border border-gray-800 p-4 rounded-xl" value={resellerForm.password} onChange={e => setResellerForm({...resellerForm, password: e.target.value})} required />
              <button type="submit" className="w-full bg-blue-600 p-4 rounded-xl font-black uppercase tracking-widest">{loading ? 'CRIANDO...' : 'CONFIRMAR'}</button>
              <button type="button" onClick={() => setCreateResellerModal(false)} className="w-full text-gray-500 text-[10px] font-bold">CANCELAR</button>
            </form>
          </div>
        </div>
      )}

      {adjustModal.open && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] p-8 rounded-[30px] border border-gray-800 w-full max-w-sm">
            <h3 className="text-xl font-black mb-6 text-center uppercase">{adjustModal.type === 'add' ? 'Adicionar' : 'Remover'} Créditos</h3>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-white/5 border border-gray-800 p-4 rounded-xl text-center text-2xl font-black mb-4" />
            <button onClick={handleAdjustCredits} className={`w-full p-4 rounded-xl font-black ${adjustModal.type === 'add' ? 'bg-green-600' : 'bg-red-600'}`}>CONFIRMAR</button>
            <button onClick={() => setAdjustModal({...adjustModal, open: false})} className="w-full mt-4 text-gray-500 font-bold text-xs uppercase text-center">Sair</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
