
import React, { useState, useEffect } from 'react';
import { ViewType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

export interface MainDashboardProps {
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

const Dashboard: React.FC<MainDashboardProps> = ({
  onNavigate,
  userProfile,
  onRefreshProfile
}) => {
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'reseller' as 'reseller'
  });

  const [editUser, setEditUser] = useState({
    full_name: '',
    phone: '',
    email: ''
  });

  const isAdmin = userProfile?.role === 'admin';
  const userName = userProfile?.full_name || userProfile?.email?.split('@')[0].toUpperCase() || 'USUÁRIO';

  useEffect(() => {
    if (!userProfile) onRefreshProfile();
  }, []);

  const fetchManagedUsers = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('*');
      if (!isAdmin) {
        query = query.eq('parent_id', userProfile.id);
      } else {
        query = query.neq('id', userProfile.id);
      }
      const { data } = await query.order('created_at', { ascending: false } as any);
      if (data) setManagedUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedUsers();
  }, [userProfile]);

  const handleCreateUser = async () => {
    if (!userProfile) return;
    if (!isAdmin && (userProfile.credits || 0) < 1) {
      alert("Saldo insuficiente! Cada novo login custa 1 crédito.");
      return;
    }

    try {
      setLoading(true);
      // CORREÇÃO: Estrutura de inserção robusta
      const { error } = await supabase.from('profiles').insert({
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone,
        role: 'reseller',
        parent_id: userProfile.id,
        credits: 0,
        subscription_status: 'trial'
      });

      if (error) {
        if (error.message.includes("column \"full_name\"") || error.message.includes("column \"phone\"")) {
          alert("ERRO NO BANCO: Você precisa adicionar as colunas 'full_name' e 'phone' na tabela 'profiles' do seu Supabase.");
          throw error;
        }
        throw error;
      }

      if (!isAdmin) {
        await supabase.from('profiles').update({ credits: (userProfile.credits || 0) - 1 }).eq('id', userProfile.id);
      }

      alert("Revendedor criado com sucesso!");
      setIsModalOpen(false);
      onRefreshProfile();
      fetchManagedUsers();
    } catch (e: any) {
      console.error(e);
      alert("Falha ao criar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async (type: 'add' | 'remove') => {
    if (!selectedUser || !userProfile) return;
    const amount = Math.abs(creditAmount);
    
    try {
      setLoading(true);
      if (type === 'add') {
        if (!isAdmin && (userProfile.credits || 0) < amount) {
          alert("Créditos insuficientes.");
          return;
        }
        await supabase.from('profiles').update({ credits: (selectedUser.credits || 0) + amount }).eq('id', selectedUser.id);
        if (!isAdmin) await supabase.from('profiles').update({ credits: (userProfile.credits || 0) - amount }).eq('id', userProfile.id);
      } else {
        if ( (selectedUser.credits || 0) < amount ) {
          alert("O revendedor não possui saldo suficiente para esta remoção.");
          return;
        }
        await supabase.from('profiles').update({ credits: (selectedUser.credits || 0) - amount }).eq('id', selectedUser.id);
        if (!isAdmin) await supabase.from('profiles').update({ credits: (userProfile.credits || 0) + amount }).eq('id', userProfile.id);
      }

      alert("Saldo atualizado!");
      setIsCreditModalOpen(false);
      onRefreshProfile();
      fetchManagedUsers();
    } catch (e) { alert("Erro na operação."); } finally { setLoading(false); }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      // CORREÇÃO: PATCH ROBUSTO. Se der erro 400, explicamos o motivo (falta de colunas no banco).
      const { error } = await supabase.from('profiles').update({
        full_name: editUser.full_name,
        phone: editUser.phone,
        email: editUser.email
      }).eq('id', selectedUser.id);
      
      if (error) {
        if (error.code === '42703' || error.message.includes('column')) {
          alert("ERRO 400: Coluna não encontrada. Vá ao Supabase e adicione as colunas 'full_name' (text) e 'phone' (text) na tabela 'profiles'.");
        } else {
          alert("Erro: " + error.message);
        }
        throw error;
      }
      
      alert("Perfil atualizado!");
      setIsEditModalOpen(false);
      fetchManagedUsers();
    } catch (e: any) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const filteredUsers = managedUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Resumo e Saldo */}
      <section className="relative overflow-hidden bg-[#141824] rounded-[48px] border border-gray-800 p-8 md:p-12 shadow-3xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
              REVENDA STREAMHUB PRO
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
              OLÁ, <span className="text-blue-500">{userName}</span>
            </h2>
            <p className="text-gray-400 max-w-md text-sm font-bold uppercase tracking-widest opacity-60">
              Gerencie sua rede e controle os créditos.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="bg-black/40 border border-white/5 p-6 rounded-[32px] min-w-[240px] text-center md:text-right shadow-inner">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">SALDO DISPONÍVEL</p>
               <div className="flex items-center justify-center md:justify-end gap-3">
                 <span className="text-5xl font-black italic text-white leading-none">
                   {isAdmin ? '∞' : (userProfile?.credits ?? 0)}
                 </span>
                 <span className="text-blue-500 font-black italic text-sm mt-4 uppercase">Créditos</span>
               </div>
            </div>
            <button 
              onClick={() => {
                setNewUser({email: '', password: '', full_name: '', phone: '', role: 'reseller'});
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3"
            >
              <span>⊕</span> CRIAR NOVO LOGIN
            </button>
          </div>
        </div>
      </section>

      {/* Seção de Gerenciamento */}
      <section className="space-y-6 bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-4">
             <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Minha Rede</h3>
             <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded-lg text-[10px] font-black">{managedUsers.length} REVENDAS</span>
          </div>
          
          <div className="relative w-full md:w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail ou WhatsApp..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Tabela de Revendedores */}
        <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
          <table className="w-full text-left min-w-[800px]">
            <thead className="sticky top-0 bg-[#141824] z-10">
              <tr className="border-b border-gray-800">
                <th className="py-4 px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">Revendedor</th>
                <th className="py-4 px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest text-center">Créditos</th>
                <th className="py-4 px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest text-center">Status</th>
                <th className="py-4 px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={4} className="py-8 bg-black/10"></td></tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-xs">👤</div>
                         <div>
                           <p className="font-black text-white italic text-xs uppercase">{user.full_name || 'NÃO INFORMADO'}</p>
                           <p className="text-[9px] text-gray-500 font-bold lowercase">{user.email}</p>
                         </div>
                       </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                       <span className="text-xl font-black italic text-white">{user.role === 'admin' ? '∞' : (user.credits ?? 0)}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                       <span className={`text-[8px] font-black px-2 py-1 rounded-md border ${user.subscription_status === 'active' || user.role === 'admin' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                         {user.role === 'admin' ? 'ADMIN' : (user.subscription_status?.toUpperCase() || 'TRIAL')}
                       </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                       <div className="flex justify-end gap-2">
                         {user.phone && (
                           <button 
                            onClick={() => window.open(`https://wa.me/${user.phone?.replace(/\D/g,'')}`, '_blank')}
                            className="p-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                            title="WhatsApp"
                           >
                            📲
                           </button>
                         )}
                         <button 
                           onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); setEditUser({full_name: user.full_name || '', phone: user.phone || '', email: user.email}); }}
                           className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all"
                           title="Editar Perfil"
                         >
                           ✏️
                         </button>
                         <button 
                           onClick={() => { setSelectedUser(user); setCreditAmount(0); setIsCreditModalOpen(true); }}
                           className="p-2 rounded-xl bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
                           title="Gestão de Saldo"
                         >
                           💰
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-widest italic">Nenhum revendedor encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ToolCard icon="⚽" label="Futebol" onClick={() => onNavigate('football')} />
        <ToolCard icon="🎬" label="Filmes" onClick={() => onNavigate('movie')} />
        <ToolCard icon="🎨" label="Logos" onClick={() => onNavigate('logo')} />
        <ToolCard icon="📊" label="Clientes" onClick={() => onNavigate('gestor-dashboard')} />
      </div>

      {/* Modal Criar Login */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[48px] border border-gray-800 p-10 animate-fade-in shadow-3xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
            <h2 className="text-3xl font-black italic text-white mb-8 uppercase tracking-tighter">NOVO <span className="text-blue-500">REVENDEDOR</span></h2>
            <div className="space-y-4">
              <InputGroup label="Nome Completo" value={newUser.full_name} onChange={(v: string) => setNewUser({...newUser, full_name: v})} placeholder="Nome do Revendedor" />
              <InputGroup label="WhatsApp (com DDD)" value={newUser.phone} onChange={(v: string) => setNewUser({...newUser, phone: v})} placeholder="5511999999999" />
              <InputGroup label="E-mail" value={newUser.email} onChange={(v: string) => setNewUser({...newUser, email: v})} placeholder="email@acesso.com" />
              <InputGroup label="Senha Inicial" type="password" value={newUser.password} onChange={(v: string) => setNewUser({...newUser, password: v})} placeholder="••••••••" />
              
              <div className="pt-6">
                 <button onClick={handleCreateUser} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-xs italic tracking-widest transition-all hover:bg-blue-700 shadow-xl">
                   CRIAR E DESCONTAR 1 CRÉDITO
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Perfil */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[48px] border border-gray-800 p-10 animate-fade-in shadow-3xl">
            <h2 className="text-2xl font-black italic text-white mb-8 uppercase tracking-tighter leading-none">EDITAR <span className="text-blue-500">REVENDEDOR</span></h2>
            <div className="space-y-4">
              <InputGroup label="Nome Completo" value={editUser.full_name} onChange={(v: string) => setEditUser({...editUser, full_name: v})} />
              <InputGroup label="WhatsApp" value={editUser.phone} onChange={(v: string) => setEditUser({...editUser, phone: v})} />
              <InputGroup label="E-mail de Acesso" value={editUser.email} onChange={(v: string) => setEditUser({...editUser, email: v})} />
              <button 
                onClick={handleUpdateUser} 
                disabled={loading}
                className={`w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs italic transition-all hover:bg-gray-200 ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestão de Créditos */}
      {isCreditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsCreditModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-[#141824] rounded-[40px] border border-gray-800 p-10 animate-fade-in shadow-3xl">
            <h2 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">AJUSTE DE <span className="text-blue-500">SALDO</span></h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">Revendedor: {selectedUser.full_name || selectedUser.email}</p>
            
            <div className="space-y-6">
              <input 
                type="number"
                value={creditAmount} 
                onChange={e => setCreditAmount(Number(e.target.value))}
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-6 text-3xl font-black italic text-center outline-none focus:border-blue-500 text-white" 
                placeholder="0"
              />

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleUpdateCredits('add')}
                  className="bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] italic shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  ➕ ADICIONAR
                </button>
                <button 
                  onClick={() => handleUpdateCredits('remove')}
                  className="bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] italic shadow-lg shadow-red-600/20 active:scale-95"
                >
                  ➖ REMOVER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolCard = ({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="bg-[#141824] p-4 rounded-2xl border border-gray-800 hover:bg-white/[0.02] hover:border-blue-500/50 transition-all flex flex-col items-center justify-center gap-2">
    <span className="text-2xl">{icon}</span>
    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
  </button>
);

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" 
      placeholder={placeholder}
    />
  </div>
);

export default Dashboard;
