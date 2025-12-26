
import React, { useState, useRef } from 'react';
import { searchMovies } from '../services/apiService';
import { TMDBMovie } from '../types';
import html2canvas from 'html2canvas';

const MOVIE_THEMES = [
  { id: 'netflix', label: 'Estilo Stream', color: '#e50914' },
  { id: 'imax', label: 'Premium Dark', color: '#60a5fa' },
  { id: 'gold', label: 'Premium Gold', color: '#fbbf24' },
];

const MovieBanners: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(MOVIE_THEMES[0]);
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
      const movies = await searchMovies(query);
      setResults(movies.slice(0, 8));
      if (movies.length > 0) setSelectedMovie(movies[0]);
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
      link.download = `BANNER_FILME_${selectedMovie?.title.replace(/\s+/g, '_')}.png`;
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
    if (!selectedMovie) return null;

    const titleSize = getTitleStyle(selectedMovie.title);

    // LAYOUT 1: ESTILO STREAM (NETFLIX)
    if (selectedTheme.id === 'netflix') {
      return (
        <>
          <img src={`https://image.tmdb.org/t/p/original${selectedMovie.poster_path}`} className="absolute inset-0 w-full h-full object-cover opacity-70" crossOrigin="anonymous" alt="" />
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
            <div className="space-y-3 text-left">
              <div className="flex gap-2">
                <span style={{ backgroundColor: selectedTheme.color }} className="px-2 py-0.5 rounded text-[8px] font-black italic uppercase tracking-widest">LANÇAMENTO</span>
                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black italic uppercase tracking-widest border border-white/10">4K ULTRA HD</span>
              </div>
              <h4 className={`${titleSize} font-black uppercase italic tracking-tighter leading-[0.9] text-white`}>{selectedMovie.title}</h4>
              <p className="text-[10px] text-gray-200 leading-snug drop-shadow-md font-medium">
                {selectedMovie.overview || "Sinopse não disponível."}
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50 italic">ASSISTA AGORA</span>
                <span className="text-[9px] font-black italic" style={{ color: selectedTheme.color }}>{contactInfo}</span>
              </div>
            </div>
          </div>
        </>
      );
    }

    // LAYOUT 2: PREMIUM DARK (NOIR TECH)
    if (selectedTheme.id === 'imax') {
      return (
        <div className="w-full h-full bg-[#050505] relative overflow-hidden flex">
          <div className="absolute right-0 top-0 w-full h-full">
            <img src={`https://image.tmdb.org/t/p/original${selectedMovie.poster_path}`} className="w-full h-full object-cover opacity-50" crossOrigin="anonymous" alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="w-6 h-1 bg-blue-500 mb-2"></div>
                {brandLogo ? (
                  <img src={brandLogo} className="h-6 w-auto object-contain" alt="" />
                ) : (
                  <span className="text-xs font-black tracking-[0.2em] text-white/80 italic">{brandName}</span>
                )}
              </div>
            </div>

            <div className="max-w-[340px] space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/30 px-1.5 py-0.5 rounded-sm">EXCLUSIVE</span>
                   <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{selectedMovie.release_date?.split('-')[0]}</span>
                </div>
                <h4 className={`${titleSize} font-black uppercase tracking-tighter leading-[0.9] text-white drop-shadow-2xl`}>
                  {selectedMovie.title}
                </h4>
              </div>
              
              <div className="h-px w-10 bg-white/20"></div>
              
              <p className="text-[10px] text-gray-300 font-bold leading-relaxed uppercase tracking-wide">
                {selectedMovie.overview || 'EXPERIÊNCIA CINEMATOGRÁFICA EM ALTA DEFINIÇÃO.'}
              </p>
            </div>

            <div className="flex items-end justify-between border-t border-white/5 pt-3">
              <div>
                <p className="text-[11px] font-black text-white italic tracking-tighter">{contactInfo}</p>
                <p className="text-[6px] font-black text-gray-600 uppercase tracking-[0.2em]">PREMIUM STREAMING</p>
              </div>
              <div className="text-right">
                 <span className="text-white font-black text-lg italic">{selectedMovie.vote_average.toFixed(1)}<span className="text-[9px] text-blue-500 ml-1">★</span></span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // LAYOUT 3: PREMIUM GOLD
    if (selectedTheme.id === 'gold') {
      return (
        <div className="w-full h-full flex items-center justify-center p-5 bg-black">
          <div className="absolute inset-3 border border-[#fbbf24]/30 pointer-events-none"></div>
          
          <img src={`https://image.tmdb.org/t/p/original${selectedMovie.poster_path}`} className="absolute inset-0 w-full h-full object-cover opacity-60" crossOrigin="anonymous" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>

          <div className="relative z-10 w-full h-full flex flex-col justify-between p-6">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <div className="text-[#fbbf24]">
                    {brandLogo ? <img src={brandLogo} className="h-6 w-auto" alt="" /> : <span className="text-base font-black italic">{brandName}</span>}
                 </div>
               </div>
            </div>

            <div className="max-w-[320px] space-y-3">
               <h4 className={`${titleSize} font-black uppercase tracking-tighter leading-[0.9] text-white italic`}>
                  {selectedMovie.title}
               </h4>
               <div className="h-px w-16 bg-[#fbbf24]"></div>
               <p className="text-[10px] text-gray-200 font-bold leading-snug drop-shadow-md uppercase italic tracking-wide">
                  {selectedMovie.overview || 'EXPERIÊNCIA CINEMATOGRÁFICA DE LUXO.'}
               </p>
            </div>

            <div className="flex items-end justify-between">
               <div className="bg-[#fbbf24] text-black p-3 rounded-tr-2xl">
                  <p className="text-[10px] font-black uppercase italic tracking-tighter">{contactInfo}</p>
                  <p className="text-[6px] font-black uppercase opacity-60 leading-none">CATÁLOGO EXCLUSIVO</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-[#fbbf24] uppercase tracking-widest">4K DOLBY VISION</p>
               </div>
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
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">GERADOR DE <span className="text-blue-500">FILMES</span></h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Crie artes de lançamentos em segundos</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-md group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do filme..."
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
          {results.map((movie) => (
            <button 
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all ${selectedMovie?.id === movie.id ? 'bg-blue-600/10 border-blue-600 shadow-lg' : 'bg-[#141824] border-gray-800 hover:border-gray-600'}`}
            >
              <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} className="w-16 h-20 object-cover rounded-lg" alt="" />
              <div className="text-left">
                <p className="font-bold text-sm line-clamp-1">{movie.title}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{movie.release_date?.split('-')[0]}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 flex flex-col items-center">
          {selectedMovie ? (
            <div className="w-full flex flex-col items-center">
              <div className="w-full max-w-[500px] mb-8 grid grid-cols-2 gap-4 bg-[#141824] p-6 rounded-[24px] border border-gray-800">
                <div className="col-span-2 flex gap-2 mb-2">
                  {MOVIE_THEMES.map(t => (
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
                        id="movie-logo-upload"
                      />
                      <label 
                        htmlFor="movie-logo-upload"
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
              <span className="text-8xl mb-6 block">🎞️</span>
              <p className="text-xl font-black uppercase italic">Selecione um filme</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieBanners;
