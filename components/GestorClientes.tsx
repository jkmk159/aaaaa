import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';

// Configurações da API IPTV (Substitua pela sua chave real)
const IPTV_API_URL = 'https://jordantv.shop/api/create_user.php';
const IPTV_API_KEY = 'SUA_API_KEY_AQUI';

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
        if (!exp && formData.planId) {
          exp = addDays(new Date(), selectedPlan?.months || 1);
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
    const diasParaAdicionar = selectedPlan ? (selectedPlan.months * 30) : 30;

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Clientes</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie seus assinantes de IPTV</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <span className="text-xl">+</span> Adicionar Cliente
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="pesquisar clientes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141824] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-sm text-white outline-none"
          />
        </div>
      </div>

      <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-gray-800">
            <tr>
