
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
  const [games, setGames] = useState<FootballGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[3]); 

  const bannerRef = useRef<HTMLDivElement>(null);

  const formatTeamName = (name: string) => {
    if (name.length > 12) {
      return name.substring(0, 11).trim() + '.';
    }
    return name;
  };

  const generateBanner = async () => {
    setLoading(true);
    try {
      const allGames = await getFootballGames();
      const filtered = allGames.filter((g: any) => LIGAS_PERMITIDAS.includes(g.league.id));
      const sorted = filtered.sort((a: any, b: any) => 
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      ).slice(0, 6);

      const gamesForAI = sorted.map((g: any) => `${g.teams.home.name} x ${g.teams.away.name} (${g.league.name})`);
      const broadcasts = await getBroadcastsForGames(gamesForAI);

      const processed = sorted.map((g: any, index: number) => ({
        ...g,
        broadcast: broadcasts[index] || "IPTV PREMIUM"
      }));

      setGames(processed);
      setGenerated(true);
    } catch (err) { 
      alert("Erro ao sincronizar. Tente novamente."); 
    } finally { 
      setLoading(false); 
    }
  };

  const downloadBanner = async () => {
    if (!bannerRef.current) return;
    setIsDownloading(true);

    try {
      await new Promise(r => setTimeout(r, 400));
      const canvas = await html2canvas(bannerRef.current, {
        useCORS: true,
        scale: 2.5,
        backgroundColor: "#000000",
        logging: false,
        width: 540,
        height: 675,
      });
      
      const link = document.createElement('a');
      link.download = `BANNER_FUTEBOL_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) { 
      alert("Falha ao gerar arquivo."); 
    } finally {
      setIsDownloading(false);
    }
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
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Layout Original Restaurado</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={generateBanner} disabled={loading} className="text-white px-10 py-4 rounded-2xl font-black uppercase text-xs italic tracking-widest shadow-xl active:scale-95 transition-all" style={{ backgroundColor: selectedTheme.color }}>
            {loading ? 'SINCRONIZANDO...' : 'BUSCAR JOGOS'}
          </button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-12 w-full justify-center items-start">
        {/* BARRA LATERAL DE CONFIGURAÇÃO */}
        <div className="xl:sticky xl:top-28 space-y-6">
           {/* SELETOR DE TEMAS */}
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
        </div>

        <div className="relative">
          <div ref={bannerRef} className="w-[540px] h-[675px] bg-black relative overflow-hidden shadow-2xl">
            <img src={selectedTheme.url} className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" alt="BG" />
            
            <div className="absolute top-[20px] left-[0] w-full text-center z-10">
              <span className="text-white font-black text-[42px] tracking-tighter uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] leading-none">
                {dateStr}
              </span>
            </div>

            <div className="absolute top-[255px] left-0 w-full z-20">
              {(generated ? games : Array.from({ length: 6 })).map((jogo, idx) => {
                const hasData = !!jogo;
                const g = jogo as FootballGame;

                return (
                  <div key={idx} className="relative w-full" style={{ height: '68px' }}>
                    <div className="absolute top-[-12px] left-[-90] w-full text-center">
                      <span className="text-white text-[7px] font-black uppercase italic tracking-[0.4em] opacity-80">
                        {hasData ? g.league.name : `CAMPEONATO NACIONAL`}
                      </span>
                    </div>
                    <div className="absolute left-[40px] top-[6px]">
                      {hasData ? <img src={g.teams.home.logo} className="w-[38px] h-[38px] object-contain" crossOrigin="anonymous" /> : <div className="w-9 h-9 rounded-full bg-white/5" />}
                    </div>
                    <div className="absolute left-[75px] top-[10px] w-[155px] text-left">
                      <span className="text-white font-black text-[10px] uppercase italic tracking-tight block">
                        {hasData ? formatTeamName(g.teams.home.name) : 'EQUIPE CASA'}
                      </span>
                    </div>
                    <div className="absolute left-[170px] top-[7px] w-[60px] text-center">
                      <span className="text-white font-black text-[15px] tracking-tighter">
                        {hasData ? new Date(g.fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                      </span>
                    </div>
                    <div className="absolute left-[150px] top-[10px] w-[155px] text-right">
                      <span className="text-white font-black text-[10px] uppercase italic tracking-tight block">
                        {hasData ? formatTeamName(g.teams.away.name) : 'EQUIPE FORA'}
                      </span>
                    </div>
                    <div className="absolute left-[330px] top-[3px]">
                      {hasData ? <img src={g.teams.away.logo} className="w-[38px] h-[38px] object-contain" crossOrigin="anonymous" /> : <div className="w-9 h-9 rounded-full bg-white/5" />}
                    </div>
                    <div className="absolute top-[40px] left-[-120] w-full flex justify-center">
                      <span className="text-white font-black text-[6.5px] uppercase tracking-widest italic flex items-center gap-1">
                        📺 {hasData ? g.broadcast : 'SEM TRANSMISSÃO'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={downloadBanner} disabled={!generated || isDownloading} className={`w-full mt-8 text-white font-black py-6 rounded-[30px] shadow-2xl flex items-center justify-center gap-4 uppercase italic text-sm tracking-widest transition-all ${!generated ? 'opacity-20 grayscale' : 'hover:brightness-110 active:scale-95'}`} style={{ backgroundColor: selectedTheme.color }}>
            {isDownloading ? 'EXPORTANDO PNG...' : <><span className="text-2xl">📥</span> BAIXAR BANNER AGORA</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FootballBanners;
