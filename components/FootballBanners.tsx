
import React, { useState, useRef } from 'react';
import { getFootballGames } from '../services/apiService';
import { getBroadcastsForGames } from '../services/geminiService';
import { FootballGame } from '../types';
import html2canvas from 'html2canvas';

const LIGAS_PERMITIDAS = [71, 13, 39, 140, 61, 78, 135, 2, 3];

const THEMES = [
  { id: 'vermelho', label: 'Vermelho', url: 'https://i.ibb.co/Q7RgFTxz/Design-sem-nome.png', color: '#ef4444', border: '#7f1d1d' },
  { id: 'amarelo', label: 'Amarelo', url: 'https://i.ibb.co/M5M6s8CN/Whats-App-Image-2025-12-21-at-00-43-22.jpg', color: '#eab308', border: '#713f12' },
  { id: 'azul', label: 'Azul', url: 'https://i.ibb.co/fYPSd7L7/Whats-App-Image-2025-12-21-at-00-43-23-1.jpg', color: '#3b82f6', border: '#1e3a8a' },
  { id: 'verde', label: 'Verde', url: 'https://i.ibb.co/hxMGzc5r/Whats-App-Image-2025-12-21-at-00-43-23.jpg', color: '#22c55e', border: '#14532d' },
  { id: 'rosa', label: 'Rosa', url: 'https://i.ibb.co/60h1cWWc/Whats-App-Image-2025-12-21-at-00-43-57-1.jpg', color: '#ec4899', border: '#831843' },
  { id: 'roxo', label: 'Roxo', url: 'https://i.ibb.co/Y4djtdSj/Whats-App-Image-2025-12-21-at-00-43-57.jpg', color: '#a855f7', border: '#581c87' },
  { id: 'laranja', label: 'Laranja', url: 'https://i.ibb.co/PZ33xgnN/Whats-App-Image-2025-12-21-at-00-44-01.jpg', color: '#f97316', border: '#7c2d12' },
];

