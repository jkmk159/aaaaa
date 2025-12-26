
import React, { useState, useRef } from 'react';
import { searchSeries } from '../services/apiService';
import { TMDBSeries } from '../types';
import html2canvas from 'html2canvas';

const SERIES_THEMES = [
  { id: 'netflix', label: 'Estilo Stream', color: '#e50914' },
  { id: 'hbo', label: 'Premium Dark', color: '#a855f7' },
  { id: 'gold', label: 'Premium Gold', color: '#fbbf24' },
];

const SeriesBanners: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<TMDBSeries | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(SERIES_THEMES[0]);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [brandName, setBrandName] = useState('IPTV PRO');
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState('WWW.IPTVPRO.COM');
  
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const series = await searchSeries(query);
      setResults(series.slice(0, 8));
      if (series.length > 0) setSelectedSeries(series[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadBanner = async () => {
    if (!bannerRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(bannerRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#000000",
      });
      const link = document.createElement('a');
      link.download = `BANNER_SERIE_${selectedSeries?.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert("Erro ao gerar imagem");
    } finally {
      setIsDownloading(false);
    }
  };

  // Função para ajustar o tamanho do título dinamicamente
  const getTitleStyle = (title: string) => {
    if (title.length > 40) return 'text-2xl';
    if (title.length > 25) return 'text-3xl';
    return 'text-4xl';
  };

  const renderBannerContent = () => {
    if (!selectedSeries) return null;

    const titleSize = getTitleStyle(selectedSeries.name);

    // LAYOUT 1: ESTILO STREAM (NETFLIX)
    if (selectedTheme.id === 'netflix') {
      return (
        <>
          <img src={selectedSeries.poster_path ? `https://image.tmdb.org/t/p/original${selectedSeries.poster_path}` : 'https://via.placeholder.com/500?text=No+Background'} className="absolute inset-0 w-full h-full object-cover opacity-70" crossOrigin="anonymous" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          
          <div className="absolute top-6 left-6 flex items-center">
            {brandLogo ? (
              <img src={brandLogo} className="h-8 w-auto object-contain max-w-[150px]" alt="Brand Logo" />
            ) : (
              <span className="text-base font-black italic tracking-tighter">
                {brandName.split(' ')[0]}
                <span className="text-gray-400">{brandName.split(' ').slice(1).join(' ')}</span>
              </span>
            )}
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="space-y-3">
              <div className="flex gap-2">
                <span style={{ backgroundColor: selectedTheme.color }} className="px-2 py-0.5 rounded text-[8px] font-black italic uppercase tracking-widest">SÉRIE EM ALTA</span>
                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black italic uppercase tracking-widest border border-white/10">TEMPORADAS COMPLETAS</span>
              </div>
              <h4 className={`${titleSize} font-black uppercase italic tracking-tighter leading-[0.9] text-white`}>{selectedSeries.name}</h4>
              <p className="text-[10px] text-gray-200 leading-snug drop-shadow-md font-medium">
                {selectedSeries.overview || "Sinopse não disponível."}
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50 italic">DISPONÍVEL NO CATÁLOGO</span>
                 <span className="text-[9px] font-black italic" style={{ color: selectedTheme.color }}>{contactInfo}</span>
              </div>
            </div>
          </div>
        </>
      );
    }

    // LAYOUT 2: PREMIUM DARK (NOIR SERIES)
    if (selectedTheme.id === 'hbo') {
      return (
        <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden p-6 flex flex-col justify-between">
          <div className="absolute inset-0 z-0">
             <img src={selectedSeries.poster_path ? `https://image.tmdb.org/t/p/original${selectedSeries.poster_path}` : ''} className="w-full h-full object-cover opacity-50 grayscale brightness-[0.3]" crossOrigin="anonymous" alt="" />
             <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
          </div>

          <div className="relative z-10 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="w-8 h-[1px] bg-purple-500"></div>
                {brandLogo ? (
                  <img src={brandLogo} className="h-6 w-auto" alt="" />
                ) : (
                  <span className="text-[10px] font-black tracking-[0.3em] text-white italic">{brandName}</span>
                )}
             </div>
             <span className="text-[7px] font-black text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">ULTRA STREAMING</span>
          </div>

          <div className="relative z-10 py-6">
             <div className="flex flex-col items-center text-center space-y-3">
                <div className="space-y-1">
                   <h4 className={`${titleSize} font-black uppercase italic tracking-tighter leading-[0.9] text-white drop-shadow-[0_10px_30px_rgba(168,85,247,0.3)]`}>
                      {selectedSeries.name}
                   </h4>
                </div>
                
                <div className="flex items-center gap-3 text-gray-500">
                   <span className="text-[9px] font-bold">Lançamento {selectedSeries.first_air_date?.split('-')[0]}</span>
                   <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                   <span className="text-[9px] font-bold">Original Series</span>
                </div>

                <p className="text-[10px] text-gray-400 font-medium max-w-sm leading-relaxed">
                   {selectedSeries.overview || "Prepare-se para uma jornada épica nesta série aclamada pela crítica."}
                </p>
             </div>
          </div>

          <div className="relative z-10 border-t border-white/5 pt-4 flex justify-between items-end">
             <div className="space-y-1">
                <p className="text-[6px] font-black text-gray-600 uppercase tracking-[0.3em]">EXPERIÊNCIA PREMIUM</p>
                <p className="text-[12px] font-black text-white italic tracking-tighter leading-none">{contactInfo}</p>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest italic">Assista Agora</span>
                <div className="flex gap-1 mt-1">
                   {[1,2,3,4].map(i => <div key={i} className="w-2 h-[2px] bg-purple-600"></div>)}
                </div>
             </div>
          </div>
        </div>
      );
    }

    // LAYOUT 3: PREMIUM GOLD
    if (selectedTheme.id === 'gold') {
      return (
        <div className="w-full h-full bg-neutral-950 flex flex-col p-6">
           <img src={selectedSeries.poster_path ? `https://image.tmdb.org/t/p/original${selectedSeries.poster_path}` : ''} className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale" crossOrigin="anonymous" alt="" />
           <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
           
           <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                 <div className="w-10 h-10 border-t-2 border-l-2 border-[#fbbf24]"></div>
                 <div className="text-right">
                    {brandLogo ? <img src={brandLogo} className="h-8 w-auto ml-auto" alt="" /> : <span className="text-xl font-black italic text-[#fbbf24]">{brandName}</span>}
                 </div>
              </div>

              <div className="max-w-[320px] space-y-4">
                 <div className="space-y-1">
                    <span className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest border-b border-[#fbbf24]/30 pb-1">COLEÇÃO EXCLUSIVA</span>
                    <h4 className={`${titleSize} font-extrabold uppercase italic tracking-tighter leading-[0.9] pt-2 text-white`}>{selectedSeries.name}</h4>
                 </div>
                 <p className="text-[10px] text-gray-200 font-medium border-l border-[#fbbf24] pl-3 leading-relaxed">
                    {selectedSeries.overview || 'O ápice do entretenimento digital direto na sua tela.'}
                 </p>
              </div>

              <div className="flex justify-between items-end">
                 <div className="text-[9px] font-black text-[#fbbf24] uppercase tracking-[0.2em]">
                    ASSINE: <span className="text-white">{contactInfo}</span>
                 </div>
                 <div className="w-10 h-10 border-b-2 border-r-2 border-[#fbbf24]"></div>
              </div>
           </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#141824] p-8 rounded-[32px] border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">GERADOR DE <span className="text-blue-500">SÉRIES</span></h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Crie artes de séries de sucesso em segundos</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-md group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome da série..."
            className="flex-1 bg-black/40 border border-gray-700 rounded-l-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all text-sm font-medium"
          />
          <button type="submit" className="bg-blue-600 px-8 rounded-r-2xl font-black uppercase text-xs italic tracking-widest hover:bg-blue-700 transition-all">
            {loading ? '...' : 'BUSCAR'}
          </button>
        </form>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">RESULTADOS</h3>
          {results.map((series) => (
            <button 
              key={series.id}
              onClick={() => setSelectedSeries(series)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all ${selectedSeries?.id === series.id ? 'bg-blue-600/10 border-blue-600 shadow-lg' : 'bg-[#141824] border-gray-800 hover:border-gray-600'}`}
            >
              <img src={series.poster_path ? `https://image.tmdb.org/t/p/w200${series.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster'} className="w-16 h-20 object-cover rounded-lg" alt="" />
              <div className="text-left">
                <p className="font-bold text-sm line-clamp-1">{series.name}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{series.first_air_date?.split('-')[0] || 'N/A'}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 flex flex-col items-center">
          {selectedSeries ? (
            <div className="w-full flex flex-col items-center">
              <div className="w-full max-w-[500px] mb-8 grid grid-cols-2 gap-4 bg-[#141824] p-6 rounded-[24px] border border-gray-800">
                <div className="col-span-2 flex gap-2 mb-2">
                  {SERIES_THEMES.map(t => (
                    <button key={t.id} onClick={() => setSelectedTheme(t)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedTheme.id === t.id ? 'bg-white text-black' : 'bg-black/20 text-gray-500'}`}>{t.label}</button>
                  ))}
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Branding (Logo ou Texto)</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={brandName} 
                      onChange={(e) => setBrandName(e.target.value.toUpperCase())} 
                      placeholder="NOME DA MARCA"
                      className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-xs font-bold focus:border-blue-500 outline-none" 
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        className="hidden" 
                        id="series-logo-upload"
                      />
                      <label 
                        htmlFor="series-logo-upload"
                        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-2 text-[10px] font-black uppercase cursor-pointer transition-all"
                      >
                        {brandLogo ? '📷 TROCAR LOGOTIPO' : '📷 ENVIAR LOGOTIPO'}
                      </label>
                      {brandLogo && (
                        <button 
                          onClick={() => setBrandLogo(null)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Site ou Telefone</label>
                  <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value.toUpperCase())} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-xs font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div ref={bannerRef} className="w-[500px] aspect-square bg-black relative overflow-hidden shadow-2xl">
                {renderBannerContent()}
              </div>

              <button onClick={downloadBanner} disabled={isDownloading} className="mt-8 w-[500px] py-6 rounded-3xl text-white font-black uppercase italic tracking-widest transition-all" style={{ backgroundColor: selectedTheme.color }}>
                {isDownloading ? 'GERANDO PNG...' : '📥 BAIXAR BANNER 4K'}
              </button>
            </div>
          ) : (
            <div className="py-40 opacity-20 text-center">
              <span className="text-8xl mb-6 block">📺</span>
              <p className="text-xl font-black uppercase italic">Selecione uma série</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeriesBanners;
