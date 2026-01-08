
import React, { useState } from 'react';
import { Client, Server, Plan } from '../types';

interface Props {
  clients: Client[];
  setClients: (clients: Client[]) => void; 
  onSaveClient: (client: Client) => void;
  servers: Server[];
  plans: Plan[];
  onRenew: (clientId: string, planId: string, manualDate?: string) => void;
  onDelete: (id: string) => void;
  getClientStatus: (date: string) => 'active' | 'expired' | 'near_expiry';
  addDays: (date: Date, value: number) => string; 
}

const GestorClientes: React.FC<Props> = ({ clients, onSaveClient, servers, plans, onRenew, onDelete, getClientStatus, addDays }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [renewingClient, setRenewingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', username: '', password: '', phone: '', serverId: '', planId: '', expirationDate: '' 
  });

  const [renewFormData, setRenewFormData] = useState({
    planId: '',
    manualDate: ''
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

  const handleOpenRenew = (client: Client) => {
    setRenewingClient(client);
    setRenewFormData({
      planId: client.planId,
      manualDate: ''
    });
    setIsRenewModalOpen(true);
  };

  const handleConfirmRenew = () => {
    if (!renewingClient || !renewFormData.planId) {
      alert("Selecione um plano para renovar.");
      return;
    }
    onRenew(renewingClient.id, renewFormData.planId, renewFormData.manualDate || undefined);
    setIsRenewModalOpen(false);
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

  const generateManualM3uLink = (client: Client) => {
    const server = servers.find(s => s.id === client.serverId);
    if (!server) return "";
    
    try {
      // Tenta extrair apenas o domínio/host da URL do servidor cadastrado
      const urlObj = new URL(server.url);
      const host = urlObj.hostname;
      // Constrói o link com as credenciais MANUAIS digitadas no formulário
      return `http://${host}/get.php?username=${client.username}&password=${client.password}&type=m3u_plus&output=ts`;
    } catch (e) {
      // Fallback caso a URL do servidor não seja válida
      return `http://jordantv.shop/get.php?username=${client.username}&password=${client.password}&type=m3u_plus&output=ts`;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) {
      alert("Nenhuma informação disponível para copiar.");
      return;
    }
    navigator.clipboard.writeText(text);
    alert(`${label} copiado com sucesso!`);
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}, tudo bem? Estou entrando em contato sobre a sua assinatura.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">
            Lista de <span className="text-blue-500">Clientes</span> ({clients.length})
          </h1>
          <p className="text-gray-500 font-medium mt-2 uppercase text-[10px] tracking-[0.3em]">
            Gestão inteligente de assinantes e renovações
          </p>
        </div>
        <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3">
          <span className="text-lg">⊕</span> NOVO CLIENTE
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="Pesquise por nome, usuário ou telefone..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-[#141824] border border-gray-800 rounded-2xl py-5 pl-16 pr-6 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 shadow-inner" 
          />
        </div>
      </div>

      <div className="bg-[#141824] rounded-[40px] border border-gray-800 overflow-x-auto shadow-2xl custom-scrollbar">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-black/20 border-b border-gray-800">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">ID</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Informações de Login</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Nome / WhatsApp</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Vencimento</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Painel de Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredClients.length > 0 ? filteredClients.map((c, index) => (
              <tr key={c.id} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-8 py-6 text-gray-600 font-mono text-[10px]">{9900 + index}</td>
                <td className="px-8 py-6">
                   <p className="font-black text-white text-sm italic tracking-tight">{c.username}</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Senha: {c.password}</p>
                </td>
                <td className="px-8 py-6">
                  <div>
                    <p className="font-bold text-sm text-gray-300 uppercase italic tracking-tighter">{c.name}</p>
                    <p className="text-[10px] text-blue-500 font-black tracking-widest">{c.phone}</p>
                  </div>
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
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Restam {Math.max(0, Math.ceil((new Date(c.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} dias</p>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end items-center border border-gray-800/50 rounded-2xl p-1 bg-black/20 w-fit ml-auto max-w-[210px] overflow-x-auto custom-scrollbar no-scrollbar-on-desktop">
                    <button onClick={() => openWhatsApp(c.phone, c.name)} className="p-3 text-green-500 hover:bg-green-500 hover:text-white transition-all rounded-xl shrink-0" title="WhatsApp">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.539 2.016 2.041-.54c.947.527 1.997.807 3.245.807 3.181 0 5.767-2.587 5.768-5.766.001-3.181-2.587-5.77-5.766-5.77zm3.846 8.012c-.149.413-.866.758-1.204.801-.339.043-.77.067-1.288-.099-.302-.096-.682-.234-1.159-.444-2.03-.893-3.341-2.994-3.442-3.127-.101-.132-.759-.993-.759-1.907 0-.913.48-1.362.65-1.577.169-.215.372-.269.497-.269.125 0 .25 0 .356.006.114.004.266-.042.415.321.155.376.53 1.277.575 1.368.045.091.075.197.015.318-.06.121-.09.197-.181.303-.09.106-.19.236-.271.317-.091.091-.186.19-.08.373.106.183.471.777.997 1.248.679.608 1.248.797 1.431.887.182.09.289.076.395-.045.106-.121.455-.53.576-.711.121-.182.242-.151.408-.091.166.06.1.48 2.04.947.166.075.277.114.338.213.061.099.061.572-.088.985z"/></svg>
                    </button>
                    {/* BOTÃO COPIAR M3U ATUALIZADO PARA USAR O LINK MANUAL */}
                    <button onClick={() => copyToClipboard(generateManualM3uLink(c), 'Link M3U Manual')} className="p-3 text-blue-400 hover:bg-blue-400 hover:text-white transition-all rounded-xl border-l border-gray-800/50 shrink-0" title="Copiar M3U Manual">
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                    </button>
                    <button onClick={() => handleOpenRenew(c)} className="p-3 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all rounded-xl border-l border-gray-800/50 shrink-0" title="Renovar">
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    </button>
                    <button onClick={() => handleOpenEdit(c)} className="p-3 text-gray-400 hover:bg-white hover:text-black transition-all rounded-xl border-l border-gray-800/50 shrink-0" title="Editar">
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onClick={() => { if(confirm('Excluir este cliente?')) onDelete(c.id); }} className="p-3 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-xl border-l border-gray-800/50 shrink-0" title="Excluir">
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-32 text-center text-gray-700 font-black uppercase text-xs tracking-[0.5em] italic opacity-20">
                  Nenhum cliente na base de dados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isRenewModalOpen && renewingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsRenewModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#141824] rounded-[40px] border border-gray-800 shadow-3xl p-10 animate-fade-in overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
            <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tighter leading-none">RENOVAR <span className="text-cyan-500">CLIENTE</span></h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">Cliente: {renewingClient.name}</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Selecionar Plano de Renovação</label>
                <select 
                  value={renewFormData.planId} 
                  onChange={e => setRenewFormData({ ...renewFormData, planId: e.target.value })} 
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-cyan-500 outline-none appearance-none"
                >
                  <option value="">Escolha o Plano</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} - R${p.price} ({p.durationValue} {p.durationUnit === 'months' ? 'Mês(es)' : 'Dia(s)'})</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data de Vencimento Manual (Opcional)</label>
                <input 
                  type="date" 
                  value={renewFormData.manualDate} 
                  onChange={e => setRenewFormData({ ...renewFormData, manualDate: e.target.value })} 
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-cyan-500 outline-none" 
                />
                <p className="text-[8px] text-gray-600 font-bold italic ml-1 leading-tight">Se deixado em branco, a data será calculada automaticamente com base no plano escolhido somado à data de vencimento atual.</p>
              </div>

              <div className="flex flex-col gap-3 pt-6">
                <button onClick={handleConfirmRenew} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-xl shadow-cyan-600/20 active:scale-95">
                  CONFIRMAR RENOVAÇÃO
                </button>
                <button onClick={() => setIsRenewModalOpen(false)} className="w-full text-gray-500 font-bold uppercase text-[9px] tracking-widest py-2 hover:text-white transition-colors">CANCELAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#141824] rounded-[48px] border border-gray-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in p-12">
            <h2 className="text-4xl font-black italic text-white mb-10 uppercase tracking-tighter">
              {editingClient ? 'EDITAR' : 'NOVO'} <span className="text-blue-500">CLIENTE</span>
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome do Cliente" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">WhatsApp (com DDD)</label>
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="5511999999999" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Usuário / Login</label>
                  <input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Ex: login123" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Senha de Acesso</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Senha desejada" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Vincular Plano</label>
                  <select value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none appearance-none">
                    <option value="">Selecione o Plano</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} - R${p.price}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Vincular Servidor</label>
                  <select value={formData.serverId} onChange={e => setFormData({ ...formData, serverId: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold outline-none appearance-none">
                    <option value="">Selecione o Servidor</option>
                    {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Data de Vencimento</label>
                <input type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
              </div>
              <div className="flex justify-end gap-6 pt-10">
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors">DESCARTAR</button>
                <button onClick={handleSave} className="bg-blue-600 px-12 py-5 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-2xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all">
                  {editingClient ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CADASTRO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .no-scrollbar-on-desktop::-webkit-scrollbar {
          height: 3px;
        }
        .no-scrollbar-on-desktop::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default GestorClientes;
