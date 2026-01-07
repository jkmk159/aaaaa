
import React, { useState } from 'react';
import { Client, Plan } from '../types';

interface GestorClientesProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  servers: any[]; 
  plans: Plan[];
  onRenew: (clientId: string, planId: string, manualDate?: string) => void;
  onDelete: (id: string) => void;
  getClientStatus: (date: string) => 'active' | 'expired' | 'near_expiry';
  addDays: (date: Date, value: number, unit: 'months' | 'days') => string;
}

export default function GestorClientes({ clients, setClients, plans, onRenew, onDelete, getClientStatus, addDays }: GestorClientesProps) {
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
    planId: '', 
    expirationDate: '' 
  });

  const [renewalData, setRenewalData] = useState({
    planId: '',
    manualDate: ''
  });

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', username: '', password: '', phone: '', planId: plans[0]?.id || '', expirationDate: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ 
      name: client.name, 
      username: client.username, 
      password: client.password || '', 
      phone: client.phone, 
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
    if (!formData.name || !formData.planId || !formData.username || !formData.password) {
      alert("Por favor, preencha todos os campos obrigatórios.");
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
        if (plan) {
          // Passando os 3 argumentos exigidos pela interface
          exp = addDays(new Date(), plan.durationValue, plan.durationUnit);
        }
      }

      const newClient: Client = {
        id: `temp-${Date.now()}`,
        name: formData.name,
        username: formData.username,
        password: formData.password,
        phone: formData.phone,
        serverId: 'fixed-panel',
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
    
    // Passando os 3 argumentos conforme esperado pelo App.tsx e pela Props interface
    onRenew(renewingClient.id, renewalData.planId, renewalData.manualDate);

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
          <h1 className="text-4xl font-black tracking-tight text-white italic">Clientes</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Gerencie seus assinantes (Painel Integrado)</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs italic tracking-widest flex items-center gap-2 shadow-xl shadow-blue-600/20"
        >
          <span className="text-xl">+</span> Adicionar Cliente
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-xl">🔍</span>
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141824] border border-gray-800 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
          />
        </div>
      </div>

      <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-black/20 border-b border-gray-800">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Acesso</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Plano</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Expiração</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredClients.map(client => {
                const status = getClientStatus(client.expirationDate);
                const plan = plans.find(p => p.id === client.planId);
                
                return (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center text-xs font-black italic">
                          {client.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{client.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{client.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest"><span className="text-blue-500/50">U:</span> {client.username}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest"><span className="text-blue-500/50">P:</span> {client.password}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                        {plan?.name || 'Manual'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs font-mono font-bold text-gray-300">
                      {new Date(client.expirationDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenRenew(client)} className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all">🔄</button>
                        <button onClick={() => handleOpenEdit(client)} className="p-2.5 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 hover:text-white transition-all">✏️</button>
                        <button onClick={() => onDelete(client.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141824] w-full max-w-xl rounded-[40px] border border-gray-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-black/20">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">
                {editingClient ? 'Editar' : 'Novo'} <span className="text-blue-500">Cliente</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-2xl font-black">×</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="João Silva" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="5511999999999" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Usuário</label>
                  <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha</label>
                  <input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Plano</label>
                  <select value={formData.planId} onChange={e => setFormData({...formData, planId: e.target.value})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none appearance-none">
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Expiração</label>
                  <input type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
            <div className="p-8 bg-black/20 border-t border-gray-800">
              <button onClick={handleSaveClient} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm shadow-xl active:scale-95 transition-all">
                {editingClient ? 'Salvar Alterações' : 'Criar e Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRenewalModalOpen && renewingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141824] w-full max-w-md rounded-[40px] border border-gray-800 p-10 text-center space-y-8 shadow-2xl">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Renovar <span className="text-blue-500">{renewingClient.name}</span></h3>
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Novo Plano</label>
                <select value={renewalData.planId} onChange={e => setRenewalData({...renewalData, planId: e.target.value, manualDate: ''})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500">
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data Manual</label>
                <input type="date" value={renewalData.manualDate} onChange={e => setRenewalData({...renewalData, manualDate: e.target.value, planId: ''})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsRenewalModalOpen(false)} className="flex-1 py-4 text-gray-500 font-black uppercase tracking-widest text-[10px]">Cancelar</button>
              <button onClick={handleConfirmRenewal} className="flex-1 bg-blue-600 py-4 rounded-2xl text-white font-black uppercase text-xs italic tracking-widest">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
