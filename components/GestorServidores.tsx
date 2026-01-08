
import React, { useState } from 'react';
import { Server } from '../types';

interface Props {
  servers: Server[];
  onAddServer: (server: Server) => void;
  onDeleteServer: (id: string) => void;
}

const GestorServidores: React.FC<Props> = ({ servers, onAddServer, onDeleteServer }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const addServer = () => {
    if (!name || !url || !apiKey) {
      alert("Por favor, preencha todos os campos para habilitar a automação.");
      return;
    }
    const newServer: Server = {
      id: Date.now().toString(),
      name,
      url,
      apiKey
    };
    onAddServer(newServer);
    setName('');
    setUrl('');
    setApiKey('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 animate-fade-in">
      <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
           <span className="text-8xl">🖥️</span>
        </div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">Conectar <span className="text-blue-500">Painel IPTV</span></h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mt-2 max-w-md">
            Vincule seu gestor ao painel jordantv.shop ou similar para criar usuários automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Apelido do Servidor</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ex: Servidor VIP Jordan" 
              className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-inner" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">URL da API (Endpoint)</label>
            <input 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="https://jordantv.shop/api/create_user.php" 
              className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-inner" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Chave de API (Authorization Bearer)</label>
            <input 
              type="password"
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
              placeholder="Insira seu Token da JordanTV" 
              className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-inner" 
            />
          </div>

          <button 
            onClick={addServer} 
            className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-xs italic tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95"
          >
            Salvar e Ativar Sincronização
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servers.map(s => (
          <div key={s.id} className="bg-[#141824] p-8 rounded-[32px] border border-gray-800 flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xl">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">🖥️</div>
                <span className="text-[8px] font-black bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded-md uppercase tracking-widest animate-pulse">Online</span>
              </div>
              <div>
                <p className="font-black uppercase text-white text-sm tracking-tight italic">{s.name}</p>
                <p className="text-[9px] text-gray-500 font-bold truncate mt-1 opacity-50">{s.url}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800/50 flex justify-between items-center">
               <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Token: ••••••••{s.apiKey.slice(-4)}</span>
               <button 
                 onClick={() => onDeleteServer(s.id)} 
                 className="text-[10px] font-black text-red-500/50 uppercase hover:text-red-500 transition-colors"
               >
                 Remover
               </button>
            </div>
          </div>
        ))}
      </div>

      {servers.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-gray-800 rounded-[40px] opacity-20">
           <span className="text-6xl block mb-4">🔌</span>
           <p className="text-sm font-black uppercase tracking-widest">Nenhum servidor conectado à API</p>
        </div>
      )}
    </div>
  );
};

export default GestorServidores;
