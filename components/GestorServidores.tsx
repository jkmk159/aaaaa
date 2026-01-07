
import React, { useState } from 'react';
import { Server } from '../types';

interface Props {
  servers: Server[];
  setServers: (servers: Server[]) => void;
}

const GestorServidores: React.FC<Props> = ({ servers, setServers }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const addServer = () => {
    if (!name || !url) return;
    setServers([...servers, { id: Date.now().toString(), name, url }]);
    setName('');
    setUrl('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 space-y-6">
        <h3 className="text-xl font-black italic uppercase tracking-tighter">Cadastrar <span className="text-blue-500">Servidor</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Servidor (Ex: P2P Master)" className="bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL/DNS do Servidor" className="bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
        </div>
        <button onClick={addServer} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-sm italic tracking-widest transition-all hover:bg-blue-700">Adicionar Servidor</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map(s => (
          <div key={s.id} className="bg-[#141824] p-6 rounded-[32px] border border-gray-800 flex justify-between items-center group">
            <div>
              <p className="font-black uppercase text-blue-500 text-xs tracking-widest">{s.name}</p>
              <p className="text-[10px] text-gray-500 font-bold truncate max-w-[180px]">{s.url}</p>
            </div>
            <button onClick={() => setServers(servers.filter(x => x.id !== s.id))} className="opacity-0 group-hover:opacity-100 text-red-500 text-xs font-black transition-opacity uppercase hover:underline">Excluir</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestorServidores;
