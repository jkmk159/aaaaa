import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ViewType, UserProfile } from '../types';

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
  const [resellers, setResellers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (userProfile) loadResellers();
  }, [userProfile]);

  const loadResellers = async () => {
    if (!userProfile) return;

    const query = supabase
      .from('profiles')
      .select('id, email, credits, role, parent_id, created_at')
      .eq('role', 'reseller');

    if (userProfile.role !== 'admin') {
      query.eq('parent_id', userProfile.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data) setResellers(data);
  };

  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) return;

    if (userProfile.credits < 1 && userProfile.role !== 'admin') {
      alert('Créditos insuficientes');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Criar usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      });

      if (error || !data.user) throw error;

      // 2️⃣ Espera trigger criar profile
      await new Promise(r => setTimeout(r, 1200));

      // 3️⃣ Define como revenda + parent
      await supabase.rpc('create_sub_reseller', {
        p_user_id: data.user.id,
        p_parent_id: userProfile.id
      });

      // 4️⃣ Desconta 1 crédito do criador (exceto admin)
      if (userProfile.role !== 'admin') {
        await supabase.rpc('adjust_credits', {
          p_target_user_id: userProfile.id,
          p_amount: -1,
          p_admin_id: userProfile.id,
          p_note: 'Criação de revenda'
        });
      }

      alert('Revenda criada com sucesso!');
      setCreateModal(false);
      setForm({ email: '', password: '' });

      onRefreshProfile();
      loadResellers();
    } catch (err: any) {
      alert(err?.message || 'Erro ao criar revenda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 text-white">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic">
          Dashboard <span className="text-blue-500">Revendas</span>
        </h2>

        <button
          onClick={() => setCreateModal(true)}
          className="bg-blue-600 px-6 py-3 rounded-xl font-bold uppercase text-xs"
        >
          + Nova Revenda
        </button>
      </div>

      <div className="bg-[#141824] rounded-3xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="p-5 text-left text-xs uppercase">E-mail</th>
              <th className="p-5 text-center text-xs uppercase">Créditos</th>
            </tr>
          </thead>
          <tbody>
            {resellers.length ? (
              resellers.map(r => (
                <tr key={r.id} className="border-t border-gray-800">
                  <td className="p-5 font-bold">{r.email}</td>
                  <td className="p-5 text-center text-blue-400 font-black">
                    {r.credits}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="p-10 text-center text-gray-500">
                  Nenhuma revenda encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreateReseller}
            className="bg-[#0b0e14] p-10 rounded-3xl w-full max-w-md space-y-4"
          >
            <h3 className="text-xl font-black text-center">
              Criar Revenda
            </h3>

            <input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="w-full p-4 rounded-xl bg-white/5 border border-gray-700"
            />

            <input
              type="password"
              placeholder="Senha"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              className="w-full p-4 rounded-xl bg-white/5 border border-gray-700"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 p-4 rounded-xl font-black"
            >
              {loading ? 'CRIANDO...' : 'CONFIRMAR'}
            </button>

            <button
              type="button"
              onClick={() => setCreateModal(false)}
              className="w-full text-xs text-gray-500 uppercase"
            >
              Voltar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
