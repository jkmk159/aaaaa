import React, { useState } from 'react';
import { Server } from '../types';

interface Props {
  servers: Server[];
  setServers: (servers: Server[]) => void;
  onDelete: (id: string) => void;
}

const GestorServidores: React.FC<Props> = ({ servers, setServers, onDelete }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const addServer = async () => {
    if (!name || !url || !apiKey) {
      alert("Preencha todos os campos!");
      return;
    }

    // Criamos o objeto sem ID para o Supabase gerar um UUID automaticamente
    const newServer = { 
      name, 
      url, 
      apiKey 
    };

    // Chamamos a função do App.tsx que agora salva no banco
    setServers([...servers, newServer as any]);
    
    // Limpa os campos
    setName(''); setUrl(''); setApiKey('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 text-white">
      <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 space-y-6 shadow-2xl">
        <h3 className="text-xl font-black italic uppercase tracking-tighter">Configurar <span className="text-blue-500">Servidor</span></h3>
        <div className="grid grid-cols-1 gap-4">
          <input placeholder="Nome do Painel" value={name} onChange={e => setName(e.target.value)} className="bg-black/40 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500" />
          <input placeholder="URL da API (ex: http://painel.com/api.php)" value={url} onChange={e => setUrl(e.target.value)} className="bg-black/40 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500" />
          <input placeholder="API Key / Token" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="bg-black/40 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500" />
        </div>
        <button onClick={addServer} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          Salvar Servidor no Banco
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map(s => (
          <div key={s.id} className="bg-[#141824] p-6 rounded-[32px] border border-gray-800 flex justify-between items-center group">
            <div className="overflow-hidden">
              <p className="font-black uppercase text-blue-500 text-xs tracking-widest">{s.name}</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{s.url}</p>
            </div>
            <button onClick={() => onDelete(s.id)} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestorServidores;
