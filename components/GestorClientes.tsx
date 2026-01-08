
import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';

interface Props {
  clients: Client[];
  setClients: (clients: Client[]) => void; 
  onSaveClient: (client: Client) => void; // Propriedade obrigatória agora reconhecida pelo TS
  servers: Server[];
  plans: Plan[];
  onRenew: (clientId: string, planId: string, manualDate?: string) => void;
  onDelete: (id: string) => void;
  getClientStatus: (date: string) => 'active' | 'expired' | 'near_expiry';
  addDays: (date: Date, value: number) => string; 
}

const GestorClientes: React.FC<Props> = ({ clients, onSaveClient, servers, plans, onRenew, onDelete, getClientStatus, addDays }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', username: '', password: '', phone: '', serverId: '', planId: '', expirationDate: '' 
  });

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', username: '', password: '', phone: '', serverId: '', planId: '', expirationDate: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ 
      name: client.name, username: client.username, password: client.password || '', phone: client.phone, 
      serverId: client.serverId, planId: client.planId, expirationDate: client.expirationDate 
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.serverId || !formData.planId) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    let exp = formData.expirationDate;
    if (!exp && formData.planId) {
      const plan = plans.find(p => p.id === formData.planId);
      exp = addDays(new Date(), plan?.durationValue || 1);
    }

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : Date.now().toString(),
      name: formData.name,
      username: formData.username,
      password: formData.password,
      phone: formData.phone,
      serverId: formData.serverId,
      planId: formData.planId,
      expirationDate: exp || new Date().toISOString().split('T')[0],
      status: getClientStatus(exp || new Date().toISOString().split('T')[0])
    };

    onSaveClient(clientToSave);
    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Lista de <span className="text-blue-500">Clientes</span> ({clients.length})</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Gerencie seus assinantes e automações</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95">
          + Novo Cliente
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="pesquisar clientes..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-[#141824] border border-gray-800 rounded-2xl py-5 pl-16 pr-6 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 shadow-inner" 
          />
        </div>
      </div>

      <div className="bg-[#141824] rounded-[40px] border border-gray-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-gray-800">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">#</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Usuário</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Nome / WhatsApp</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Servidor</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Vencimento</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredClients.length > 0 ? filteredClients.map((c, index) => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6 text-gray-600 font-mono text-xs">{9900 + index}</td>
                <td className="px-8 py-6">
                   <p className="font-black text-white text-sm italic">{c.username}</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Senha: {c.password}</p>
                </td>
                <td className="px-8 py-6">
                  <div>
                    <p className="font-bold text-sm text-gray-300 uppercase italic">{c.name}</p>
                    <p className="text-[10px] text-gray-500 font-bold">{c.phone}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="bg-blue-600/10 text-blue-500 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-blue-500/10">
                    {servers.find(s => s.id === c.serverId)?.name || 'AVULSO'}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-lg inline-block tracking-widest border ${
                    getClientStatus(c.expirationDate) === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    getClientStatus(c.expirationDate) === 'expired' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>{getClientStatus(c.expirationDate)}</span>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black italic text-gray-200">{new Date(c.expirationDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onRenew(c.id, c.planId)} className="p-3 rounded-xl bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Renovar">🔄</button>
                    <button onClick={() => handleOpenEdit(c)} className="p-3 rounded-xl bg-gray-600/10 text-gray-400 hover:bg-white hover:text-black transition-all shadow-sm" title="Editar">✏️</button>
                    <button onClick={() => onDelete(c.id)} className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Excluir">🗑️</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="py-20 text-center text-gray-700 font-black uppercase text-xs tracking-widest opacity-30 italic">
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#141824] rounded-[40px] border border-gray-800 shadow-3xl overflow-hidden animate-fade-in p-10">
            <h2 className="text-3xl font-black italic text-white mb-10 uppercase tracking-tighter">
              {editingClient ? 'Editar' : 'Novo'} <span className="text-blue-500">Cliente</span>
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome do Cliente" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="5511999999999" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Usuário / Login</label>
                  <input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Ex: login123" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Senha (Opcional)</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Ex: 123456" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Vincular Plano</label>
                  <select value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none appearance-none">
                    <option value="">Selecione o Plano</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} - R${p.price}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Vincular Servidor</label>
                  <select value={formData.serverId} onChange={e => setFormData({ ...formData, serverId: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none appearance-none">
                    <option value="">Selecione o Servidor</option>
                    {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Data de Vencimento</label>
                <input type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
              </div>
              <div className="flex justify-end gap-6 pt-6">
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleSave} className="bg-blue-600 px-12 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700">
                  {editingClient ? 'Salvar Alterações' : 'Criar Cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorClientes;
