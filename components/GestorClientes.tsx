import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';

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
  const [renewingClient, setRenewingClient] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', phone: '', planId: '', serverId: '' });
  const [renewalData, setRenewalData] = useState({ planId: '' });

  const callIptvApi = async (data: any) => {
    try {
      const response = await fetch(IPTV_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', 
          'Authorization': `Bearer ${IPTV_API_KEY.trim()}`
        },
        body: JSON.stringify({
          ...data,
          api_key: IPTV_API_KEY.trim() 
        })
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("Erro na chamada API:", error);
      return { success: false, message: "Erro de conexão ou usuário inexistente." };
    }
  };

  const handleSendWhatsApp = (client: any) => {
    const texto = `*DADOS DE ACESSO IPTV*%0A%0A*Usuário:* ${client.username}%0A*Senha:* ${client.password}%0A*Vencimento:* ${client.expirationDate}%0A*Link M3U:* ${client.m3u || 'Solicite ao suporte'}`;
    const cleanPhone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${texto}`, '_blank');
  };

  const handleSaveClient = async () => {
    if (!formData.name || !formData.username || !formData.password) {
      alert("Preencha Nome, Usuário e Senha!");
      return;
    }

    const selectedPlan = plans.find(p => p.id === formData.planId);
    
    const payload = {
      action: "create",
      username: formData.username,
      password: formData.password,
      plan: selectedPlan?.name.toLowerCase().includes('pro') ? 'professional' : 'starter',
      nome: formData.name,
      whatsapp: formData.phone
    };

    const result = await callIptvApi(payload);

    if (result && result.success) {
      const safeId = result.data?.id ? result.data.id.toString() : Date.now().toString();
      const safeExp = result.data?.data_vencimento || new Date().toISOString().split('T')[0];

      const newClient = {
        ...formData,
        id: safeId,
        expirationDate: safeExp,
        m3u: result.data?.credenciais?.url_m3u || "", 
        status: getClientStatus(safeExp)
      } as any;

      setClients([...clients, newClient]);
      setIsModalOpen(false);
      alert("Sucesso: Cliente criado no painel!");
    } else {
      alert("Aviso do Painel: " + (result?.message || "Erro desconhecido"));
    }
  };

  const handleConfirmRenewal = async () => {
    if (!renewingClient) return;
    const selectedPlan = plans.find(p => p.id === renewalData.planId);
    const diasPlan = selectedPlan?.durationValue || 30;

    const payload = {
      action: "renew",
      username: renewingClient.username,
      dias: diasPlan
    };

    const result = await callIptvApi(payload);

    if (result && result.success) {
      const novaData = result.data?.nova_data_vencimento || "";
      onRenew(renewingClient.id, renewalData.planId, novaData);
      setIsRenewalModalOpen(false);
      alert("Sucesso: Usuário renovado!");
    } else {
      alert("Falha na Renovação: " + (result?.message || "Verifique se o usuário existe no painel."));
    }
  };

  return (
    <div className="p-8 text-white max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">
          Gestão <span className="text-blue-500">CloudServe</span>
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-bold transition-all">
          + NOVO CLIENTE
        </button>
      </div>

      <div className="bg-[#141824] rounded-[24px] border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/40 text-gray-400 text-[10px] font-black uppercase">
            <tr>
              <th className="p-5">Cliente / Acesso</th>
              <th className="p-5">Vencimento</th>
              <th className="p-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {clients.map((c: any) => (
              <tr key={c.id} className="hover:bg-white/[0.02]">
                <td className="p-5">
                  <div className="font-bold text-sm">{c.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono">U: {c.username}</div>
                </td>
                <td className="p-5 font-mono text-xs text-gray-300">{c.expirationDate}</td>
                <td className="p-5 text-right flex justify-end gap-2">
                  <button onClick={() => handleSendWhatsApp(c)} className="p-2 bg-green-600/10 text-green-500 rounded-lg hover:bg-green-600 hover:text-white">📱</button>
                  <button onClick={() => { setRenewingClient(c); setIsRenewalModalOpen(true); }} className="p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white">🔄</button>
                  <button onClick={() => onDelete(c.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800 w-full max-w-md">
            <h2 className="text-xl font-black mb-6 italic uppercase text-white">Novo Acesso</h2>
            <div className="space-y-4">
              <input placeholder="Nome" className="w-full bg-black/40 border border-gray-700 p-3 rounded-xl outline-none text-white" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="WhatsApp" className="w-full bg-black/40 border border-gray-700 p-3 rounded-xl outline-none text-white" onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input placeholder="Usuário" className="w-full bg-black/40 border border-gray-700 p-3 rounded-xl outline-none text-white" onChange={e => setFormData({...formData, username: e.target.value})} />
              <input placeholder="Senha" className="w-full bg-black/40 border border-gray-700 p-3 rounded-xl outline-none text-white" onChange={e => setFormData({...formData, password: e.target.value})} />
              <select className="w-full bg-black/40 border border-gray-700 p-3 rounded-xl outline-none text-white" onChange={e => setFormData({...formData, planId: e.target.value})}>
                <option value="">Selecione o Plano</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleSaveClient} className="w-full bg-blue-600 py-4 rounded-2xl font-black mt-4 uppercase text-xs">Criar no Painel</button>
              <button onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 font-bold text-xs mt-2 uppercase">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {isRenewalModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800 w-full max-w-sm text-center">
            <h2 className="text-xl font-black mb-6 italic text-white uppercase">Renovar</h2>
            <select className="w-full bg-black/40 border border-gray-700 p-4 rounded-2xl mb-6 text-white text-center" onChange={e => setRenewalData({planId: e.target.value})}>
              <option value="">Escolha o Plano</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={handleConfirmRenewal} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs">Confirmar</button>
            <button onClick={() => setIsRenewalModalOpen(false)} className="w-full text-gray-500 font-bold text-xs mt-6 uppercase">Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorClientes;
