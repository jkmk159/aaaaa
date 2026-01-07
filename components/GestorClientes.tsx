import React, { useState } from 'react';
import { Client, Plan, Server } from '../types';
import { createRemoteIptvUser, renewRemoteIptvUser } from '../services/iptvService';

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

  const [renewalData, setRenewalData] = useState({ planId: '' });

  const handleSaveClient = async () => {
    if (!formData.username || !formData.serverId || !formData.planId) {
      alert("Preencha Usuário, Servidor e Plano!");
      return;
    }

    setLoading(true);
    try {
      const selectedPlan = plans.find(p => p.id === formData.planId);
      
      const result = await createRemoteIptvUser({
        ...formData,
        plan: selectedPlan?.name || 'starter'
      });

      if (result.success) {
        const expDate = result.data?.data_vencimento || addDays(new Date(), selectedPlan?.durationValue || 1, 'months');
        
        // Criamos o objeto SEM o ID para o Supabase gerar um novo (Evita Erro 409)
        const newClient = {
          ...formData,
          expirationDate: expDate,
          status: getClientStatus(expDate),
          url_m3u: result.data?.credenciais?.url_m3u || ""
        };

        // Aqui o setClients do App.tsx deve lidar com o insert no banco
        setClients([...clients, { ...newClient, id: crypto.randomUUID() } as Client]);
        setIsModalOpen(false);
        alert("Cliente criado com sucesso!");
      } else {
        alert("Erro no Painel: " + result.message);
      }
    } catch (err) {
      alert("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRenewal = async () => {
    if (!renewingClient || !renewalData.planId) return;
    
    setLoading(true);
    try {
      const selectedPlan = plans.find(p => p.id === renewalData.planId);
      const result = await renewRemoteIptvUser(renewingClient.username, selectedPlan?.durationValue || 30);

      if (result.success) {
        const novaData = result.data?.nova_data_vencimento;
        onRenew(renewingClient.id, renewalData.planId, novaData);
        setIsRenewalModalOpen(false);
        alert("Renovado!");
      } else {
        alert("Erro: " + result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 text-white">
      <div className="flex justify-between mb-8">
        <h1 className="text-2xl font-black italic uppercase">Clientes</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-6 py-2 rounded-xl font-bold"> + NOVO CLIENTE </button>
      </div>

      <input 
        placeholder="Buscar cliente..." 
        className="w-full bg-[#141824] border border-gray-800 p-4 rounded-2xl mb-6 outline-none"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="bg-[#141824] rounded-3xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-5">Nome/Usuário</th>
              <th className="p-5">Vencimento</th>
              <th className="p-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredClients.map(c => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="p-5">
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-blue-400 font-mono">{c.username}</div>
                </td>
                <td className="p-5 text-sm font-mono">{new Date(c.expirationDate).toLocaleDateString()}</td>
                <td className="p-5 text-right space-x-2">
                  <button onClick={() => { setRenewingClient(c); setIsRenewalModalOpen(true); }} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">🔄</button>
                  <button onClick={() => onDelete(c.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Simplificado para Criar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800 w-full max-w-md">
            <h2 className="text-xl font-black mb-6 uppercase">Novo Acesso</h2>
            <div className="space-y-4">
              <input placeholder="Nome do Cliente" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="Usuário IPTV" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl" onChange={e => setFormData({...formData, username: e.target.value})} />
              <input placeholder="Senha IPTV" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl" onChange={e => setFormData({...formData, password: e.target.value})} />
              <select className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl" onChange={e => setFormData({...formData, serverId: e.target.value})}>
                <option value="">Selecione o Servidor</option>
                {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl" onChange={e => setFormData({...formData, planId: e.target.value})}>
                <option value="">Selecione o Plano</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button disabled={loading} onClick={handleSaveClient} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase">
                {loading ? "PROCESSANDO..." : "CRIAR AGORA"}
              </button>
              <button onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 font-bold">CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
