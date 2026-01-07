import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';
import { supabase } from '@/lib/supabase';

/* ===============================
   FUNÇÃO EDGE FUNCTION IPTV
================================ */
const criarUsuarioIPTV = async (data: {
  username: string;
  password: string;
  plan: string;
  email?: string;
  nome?: string;
  whatsapp?: string;
}) => {
  const { data: result, error } = await supabase.functions.invoke(
    'create-iptv-user',
    { body: data }
  );

  if (error) {
    console.error('Erro IPTV:', error);
    throw new Error(error.message);
  }

  return result;
};

/* ===============================
   PROPS
================================ */
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

/* ===============================
   COMPONENTE
================================ */
const GestorClientes: React.FC<Props> = ({
  clients,
  setClients,
  servers,
  plans,
  onRenew,
  onDelete,
  getClientStatus,
  addDays,
}) => {
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
    expirationDate: '',
  });

  const [renewalData, setRenewalData] = useState({
    planId: '',
    manualDate: '',
  });

  /* ===============================
     SALVAR CLIENTE
  ================================ */
  const handleSaveClient = async () => {
    if (!formData.name || !formData.serverId || !formData.planId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    // EDITAR CLIENTE (LOCAL)
    if (editingClient) {
      const updated = clients.map(c =>
        c.id === editingClient.id
          ? {
              ...c,
              ...formData,
              status: getClientStatus(
                formData.expirationDate || c.expirationDate
              ),
            }
          : c
      );
      setClients(updated);
      setIsModalOpen(false);
      return;
    }

    // 🔥 CRIAR CLIENTE (IPTV + GESTOR)
    try {
      await criarUsuarioIPTV({
        username: formData.username,
        password: formData.password,
        plan: formData.planId,
        email: formData.email,
        nome: formData.name,
        whatsapp: formData.phone,
      });

      let exp = formData.expirationDate;
      if (!exp) {
        const plan = plans.find(p => p.id === formData.planId);
        exp = addDays(new Date(), plan?.durationValue || 1);
      }

      const newClient: Client = {
        id: Date.now().toString(),
        name: formData.name,
        username: formData.username,
        password: formData.password,
        phone: formData.phone,
        serverId: formData.serverId,
        planId: formData.planId,
        expirationDate: exp!,
        status: getClientStatus(exp!),
      };

      setClients([...clients, newClient]);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Erro ao criar cliente no painel IPTV: ${err.message}`);
    }
  };

  /* ===============================
     FILTRO
  ================================ */
  const filteredClients = clients.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-black text-white">Clientes</h1>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({
              name: '',
              username: '',
              password: '',
              phone: '',
              email: '',
              serverId: '',
              planId: '',
              expirationDate: '',
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 px-6 py-3 rounded-xl font-bold text-white"
        >
          + Adicionar Cliente
        </button>
      </div>

      <input
        className="w-full mb-6 p-4 rounded-xl bg-[#141824] border border-gray-800"
        placeholder="Pesquisar..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      <table className="w-full text-white bg-[#141824] rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-black/40">
            <th className="p-4 text-left">Nome</th>
            <th className="p-4">Usuário</th>
            <th className="p-4">Plano</th>
            <th className="p-4">Expira</th>
            <th className="p-4">Status</th>
            <th className="p-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map(c => (
            <tr key={c.id} className="border-t border-gray-800">
              <td className="p-4">{c.name}</td>
              <td className="p-4">{c.username}</td>
              <td className="p-4">
                {plans.find(p => p.id === c.planId)?.name}
              </td>
              <td className="p-4">
                {new Date(c.expirationDate).toLocaleDateString('pt-BR')}
              </td>
              <td className="p-4">{getClientStatus(c.expirationDate)}</td>
              <td className="p-4 flex gap-2 justify-center">
                <button
                  onClick={() => onDelete(c.id)}
                  className="text-red-500"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-[#141824] p-8 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-black text-white mb-4">
              Novo Cliente
            </h2>

            {['name', 'username', 'password', 'phone'].map(field => (
              <input
                key={field}
                placeholder={field}
                value={(formData as any)[field]}
                onChange={e =>
                  setFormData({ ...formData, [field]: e.target.value })
                }
                className="w-full mb-3 p-3 rounded bg-black/40"
              />
            ))}

            <select
              className="w-full mb-3 p-3 bg-black/40"
              value={formData.planId}
              onChange={e =>
                setFormData({ ...formData, planId: e.target.value })
              }
            >
              <option value="">Plano</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className="w-full mb-6 p-3 bg-black/40"
              value={formData.serverId}
              onChange={e =>
                setFormData({ ...formData, serverId: e.target.value })
              }
            >
              <option value="">Servidor</option>
              {servers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button
                onClick={handleSaveClient}
                className="bg-blue-600 px-6 py-3 rounded-xl font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorClientes;
