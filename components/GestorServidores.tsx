
import React, { useState } from 'react';
import { Server } from '../types';

interface Props {
  servers: Server[];
  setServers: (servers: Server[]) => void;
}

const GestorServidores: React.FC<Props> = ({ servers, setServers }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const addServer = () => {
    if (!name || !url || !apiKey) {
      alert("Preencha todos os campos, incluindo a Chave de API do painel.");
      return;
    }
    setServers([...servers, { id: Date.now().toString(), name, url, apiKey }]);
    setName('');
    setUrl('');
    setApiKey('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 space-y-6 shadow-2xl">
        <h3 className="text-xl font-black italic uppercase tracking-tighter">Configurar <span className="text-blue-500">Integração API</span></h3>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
          As credenciais abaixo permitem que o sistema crie usuários automaticamente no seu painel principal.
        </p>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Apelido do Painel (Ex: CloudServe)" className="bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL Base (Ex: https://jordantv.shop/api/create_user.php)" className="bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
          </div>
          <input 
            type="password"
            value={apiKey} 
            onChange={e => setApiKey(e.target.value)} 
            placeholder="Chave de API (Bearer Token)" 
            className="bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" 
          />
        </div>
        <button onClick={addServer} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-sm italic tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-600/20">Salvar e Conectar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map(s => (
          <div key={s.id} className="bg-[#141824] p-6 rounded-[32px] border border-gray-800 flex justify-between items-center group">
            <div>
              <p className="font-black uppercase text-blue-500 text-xs tracking-widest">{s.name}</p>
              <p className="text-[10px] text-gray-500 font-bold truncate max-w-[180px]">{s.url}</p>
              {s.apiKey && <p className="text-[8px] text-green-500 font-black mt-1 uppercase tracking-widest">● API CONECTADA</p>}
            </div>
            <button onClick={() => setServers(servers.filter(x => x.id !== s.id))} className="opacity-0 group-hover:opacity-100 text-red-500 text-xs font-black transition-opacity uppercase hover:underline">Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestorServidores;
