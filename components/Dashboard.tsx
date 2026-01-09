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
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, role, credits, parent_id')
        .neq('id', userProfile.id)
        .order('updated_at', { ascending: false });

      if (userProfile.role !== 'admin') {
        query = query.eq('parent_id', userProfile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setManagedUsers(data || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     CRIAR REVENDA (EDGE FUNCTION)
  ============================ */
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

      alert('Revendedor criado com sucesso!');
      setCreateModal(false);
      setFormData({ email: '', password: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar revendedor');
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     AJUSTAR CRÉDITOS (RPC SEGURA)
  ============================ */
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

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white">Dashboard Revendas</h2>
        <button
          onClick={() => setCreateModal(true)}
          className="bg-blue-600 px-6 py-3 rounded-xl font-bold"
        >
          + Novo Revendedor
        </button>
      </header>

      {error && <p className="text-red-500">{error}</p>}

      <table className="w-full text-white">
        <thead>
          <tr>
            <th>Email</th>
            <th>Créditos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {managedUsers.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.credits ?? 0}</td>
              <td className="space-x-2">
                <button onClick={() => setAdjustModal({ open: true, type: 'add', target: user })}>
                  + Crédito
                </button>
                <button onClick={() => setAdjustModal({ open: true, type: 'remove', target: user })}>
                  - Crédito
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL CRIAR */}
      {createModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <form
            onSubmit={handleCreateAccount}
            className="bg-gray-900 p-8 rounded-xl space-y-4"
          >
            <h3 className="text-xl font-bold">Nova Revenda</h3>
            <input
              type="email"
              required
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded bg-black"
            />
            <input
              type="password"
              required
              placeholder="Senha"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 rounded bg-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 py-3 rounded font-bold"
            >
              {loading ? 'Criando...' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={() => setCreateModal(false)}
              className="w-full text-gray-400 text-sm"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* MODAL CRÉDITOS */}
      {adjustModal.open && adjustModal.target && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-gray-900 p-8 rounded-xl space-y-4">
            <h3 className="text-xl font-bold">
              {adjustModal.type === 'add' ? 'Adicionar' : 'Remover'} Créditos
            </h3>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
              className="w-full p-3 rounded bg-black"
            />
            <button
              onClick={handleAdjustCredits}
              className="w-full bg-green-600 py-3 rounded font-bold"
            >
              Confirmar
            </button>
            <button
              onClick={() => setAdjustModal({ open: false, type: 'add', target: null })}
              className="w-full text-gray-400 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
