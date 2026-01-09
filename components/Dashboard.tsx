import React, { useState, useEffect } from 'react';
import { ViewType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onRefreshProfile }) => {
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([]);
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalManaged: 0,
    totalCreditsInCirculation: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState<{
    open: boolean;
    type: 'add' | 'remove';
    target: UserProfile | null;
  }>({ open: false, type: 'add', target: null });

  const [amount, setAmount] = useState(0);
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (userProfile) loadData();
  }, [userProfile]);

  const loadData = async () => {
    if (!userProfile) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('profiles')
        .select('id, email, role, credits, parent_id, updated_at')
        .neq('id', userProfile.id)
        .order('updated_at', { ascending: false });

      if (userProfile.role !== 'admin') {
        query = query.eq('parent_id', userProfile.id);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      const totalCredits =
        profiles?.reduce((acc, u) => acc + (u.credits || 0), 0) || 0;

      setManagedUsers(profiles || []);
      setMetrics({
        totalManaged: profiles?.length || 0,
        totalCustomers: count || 0,
        totalCreditsInCirculation: totalCredits,
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     CRIAR REVENDA (EDGE FUNCTION)
  ================================ */
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('create_reseller', {
        body: {
          email: formData.email,
          password: formData.password,
          parent_id: userProfile.id,
        },
      });

      if (error) throw error;

      alert('Revendedor cadastrado com sucesso!');
      setCreateModal(false);
      setFormData({ email: '', password: '' });
      await loadData();
    } catch (err: any) {
      alert('Erro ao cadastrar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     AJUSTAR CRÉDITOS (RPC SEGURA)
  ================================ */
  const handleAdjustCredits = async () => {
    if (!adjustModal.target || amount <= 0 || !userProfile) return;

    if (adjustModal.target.id === userProfile.id) {
      alert('Você não pode ajustar seus próprios créditos.');
      return;
    }

    setLoading(true);
    try {
      const value = Math.abs(amount);
      const finalAmount = adjustModal.type === 'add' ? value : -value;

      const { error } = await supabase.rpc('adjust_credits', {
        p_target_user_id: adjustModal.target.id,
        p_amount: finalAmount,
        p_admin_id: userProfile.id,
      });

      if (error) throw error;

      alert('Créditos atualizados!');
      setAdjustModal({ open: false, type: 'add', target: null });
      setAmount(0);
      await loadData();
      onRefreshProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     DELETE REVENDA
  ================================ */
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Deseja excluir a revenda "${email}"?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;

      alert('Revenda removida.');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-black italic text-white">
          DASHBOARD <span className="text-blue-500">REVENDAS</span>
        </h2>
        <button
          onClick={() => setCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
        >
          ⊕ NOVO REVENDEDOR
        </button>
      </div>

      {/* METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Créditos em Revendas" value={metrics.totalCreditsInCirculation} />
        <MetricCard title="Total Revendedores" value={metrics.totalManaged} />
        <MetricCard title="Clientes Finais" value={metrics.totalCustomers} />
      </section>

      {/* LISTAGEM */}
      <section className="bg-[#141824] rounded-3xl border border-gray-800 overflow-hidden">
        <table className="w-full text-white">
          <thead className="bg-black/40 text-xs uppercase">
            <tr>
              <th className="p-6 text-left">Revenda</th>
              <th className="p-6 text-center">Créditos</th>
              <th className="p-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {managedUsers.map(user => (
              <tr key={user.id} className="border-t border-gray-800">
                <td className="p-6">{user.email}</td>
                <td className="p-6 text-center">{user.credits || 0}</td>
                <td className="p-6 text-right space-x-2">
                  <button onClick={() => setAdjustModal({ open: true, type: 'add', target: user })}>+ Crédito</button>
                  <button onClick={() => setAdjustModal({ open: true, type: 'remove', target: user })}>- Crédito</button>
                  <button onClick={() => handleDeleteUser(user.id, user.email)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* MODAIS permanecem IGUAIS ao seu layout */}
      {/* (omitidos aqui para brevidade — lógica já corrigida) */}
    </div>
  );
};

const MetricCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-black/30 p-8 rounded-3xl border border-gray-800">
    <h4 className="text-xs uppercase text-gray-400">{title}</h4>
    <p className="text-4xl font-black text-white mt-2">{value}</p>
  </div>
);

export default Dashboard;
