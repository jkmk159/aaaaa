import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';
import { createRemoteIptvUser, renewRemoteIptvUser } from '../services/iptvService'; // Certifique-se que o caminho está correto

interface Props {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  servers: Server[];
  plans: Plan[];
  onRenew: (clientId: string, planId: string, manualDate?: string) => void;
  onDelete: (id: string) => void;
  getClientStatus: (date: string) => 'active' | 'expired' | 'near_expiry';
  addDays: (date: Date, months: number) => string;
}

const GestorClientes: React.FC<Props> = ({ clients, setClients, servers, plans, onRenew, onDelete, getClientStatus, addDays }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [renewingClient, setRenewingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', username: '', password: '', phone: '', serverId: '', planId: '', expirationDate: '' 
  });

  const [renewalData, setRenewalData] = useState({ planId: '', manualDate: '' });

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', username: '', password: '', phone: '', serverId: '', planId: '', expirationDate: '' });
    setIsModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!formData.name || !formData.serverId || !formData.planId || !formData.username || !formData.password) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    try {
      if (editingClient) {
        // Lógica de edição local (Opcional: implementar update na API se o painel suportar)
        const updatedClients = clients.map(c => c.id === editingClient.id ? { ...c, ...formData } : c);
        setClients(updatedClients);
        setIsModalOpen(false);
      } else {
        // CRIAÇÃO REAL VIA EDGE FUNCTION
        const selectedPlan = plans.find(p => p.id === formData.planId);
        const planName = selectedPlan?.name.toLowerCase().includes('pro') ? 'professional' : 'starter';

        const result = await createRemoteIptvUser(formData.serverId, {
          username: formData.username,
          password: formData.password,
          plan: planName,
          nome: formData.name,
          whatsapp: formData.phone
        });

        if (result.success) {
          const apiData = result.data;
          const newClient: Client = {
            id: apiData?.id?.toString() || Date.now().toString(),
            name: formData.name,
            username: formData.username,
            password: formData.password,
            phone: formData.phone,
            serverId: formData.serverId,
            planId: formData.planId,
            expirationDate: apiData?.data_vencimento || new Date().toISOString(),
            url_m3u: apiData?.credenciais?.url_m3u || "",
            status: getClientStatus(apiData?.data_vencimento || new Date().toISOString())
          };
          setClients([...clients, newClient]);
          setIsModalOpen(false);
          alert("Cliente criado e ativado no painel!");
        } else {
          alert("Erro no Painel: " + result.message);
        }
      }
    } catch (error) {
      alert("Erro ao processar requisição.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRenewal = async () => {
    if (!renewingClient) return;
    
    setIsLoading(true);
    try {
      const selectedPlan = plans.find(p => p.id === renewalData.planId);
      const dias = selectedPlan?.durationValue || 30;

      const result = await renewRemoteIptvUser(renewingClient.serverId, renewingClient.username, dias);

      if (result.success) {
        const novaData = result.data?.nova_data_vencimento;
        
        // Atualiza localmente para refletir na tabela na hora
        const updated = clients.map(c => 
          c.id === renewingClient.id ? { ...c, expirationDate: novaData, status: getClientStatus(novaData) } : c
        );
        setClients(updated);
        
        // Sincroniza com o componente pai (Supabase DB)
        onRenew(renewingClient.id, renewalData.planId, novaData);
        
        setIsRenewalModalOpen(false);
        alert("Assinatura renovada com sucesso!");
      } else {
        alert("Erro na renovação: " + result.message);
      }
    } catch (error) {
      alert("Erro técnico ao renovar.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 animate-fade-in max-w-[1400px] mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Clientes <span className="text-blue-500">Cloud</span></h1>
        </div>
        <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20">
          + NOVO ACESSO
        </button>
      </div>

      {/* BUSCA */}
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou usuário..." 
          className="w-full bg-[#141824] border border-gray-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABELA */}
      <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-[10px] font-black uppercase text-gray-500">
            <tr>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-8 py-5">Acesso</th>
              <th className="px-8 py-5">Vencimento</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredClients.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02]">
                <td className="px-8 py-6">
                  <p className="font-bold text-white">{c.name}</p>
                  <p className="text-[10px] text-gray-500">{c.phone}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-mono text-blue-400">{c.username}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-mono text-gray-300">
                    {c.expirationDate ? new Date(c.expirationDate).toLocaleDateString('pt-BR') : '---'}
                  </p>
                </td>
                <td className="px-8 py-6 text-right flex justify-end gap-2">
                  <button onClick={() => { setRenewingClient(c); setIsRenewalModalOpen(true); }} className="p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all">🔄</button>
                  <button onClick={() => onDelete(c.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CRIAR (Resumido para o exemplo) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 uppercase">Cadastrar no Painel</h2>
            <div className="space-y-4">
              <input placeholder="Nome" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="WhatsApp" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white" onChange={e => setFormData({...formData, phone: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Usuário" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white" onChange={e => setFormData({...formData, username: e.target.value})} />
                <input placeholder="Senha" type="password" className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white" onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <select className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white" onChange={e => setFormData({...formData, planId: e.target.value})}>
                <option value="">Plano</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl text-white" onChange={e => setFormData({...formData, serverId: e.target.value})}>
                <option value="">Servidor</option>
                {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button 
                onClick={handleSaveClient} 
                disabled={isLoading}
                className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest mt-4 disabled:opacity-50"
              >
                {isLoading ? 'PROCESSANDO...' : 'ATIVAR AGORA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RENOVAR */}
      {isRenewalModalOpen && renewingClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#141824] p-10 rounded-[40px] border border-blue-600/30 w-full max-w-sm text-center shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 uppercase italic">Renovar Acesso</h2>
            <p className="text-gray-500 text-xs mb-6 uppercase font-bold">{renewingClient.username}</p>
            <select className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl mb-6 text-white text-center" onChange={e => setRenewalData({ ...renewalData, planId: e.target.value })}>
              <option value="">Escolha o Plano</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button 
              onClick={handleConfirmRenewal} 
              disabled={isLoading}
              className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {isLoading ? 'RENOVANDO...' : 'CONFIRMAR RENOVAÇÃO'}
            </button>
            <button onClick={() => setIsRenewalModalOpen(false)} className="mt-4 text-gray-500 text-[10px] uppercase font-bold">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorClientes;
