
import React from 'react';
import { Client, Server, ViewType, Plan } from '../types';

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

  // Cálculo de faturamento mensal estimado (baseado nos planos dos clientes ativos)
  const estimatedRevenue = clients
    .filter(c => getClientStatus(c.expirationDate) === 'active')
    .length * 35; // Valor médio fictício caso não haja planos reais

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">DASH<span className="text-blue-500">BOARD</span></h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Visão geral do seu negócio de IPTV</p>
        </div>
        <div className="bg-blue-600/10 px-6 py-3 rounded-2xl border border-blue-500/20">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Faturamento Est. Mensal</p>
          <p className="text-xl font-black text-white">R$ {estimatedRevenue.toLocaleString('pt-BR')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Clientes" value={clients.length} color="text-white" icon="👥" />
        <StatCard label="Assinantes Ativos" value={active} color="text-green-500" icon="⚡" />
        <StatCard label="Vencidos" value={expired} color="text-red-500" icon="🚫" />
        <StatCard label="Vencendo em 5 dias" value={near.length} color="text-yellow-500" icon="⚠️" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#141824] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-gray-800 bg-black/20 flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">🚨 Próximos Vencimentos</h4>
            <button onClick={() => onNavigate('gestor-clientes')} className="text-[10px] font-black text-blue-500 hover:underline">VER TODOS</button>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {near.length > 0 ? (
              near.map(c => (
                <div key={c.id} className="flex items-center justify-between p-6 border-b border-gray-800/50 hover:bg-white/[0.02]">
                  <div>
                    <p className="font-bold text-sm text-white">{c.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{servers.find(s => s.id === c.serverId)?.name || 'Sem Servidor'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-yellow-500 font-bold">{new Date(c.expirationDate).toLocaleDateString('pt-BR')}</p>
                    <button onClick={() => onNavigate('gestor-template-ai')} className="text-[9px] font-black text-blue-500 uppercase mt-1">COBRAR VIA WHATSAPP</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-700 uppercase font-black text-[10px]">Tudo em dia por aqui.</div>
            )}
          </div>
        </div>

        <div className="bg-[#141824] rounded-[32px] border border-gray-800 p-8 flex flex-col justify-center items-center text-center space-y-6">
           <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-3xl">📊</div>
           <h3 className="text-xl font-black italic uppercase tracking-tighter">Quer automatizar suas <span className="text-blue-500">Cobranças?</span></h3>
           <p className="text-sm text-gray-400 max-w-xs">Nossa IA redige mensagens personalizadas para cada cliente, aumentando sua taxa de renovação em até 40%.</p>
           <button onClick={() => onNavigate('gestor-template-ai')} className="bg-blue-600 px-8 py-3 rounded-xl font-black uppercase text-xs italic tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">Configurar Templates IA</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }: any) => (
  <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800 shadow-xl">
    <div className="flex justify-between items-start mb-2">
      <span className="text-2xl opacity-50">{icon}</span>
      <span className={`text-3xl font-black italic ${color}`}>{value}</span>
    </div>
    <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{label}</p>
  </div>
);

export default GestorDashboard;
