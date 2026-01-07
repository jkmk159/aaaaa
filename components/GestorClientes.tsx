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

  // Função de chamada seguindo estritamente a documentação (image_98bd64.png)
 const callIptvApi = async (data: any) => {
  try {
    const response = await fetch(IPTV_API_URL, {
      method: 'POST',
      // Removendo headers extras que podem causar bloqueio de CORS pré-flight
      headers: {
        'Content-Type': 'text/plain', // Técnica para evitar pre-flight CORS em alguns servidores
        'Authorization': `Bearer ${IPTV_API_KEY.trim()}`
      },
      // Enviando como string pura para o PHP processar
      body: JSON.stringify({
        ...data,
        api_key: IPTV_API_KEY.trim() // Reforço: enviando a chave também dentro do corpo
      })
    });

    // Se o servidor retornar erro, vamos ler o que ele diz
    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.message || `Erro HTTP: ${response.status}`);
    }

    return result;
  } catch (error: any) {
    console.error("Detalhes do erro:", error);
    // Se ainda der 404, o problema é bloqueio de domínio (CORS)
    return { success: false, message: "O servidor bloqueou a requisição (CORS) ou dados inválidos." };
  }
};

  const handleSendWhatsApp = (client: any) => {
    const texto = `*DADOS DE ACESSO IPTV*%0A%0A*Usuário:* ${client.username}%0A*Senha:* ${client.password}%0A*Vencimento:* ${client.expirationDate}%0A*Link M3U:* ${client.m3u || 'Solicite ao suporte'}`;
    window.open(`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${texto}`, '_blank');
  };

  const handleSaveClient = async () => {
    const selectedPlan = plans.find(p => p.id === formData.planId);
    
    // Conforme imagem image_98bd7c.png
    const payload = {
      action: "create",
      username: formData.username,
      password: formData.password,
      plan: selectedPlan?.name.toLowerCase().includes('pro') ? 'professional' : 'starter',
      nome: formData.name,
      whatsapp: formData.phone
    };

    const result = await callIptvApi(payload);

    if (result.success) {
      const newClient = {
        ...formData,
        id: result.data.id.toString(),
        expirationDate: result.data.data_vencimento,
        m3u: result.data.credenciais?.url_m3u || "", // Captura o link M3U da imagem image_98bd7e.png
        status: getClientStatus(result.data.data_vencimento)
      } as any;
      setClients([...clients, newClient]);
      setIsModalOpen(false);
      alert("Cliente criado!");
    } else {
      alert("Erro: " + result.message);
    }
  };

  const handleConfirmRenewal = async () => {
    if (!renewingClient) return;
    const selectedPlan = plans.find(p => p.id === renewalData.planId);
    
    // Conforme imagem image_98bd81.png
    const payload = {
      action: "renew",
      username: renewingClient.username,
      dias: 30 // Valor padrão ou baseado no plano
    };

    const result = await callIptvApi(payload);

    if (result.success) {
      onRenew(renewingClient.id, renewalData.planId, result.data.nova_data_vencimento);
      setIsRenewalModalOpen(false);
      alert("Renovado com sucesso!");
    } else {
      // Trata o erro de "Usuário não encontrado" da sua imagem a34204.png
      alert("Erro ao renovar: " + result.message);
    }
  };

  return (
    <div className="p-8 text-white">
      <div className="flex justify-between mb-8">
        <h1 className="text-2xl font-bold italic uppercase">Gestão <span className="text-blue-500">CloudServe</span></h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-6 py-2 rounded-lg font-bold">+ NOVO CLIENTE</button>
      </div>

      <div className="bg-[#141824] rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-gray-400 text-xs uppercase">
            <tr>
              <th className="p-4">Cliente / Acesso</th>
              <th className="p-4">Vencimento</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any) => (
              <tr key={c.id} className="border-t border-gray-800">
                <td className="p-4">
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-gray-500 font-mono">U: {c.username} | P: {c.password}</div>
                </td>
                <td className="p-4 font-mono text-sm">{c.expirationDate}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleSendWhatsApp(c)} className="p-2 bg-green-600/10 text-green-500 rounded-md">📱</button>
                  <button onClick={() => { setRenewingClient(c); setIsRenewalModalOpen(true); }} className="p-2 bg-blue-600/10 text-blue-500 rounded-md">🔄</button>
                  <button onClick={() => onDelete(c.id)} className="p-2 bg-red-600/10 text-red-500 rounded-md">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modais simplificados para teste */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141824] p-6 rounded-2xl border border-gray-800 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">CADASTRAR ACESSO</h2>
            <div className="space-y-3">
              <input placeholder="Nome" className="w-full bg-black/40 border border-gray-700 p-2 rounded" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="WhatsApp" className="w-full bg-black/40 border border-gray-700 p-2 rounded" onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input placeholder="Usuário" className="w-full bg-black/40 border border-gray-700 p-2 rounded" onChange={e => setFormData({...formData, username: e.target.value})} />
              <input placeholder="Senha" className="w-full bg-black/40 border border-gray-700 p-2 rounded" onChange={e => setFormData({...formData, password: e.target.value})} />
              <select className="w-full bg-black/40 border border-gray-700 p-2 rounded" onChange={e => setFormData({...formData, planId: e.target.value})}>
                <option value="">Selecione o Plano</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleSaveClient} className="w-full bg-blue-600 py-3 rounded-xl font-bold mt-4">CRIAR NO PAINEL</button>
              <button onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 text-sm">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {isRenewalModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141824] p-6 rounded-2xl border border-gray-800 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4 italic">RENOVAR ACESSO</h2>
            <select className="w-full bg-black/40 border border-gray-700 p-3 rounded-xl mb-6" onChange={e => setRenewalData({planId: e.target.value})}>
              <option value="">Selecione o Plano</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={handleConfirmRenewal} className="w-full bg-blue-600 py-3 rounded-xl font-bold">CONFIRMAR RENOVAÇÃO</button>
            <button onClick={() => setIsRenewalModalOpen(false)} className="w-full text-gray-500 text-sm mt-4">SAIR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorClientes;
