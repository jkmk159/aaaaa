import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';
import { createRemoteIptvUser } from '../services/iptvService';

interface GestorClientesProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  servers: Server[]; 
  plans: Plan[];
  onRenew: (clientId: string, planId: string, manualDate?: string) => void;
  onDelete: (id: string) => void;
  getClientStatus: (date: string) => 'active' | 'expired' | 'near_expiry';
  addDays: (date: Date, value: number, unit: 'months' | 'days') => string;
}

export default function GestorClientes({ clients, setClients, servers, plans, onRenew, onDelete, getClientStatus, addDays }: GestorClientesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewingClient, setRenewingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', username: '', password: '', phone: '', serverId: '', planId: '' 
  });

  const [renewalData, setRenewalData] = useState({ planId: '', manualDate: '' });

  const handleSaveClient = async () => {
    if (!formData.username || !formData.serverId || !formData.planId) {
      alert("Selecione o Servidor e o Plano!");
      return;
    }

    setLoading(true);
    try {
      const selectedPlan = plans.find(p => p.id === formData.planId);
      
      // Chama a API IPTV
      const result = await createRemoteIptvUser({ serverId: formData.serverId, ... })
        username: formData.username,
        password: formData.password,
        plan: selectedPlan?.name || 'starter',
        nome: formData.name,
        whatsapp: formData.phone
      });

      if (result.success) {
        const expDate = result.data?.data_vencimento || addDays(new Date(), selectedPlan?.durationValue || 1, 'months');
        
        const newClient = {
          ...formData,
          expirationDate: expDate,
          status: getClientStatus(expDate),
          url_m3u: result.data?.credenciais?.url_m3u || ""
        } as any;

        // Adiciona localmente (o App.tsx salvará no Supabase)
        setClients([...clients, newClient]);
        setIsModalOpen(false);
        alert("Cliente criado com sucesso!");
      } else {
        alert("Erro no Painel: " + result.message);
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRenewal = () => {
    if (renewingClient) {
      onRenew(renewingClient.id, renewalData.planId, renewalData.manualDate);
      setIsRenewalModalOpen(false);
    }
  };

  return (
    <div className="p-8 text-white max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black italic uppercase">Gestão de <span className="text-blue-500">Clientes</span></h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-8 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          + NOVO ACESSO
        </button>
      </div>

      <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/40 text-[10px] font-black uppercase text-gray-500 tracking-widest">
            <tr>
              <th className="p-6">Nome / Usuário</th>
              <th className="p-6">Servidor</th>
              <th className="p-6">Vencimento</th>
              <th className="p-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02]">
                <td className="p-6">
                  <div className="font-bold text-sm">{c.name}</div>
                  <div className="text-[10px] text-blue-400 font-mono">{c.username}</div>
                </td>
                <td className="p-6 text-[10px] font-black uppercase text-gray-400">
                  {servers.find(s => s.id === c.serverId)?.name || 'N/A'}
                </td>
                <td className="p-6 font-mono text-xs">
                  {new Date(c.expirationDate).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-6 text-right flex justify-end gap-2">
                  <button onClick={() => { setRenewingClient(c); setIsRenewalModalOpen(true); }} className="p-2 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all">🔄</button>
                  <button onClick={() => onDelete(c.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CRIAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 w-full max-w-md shadow-2xl">
             <h2 className="text-2xl font-black mb-6 uppercase italic text-white">Novo Acesso</h2>
             <div className="space-y-4">
                <input placeholder="Nome" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, name: e.target.value})} />
                <input placeholder="Usuário" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, username: e.target.value})} />
                <input placeholder="Senha" type="password" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, password: e.target.value})} />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Servidor</label>
                  <select className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, serverId: e.target.value})}>
                    <option value="">Selecione o Servidor</option>
                    {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Plano</label>
                  <select className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, planId: e.target.value})}>
                    <option value="">Selecione o Plano</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <button disabled={loading} onClick={handleSaveClient} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all">
                  {loading ? 'SINCRONIZANDO...' : 'ATIVAR AGORA'}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 font-bold text-[10px] uppercase">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
