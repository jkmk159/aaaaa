
import React from 'react';
import { Client, Server, ViewType } from '../types';

interface Props {
  clients: Client[];
  servers: Server[];
  onNavigate: (view: ViewType) => void;
  onRenew: (clientId: string, planId: string) => void;
  getClientStatus: (date: string) => 'active' | 'expired' | 'near_expiry';
}

const GestorDashboard: React.FC<Props> = ({ clients, servers, onNavigate, onRenew, getClientStatus }) => {
  const active = clients.filter(c => getClientStatus(c.expirationDate) === 'active').length;
  const expired = clients.filter(c => getClientStatus(c.expirationDate) === 'expired').length;
  const near = clients.filter(c => getClientStatus(c.expirationDate) === 'near_expiry');

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800">
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Clientes Ativos</p>
          <h3 className="text-4xl font-black italic">{active}</h3>
        </div>
        <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800">
          <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Clientes Inativos</p>
          <h3 className="text-4xl font-black italic">{expired}</h3>
        </div>
        <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800">
          <p className="text-[10px] font-black uppercase text-yellow-500 tracking-widest mb-1">Próximos do Vencimento</p>
          <h3 className="text-4xl font-black italic">{near.length}</h3>
        </div>
      </div>

      <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 bg-black/20">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">🚨 Atenção Necessária (Vencem em breve)</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase font-black text-gray-600 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Servidor</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {near.map(c => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-white/5">
                  <td className="px-6 py-4 font-bold">{c.name}</td>
                  <td className="px-6 py-4 text-xs">{servers.find(s => s.id === c.serverId)?.name || 'N/A'}</td>
                  <td className="px-6 py-4 font-mono text-yellow-500">{new Date(c.expirationDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => onRenew(c.id, c.planId)} className="bg-blue-600 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase transition-all hover:bg-blue-700">Renovar</button>
                      <button onClick={() => onNavigate('gestor-template-ai')} className="bg-green-600 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase transition-all hover:bg-green-700">Cobrar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {near.length === 0 && (
                <tr><td colSpan={4} className="p-10 text-center text-gray-600 uppercase text-[10px] font-black">Nenhum cliente para vencer em breve.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestorDashboard;
