import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';

// Configurações da API IPTV (Substitua pela sua chave real)
const IPTV_API_URL = 'https://jordantv.shop/api/create_user.php';
const IPTV_API_KEY = '0d05ae3a98bceef41e468d7a0bbc3e9147c4082c2eabea5d9e0c596a1240ac07';

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
  
  const [formData, setFormData] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    phone: '', 
    email: '', 
    serverId: '', 
    planId: '', 
    expirationDate: '' 
  });

  const [renewalData, setRenewalData] = useState({
    planId: '',
    manualDate: ''
  });

  // FUNÇÃO AUXILIAR PARA CALCULAR DIAS TOTAIS DO PLANO (Compatível com GestorPlanos)
  const getPlanDays = (plan: Plan): number => {
    if (plan.durationUnit === 'days') {
      return plan.durationValue || 0;
    }
    // Se for meses (ou se usar a propriedade antiga .months), converte para dias
    const months = plan.durationValue || plan.months || 0;
    return months * 30;
  };

  const callIptvApi = async (body: any) => {
    try {
      const response = await fetch(IPTV_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${IPTV_API_KEY}`
        },
        body: JSON.stringify(body)
      });
      return await response.json();
    } catch (error) {
      console.error("Erro na API:", error);
      return { success: false, message: "Erro de conexão com o servidor IPTV." };
    }
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', username: '', password: '', phone: '', email: '', serverId: '', planId: '', expirationDate: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ 
      name: client.name, 
      username: client.username, 
      password: client.password || '', 
      phone: client.phone, 
      email: '', 
      serverId: client.serverId, 
      planId: client.planId, 
      expirationDate: client.expirationDate 
    });
    setIsModalOpen(true);
  };

  const handleOpenRenew = (client: Client) => {
    setRenewingClient(client);
    setRenewalData({ planId: client.planId, manualDate: '' });
    setIsRenewalModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!formData.name || !formData.serverId || !formData.planId || !formData.username || !formData.password) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    const selectedPlan = plans.find(p => p.id === formData.planId);

    if (editingClient) {
      const updatedClients = clients.map(c => {
        if (c.id === editingClient.id) {
          return { ...c, ...formData, status: getClientStatus(formData.expirationDate || c.expirationDate) };
        }
        return c;
      });
      setClients(updatedClients);
      setIsModalOpen(false);
    } else {
      const apiResult = await callIptvApi({
        action: "create",
        username: formData.username,
        password: formData.password,
        plan: selectedPlan?.name.toLowerCase() || "starter",
        email: formData.email,
        nome: formData.name
      });

      if (apiResult.success) {
        let exp = formData.expirationDate;
        if (!exp && selectedPlan) {
          // Usa a lógica de meses para a função addDays (fallback de 1 mês)
          const monthsToAdd = selectedPlan.durationUnit === 'months' 
            ? (selectedPlan.durationValue || selectedPlan.months || 1)
            : (selectedPlan.durationValue || 30) / 30;
          
          exp = addDays(new Date(), monthsToAdd);
        }

        const newClient: Client = {
          id: apiResult.data?.cliente_id?.toString() || Date.now().toString(),
          name: formData.name,
          username: formData.username,
          password: formData.password,
          phone: formData.phone,
          serverId: formData.serverId,
          planId: formData.planId,
          expirationDate: exp || new Date().toISOString().split('T')[0],
          status: getClientStatus(exp || new Date().toISOString().split('T')[0])
        };
        setClients([...clients, newClient]);
        setIsModalOpen(false);
        alert("Cliente criado no painel!");
      } else {
        alert("Erro no Painel IPTV: " + apiResult.message);
      }
    }
  };

  const handleConfirmRenewal = async () => {
    if (!renewingClient) return;

    const selectedPlan = plans.find(p => p.id === renewalData.planId);
    
    // CORREÇÃO TS18048: Calculando os dias de forma segura
    const diasParaAdicionar = selectedPlan ? getPlanDays(selectedPlan) : 30;

    const apiResult = await callIptvApi({
      action: "renew",
      username: renewingClient.username,
      dias: diasParaAdicionar
    });

    if (apiResult.success) {
      if (renewalData.manualDate) {
        onRenew(renewingClient.id, '', renewalData.manualDate);
      } else if (renewalData.planId) {
        onRenew(renewingClient.id, renewalData.planId);
      }
      setIsRenewalModalOpen(false);
      setRenewingClient(null);
      alert("Renovado com sucesso!");
    } else {
      alert("Erro ao renovar: " + apiResult.message);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 animate-fade-in max-w-[1400px] mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Gestão de <span className="text-blue-500">Clientes</span></h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Painel de controle de acessos</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          <span className="text-xl">+</span> Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="mb-6 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input 
          type="text" 
          placeholder="Buscar por nome ou usuário..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#141824] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all"
        />
      </div>

      {/* Tabela */}
      <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-gray-800">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500">Cliente</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500">Credenciais</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500">Plano</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500">Expiração</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 text-center">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredClients.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{c.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-xs">
                    <p className="text-gray-400 font-mono">U: {c.username}</p>
                    <p className="text-gray-500 font-mono">P: {c.password}</p>
                  </div>
                </td>
                <td className="px-8 py-6 text-xs font-bold text-gray-300">
                  {plans.find(p => p.id === c.planId)?.name || 'N/A'}
                </td>
                <td className="px-8 py-6 text-sm font-mono text-gray-300">
                  {new Date(c.expirationDate).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md border ${
                    getClientStatus(c.expirationDate) === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    getClientStatus(c.expirationDate) === 'expired' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {getClientStatus(c.expirationDate)}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenRenew(c)} className="p-2 rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all">🔄</button>
                    <button onClick={() => handleOpenEdit(c)} className="p-2 rounded-lg bg-gray-600/10 text-gray-400 hover:bg-gray-600 hover:text-white transition-all">✏️</button>
                    <button onClick={() => onDelete(c.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CRIAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-[#141824] rounded-[32px] border border-gray-800 p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic">
              {editingClient ? 'Editar Cliente' : 'Novo Cadastro IPTV'}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input placeholder="Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-black/40 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
              <input placeholder="WhatsApp" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-black/40 border border-gray-700 rounded-xl p-3 text-white outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input placeholder="Usuário" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="bg-black/40 border border-gray-700 rounded-xl p-3 text-white outline-none" />
              <input placeholder="Senha" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="bg-black/40 border border-gray-700 rounded-xl p-3 text-white outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <select value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })} className="bg-black/40 border border-gray-700 rounded-xl p-3 text-white outline-none">
                <option value="">Plano</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={formData.serverId} onChange={e => setFormData({ ...formData, serverId: e.target.value })} className="bg-black/40 border border-gray-700 rounded-xl p-3 text-white outline-none">
                <option value="">Servidor</option>
                {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 font-bold uppercase text-xs">Sair</button>
              <button onClick={handleSaveClient} className="bg-blue-600 px-8 py-3 rounded-xl font-black text-white uppercase text-xs">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RENOVAÇÃO */}
      {isRenewalModalOpen && renewingClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsRenewalModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-[#141824] rounded-[32px] border border-blue-600/30 p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white uppercase italic text-center mb-6">Renovação Direta</h2>
            <div className="space-y-4">
              <select 
                value={renewalData.planId} 
                onChange={e => setRenewalData({ ...renewalData, planId: e.target.value })} 
                className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-white outline-none focus:border-blue-500"
              >
                <option value="">Selecione o Plano</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleConfirmRenewal} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-600/20">Ativar Renovação</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorClientes;
