
import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';

interface Props {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  servers: Server[];
  plans: Plan[];
  onRenew: (clientId: string, planId: string, manualDate?: string) => void;
  onDelete: (id: string) => void;
  getClientStatus: (date: string) => 'active' | 'expired' | 'near_expiry';
  addDays: (date: Date, value: number) => string; 
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

  const handleSaveClient = () => {
    if (!formData.name || !formData.serverId || !formData.planId) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    if (editingClient) {
      const updatedClients = clients.map(c => {
        if (c.id === editingClient.id) {
          return {
            ...c,
            ...formData,
            status: getClientStatus(formData.expirationDate || c.expirationDate)
          };
        }
        return c;
      });
      setClients(updatedClients);
    } else {
      let exp = formData.expirationDate;
      if (!exp && formData.planId) {
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
        expirationDate: exp || new Date().toISOString().split('T')[0],
        status: getClientStatus(exp || new Date().toISOString().split('T')[0])
      };
      setClients([...clients, newClient]);
    }

    setIsModalOpen(false);
  };

  const handleConfirmRenewal = () => {
    if (!renewingClient) return;
    
    if (renewalData.manualDate) {
      onRenew(renewingClient.id, '', renewalData.manualDate);
    } else if (renewalData.planId) {
      onRenew(renewingClient.id, renewalData.planId);
    } else {
      alert("Selecione um plano ou uma data manual.");
      return;
    }

    setIsRenewalModalOpen(false);
    setRenewingClient(null);
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
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
            className="w-full bg-[#141824] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-sm font-medium focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
          />
        </div>
      </div>

      <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-gray-800">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Cliente</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Login Info</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Plano & Servidor</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Expiração</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredClients.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{c.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-gray-600 font-black uppercase">User:</span>
                       <span className="text-xs font-mono text-gray-300">{c.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-gray-600 font-black uppercase">Pass:</span>
                       <span className="text-xs font-mono text-gray-300">{c.password}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-bold text-gray-300">{plans.find(p => p.id === c.planId)?.name || 'N/A'}</p>
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter mt-1">{servers.find(s => s.id === c.serverId)?.name || 'SEM SERVIDOR'}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-mono text-gray-300">{new Date(c.expirationDate).toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-lg inline-block tracking-widest ${
                    getClientStatus(c.expirationDate) === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    getClientStatus(c.expirationDate) === 'expired' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  }`}>
                    {getClientStatus(c.expirationDate)}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleOpenRenew(c)} className="p-2.5 rounded-xl bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      🔄
                    </button>
                    <button onClick={() => handleOpenEdit(c)} className="p-2.5 rounded-xl bg-gray-600/10 text-gray-400 hover:bg-gray-600 hover:text-white transition-all shadow-sm">
                      ✏️
                    </button>
                    <button onClick={() => onDelete(c.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#141824] rounded-[40px] border border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-white">{editingClient ? 'Editar Cliente' : 'Adicionar cliente'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors text-2xl">×</button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome Completo</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Telefone</label>
                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Usuário</label>
                    <input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Senha</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Plano</label>
                    <select value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold appearance-none outline-none">
                      <option value="">Selecionar Plano</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name} - R${p.price}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Servidor</label>
                    <select value={formData.serverId} onChange={e => setFormData({ ...formData, serverId: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold appearance-none outline-none">
                      <option value="">Selecionar Servidor</option>
                      {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vencimento</label>
                    <input type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="flex justify-end gap-6 pt-6 items-center">
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 font-bold">Cancelar</button>
                  <button onClick={handleSaveClient} className="bg-blue-600 px-10 py-4 rounded-2xl font-black uppercase text-xs">
                    {editingClient ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRenewalModalOpen && renewingClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsRenewalModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[40px] border border-blue-600/30 p-10 space-y-6">
            <h2 className="text-xl font-black text-white text-center uppercase">Renovar {renewingClient.name}</h2>
            <div className="space-y-4">
              <select value={renewalData.planId} onChange={e => setRenewalData({ ...renewalData, planId: e.target.value, manualDate: '' })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold">
                <option value="">Selecione um Plano</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} - R${p.price}</option>)}
              </select>
              <input type="date" value={renewalData.manualDate} onChange={e => setRenewalData({ ...renewalData, manualDate: e.target.value, planId: '' })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold" />
              <button onClick={handleConfirmRenewal} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorClientes;
