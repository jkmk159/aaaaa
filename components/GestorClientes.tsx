
import React, { useState } from 'react';
import { Client, Plan } from '../types';

interface Props {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  servers: any[]; // Não utilizado agora, mas mantido para compatibilidade de tipos
  plans: Plan[];
  onRenew: (clientId: string, planId: string, manualDate?: string) => void;
  onDelete: (id: string) => void;
  getClientStatus: (date: string) => 'active' | 'expired' | 'near_expiry';
  addDays: (date: Date, value: number, unit: 'months' | 'days') => string;
}

const GestorClientes: React.FC<Props> = ({ clients, setClients, plans, onRenew, onDelete, getClientStatus, addDays }) => {
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
      alert("Por favor, preencha nome, usuário, senha e selecione um plano.");
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
          exp = addDays(new Date(), plan.durationValue, plan.durationUnit);
        }
      }

      const newClient: Client = {
        id: Date.now().toString(),
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
          <h1 className="text-4xl font-black tracking-tight text-white italic">Clientes</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Gerencie seus assinantes de IPTV (Painel Integrado)</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs italic tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <span className="text-xl">+</span> Adicionar Cliente
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-xl">🔍</span>
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou usuário..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141824] border border-gray-800 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-gray-700 shadow-inner"
          />
        </div>
      </div>

      <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-black/20 border-b border-gray-800">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Acesso (Login/Pass)</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Plano Atual</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Expiração</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
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
                    <td className="px-8 py-6">
                      <p className="text-xs font-mono font-bold text-gray-300">
                        {new Date(client.expirationDate).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        status === 'near_expiry' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {status === 'active' ? 'Ativo' : status === 'near_expiry' ? 'Vencendo' : 'Expirado'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenRenew(client)} className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Renovar">🔄</button>
                        <button onClick={() => handleOpenEdit(client)} className="p-2.5 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 hover:text-white transition-all" title="Editar">✏️</button>
                        <button onClick={() => onDelete(client.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Excluir">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredClients.length === 0 && (
          <div className="py-32 text-center opacity-20">
            <span className="text-7xl block mb-6">👥</span>
            <p className="text-lg font-black uppercase italic tracking-tighter">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141824] w-full max-w-xl rounded-[40px] border border-gray-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-black/20">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">
                {editingClient ? 'Editar' : 'Novo'} <span className="text-blue-500">Cliente</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-2xl font-black">×</button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: João Silva" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="5511999999999" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Usuário IPTV</label>
                  <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="login_do_cliente" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha IPTV</label>
                  <input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="senha_do_cliente" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Plano Base</label>
                  <select value={formData.planId} onChange={e => setFormData({...formData, planId: e.target.value})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold appearance-none outline-none focus:border-blue-500">
                    <option value="">Selecione um plano</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.price})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data de Expiração (Opcional)</label>
                  <input type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="p-8 bg-black/20 border-t border-gray-800">
              <button onClick={handleSaveClient} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm shadow-xl shadow-blue-600/20 active:scale-95">
                {editingClient ? 'Salvar Alterações' : 'Criar Usuário no Painel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renovação */}
      {isRenewalModalOpen && renewingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141824] w-full max-w-md rounded-[40px] border border-gray-800 shadow-2xl overflow-hidden p-10 text-center space-y-8">
            <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">🔄</div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Renovar <span className="text-blue-500">{renewingClient.name}</span></h3>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">A renovação será processada automaticamente no painel IPTV.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Selecione o Plano</label>
                <select 
                  value={renewalData.planId} 
                  onChange={e => setRenewalData({...renewalData, planId: e.target.value, manualDate: ''})} 
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500"
                >
                  <option value="">Plano Atual ({plans.find(p => p.id === renewingClient.planId)?.name})</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} (+{p.durationValue} {p.durationUnit === 'months' ? 'meses' : 'dias'})</option>)}
                </select>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                <div className="relative flex justify-center text-[8px] font-black uppercase text-gray-600 tracking-[0.4em]"><span className="bg-[#141824] px-4">OU DATA MANUAL</span></div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nova Data de Expiração</label>
                <input 
                  type="date" 
                  value={renewalData.manualDate} 
                  onChange={e => setRenewalData({...renewalData, manualDate: e.target.value, planId: ''})} 
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500" 
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsRenewalModalOpen(false)} className="flex-1 py-4 text-gray-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleConfirmRenewal} className="flex-1 bg-blue-600 py-4 rounded-2xl text-white font-black uppercase text-xs italic tracking-widest shadow-xl shadow-blue-600/20 active:scale-95">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorClientes;