const FootballBanners: React.FC = () => {
  // Agora armazenamos blocos de jogos (cada bloco tem até 6 jogos)
  const [gameChunks, setGameChunks] = useState<FootballGame[][]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | 'all' | null>(null);
  const [generated, setGenerated] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[3]); 

  const bannerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const formatTeamName = (name: string) => {
    if (name.length > 12) {
      return name.substring(0, 11).trim() + '.';
    }
    return name;
  };

  const chunkArray = (array: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const generateBanners = async () => {
    setLoading(true);
    try {
      const allGames = await getFootballGames();
      const filtered = allGames.filter((g: any) => LIGAS_PERMITIDAS.includes(g.league.id));
      
      // Ordena por horário e NÃO limita a 6
      const sorted = filtered.sort((a: any, b: any) => 
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );

      if (sorted.length === 0) {
        alert("Nenhum jogo importante encontrado para hoje.");
        setLoading(false);
        return;
      }

      // Busca transmissões para todos os jogos de uma vez para economizar tokens
      const gamesForAI = sorted.map((g: any) => `${g.teams.home.name} x ${g.teams.away.name} (${g.league.name})`);
      const broadcasts = await getBroadcastsForGames(gamesForAI);

      const processed = sorted.map((g: any, index: number) => ({
        ...g,
        broadcast: broadcasts[index] || "IPTV PREMIUM"
      }));

      // Divide em grupos de 6
      const chunks = chunkArray(processed, 6);
      setGameChunks(chunks);
      setGenerated(true);
    } catch (err) { 
      console.error(err);
      alert("Erro ao sincronizar. Tente novamente."); 
    } finally { 
      setLoading(false); 
    }
  };

  const downloadSingleBanner = async (index: number) => {
    const element = bannerRefs.current[index];
    if (!element) return;
    setIsDownloading(index);

    try {
      await new Promise(r => setTimeout(r, 400));
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2.5,
        backgroundColor: "#000000",
        logging: false,
        width: 540,
        height: 675,
      });
      
      const link = document.createElement('a');
      link.download = `BANNER_FUTEBOL_PARTE_${index + 1}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) { 
      alert("Falha ao gerar arquivo."); 
    } finally {
      setIsDownloading(null);
    }
  };

  const downloadAllBanners = async () => {
    setIsDownloading('all');
    for (let i = 0; i < gameChunks.length; i++) {
      await downloadSingleBanner(i);
      // Pequeno delay entre downloads para evitar travamento do navegador
      await new Promise(r => setTimeout(r, 500));
    }
    setIsDownloading(null);
  };

  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col items-center">
      <header className="w-full mb-10 bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-2xl flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              GERADOR DE <span style={{ color: selectedTheme.color }}>FUTEBOL</span>
            </h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Paginação Automática Ativada (6 por Arte)</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {generated && gameChunks.length > 1 && (
             <button 
              onClick={downloadAllBanners} 
              disabled={loading || isDownloading !== null}
              className="bg-white text-black px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all shadow-xl"
             >
               {isDownloading === 'all' ? 'BAIXANDO TODOS...' : '📥 BAIXAR TODAS AS PARTES'}
             </button>
          )}
          <button onClick={generateBanners} disabled={loading} className="text-white px-10 py-4 rounded-2xl font-black uppercase text-xs italic tracking-widest shadow-xl active:scale-95 transition-all" style={{ backgroundColor: selectedTheme.color }}>
            {loading ? 'SINCRONIZANDO...' : 'BUSCAR JOGOS DO DIA'}
          </button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-12 w-full justify-center items-start">
        {/* BARRA LATERAL DE CONFIGURAÇÃO */}
        <div className="xl:sticky xl:top-28 space-y-6">
           <div className="bg-[#141824] p-6 rounded-[32px] border border-gray-800 shadow-xl w-full xl:w-56">
              <h3 className="text-gray-500 font-black text-[9px] uppercase mb-6 tracking-widest text-center">PALETA</h3>
              <div className="grid grid-cols-4 xl:grid-cols-1 gap-3">
                 {THEMES.map(theme => (
                   <button key={theme.id} onClick={() => setSelectedTheme(theme)} className={`h-12 rounded-xl border-2 transition-all flex items-center justify-center ${selectedTheme.id === theme.id ? 'border-white scale-105' : 'border-transparent opacity-40 hover:opacity-80'}`} style={{ backgroundColor: theme.color }}>
                     <span className="text-[8px] font-black text-white uppercase italic">{theme.label}</span>
                   </button>
                 ))}
              </div>
           </div>
           {generated && (
             <div className="bg-blue-600/10 p-6 rounded-[32px] border border-blue-500/20 text-center">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Resumo</p>
                <p className="text-2xl font-black text-white italic mt-1">{gameChunks.length} <span className="text-xs">Banners</span></p>
                <p className="text-[8px] text-gray-500 font-bold uppercase mt-1">Total de {gameChunks.flat().length} jogos</p>
             </div>
           )}
        </div>

        {/* LISTA DE BANNERS GERADOS */}
        <div className="flex flex-col gap-16 items-center flex-1">
          {generated ? (
            gameChunks.map((chunk, chunkIdx) => (
              <div key={chunkIdx} className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="flex items-center gap-4 w-full px-4">
                  <div className="h-px flex-1 bg-gray-800"></div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">Banner Parte {chunkIdx + 1}</span>
                  <div className="h-px flex-1 bg-gray-800"></div>
                </div>

                <div 
                  /* FIXED: Callback ref must return void to comply with RefCallback type signature */
                  ref={el => { bannerRefs.current[chunkIdx] = el; }} 
                  className="w-[540px] h-[675px] bg-black relative overflow-hidden shadow-2xl flex-shrink-0"
                >
                  <img src={selectedTheme.url} className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" alt="BG" />
                  
                  <div className="absolute top-[20px] left-0 w-full text-center z-10">
                    <span className="text-white font-black text-[42px] tracking-tighter uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] leading-none">
                      {dateStr}
                    </span>
                  </div>

                  <div className="absolute top-[255px] left-0 w-full z-20">
                    {chunk.map((g, idx) => (
                      <div key={idx} className="relative w-full" style={{ height: '68px' }}>
                        <div className="absolute top-[-9px] left-[-75px] w-full text-center">
                          <span className="text-white text-[7px] font-black uppercase italic tracking-[0.4em] opacity-80">
                            {g.league.name}
                          </span>
                        </div>
                        <div className="absolute left-[40px] top-[6px]">
                          <img src={g.teams.home.logo} className="w-[38px] h-[38px] object-contain" crossOrigin="anonymous" />
                        </div>
                        <div className="absolute left-[75px] top-[10px] w-[155px] text-left">
                          <span className="text-white font-black text-[10px] uppercase italic tracking-tight block">
                            {formatTeamName(g.teams.home.name)}
                          </span>
                        </div>
                        <div className="absolute left-[170px] top-[7px] w-[60px] text-center">
                          <span className="text-white font-black text-[15px] tracking-tighter">
                            {new Date(g.fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="absolute left-[150px] top-[10px] w-[155px] text-right">
                          <span className="text-white font-black text-[10px] uppercase italic tracking-tight block">
                            {formatTeamName(g.teams.away.name)}
                          </span>
                        </div>
                        <div className="absolute left-[330px] top-[3px]">
                          <img src={g.teams.away.logo} className="w-[38px] h-[38px] object-contain" crossOrigin="anonymous" />
                        </div>
                        <div className="absolute top-[45px] left-[-80px] w-full flex justify-center">
                          <span className="text-white font-black text-[6.5px] uppercase tracking-widest italic flex items-center gap-1">
                            📺 {g.broadcast}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => downloadSingleBanner(chunkIdx)} 
                  disabled={isDownloading !== null}
                  className={`w-full max-w-[540px] py-6 rounded-[30px] shadow-2xl flex items-center justify-center gap-4 uppercase italic text-sm tracking-widest transition-all ${isDownloading === chunkIdx ? 'bg-gray-700' : 'hover:brightness-110 active:scale-95'}`} 
                  style={{ backgroundColor: selectedTheme.color }}
                >
                  {isDownloading === chunkIdx ? 'EXPORTANDO PARTE...' : <><span className="text-2xl">📥</span> BAIXAR PARTE {chunkIdx + 1}</>}
                </button>
              </div>
            ))
          ) : (
            // Placeholder/Esqueleto quando não há nada gerado
            <div className="flex flex-col items-center gap-6 opacity-20">
              <div 
                className="w-[540px] h-[675px] bg-black relative overflow-hidden border border-gray-800 rounded-lg"
              >
                <img src={selectedTheme.url} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" alt="BG" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                   <span className="text-6xl mb-4">⚽</span>
                   <p className="text-xl font-black uppercase tracking-widest italic">Aguardando Busca</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FootballBanners;
