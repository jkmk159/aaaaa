
import React, { useState } from 'react';
import { generateVisual, generateLogoOpenAI } from '../services/geminiService';

const LogoGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [useOpenAI, setUseOpenAI] = useState(true);
  
  const [brandName, setBrandName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [style, setStyle] = useState('3D Moderno / Glassmorphism');
  const [mainColor, setMainColor] = useState('#3b82f6');
  const [industry, setIndustry] = useState('IPTV & Streaming');
  const [details, setDetails] = useState('');

  const handleGenerateLogo = async () => {
    if (!brandName) {
      alert("Por favor, informe o nome do servidor.");
      return;
    }

    setLoading(true);
    setGeneratedImageUrl(null);

    try {
      // Prompt aprimorado para resultados profissionais
      const prompt = `Professional high-end minimalist logo for an IPTV brand named "${brandName}". 
      Primary Text: "${brandName}". Style: ${style}. Main Color Theme: ${mainColor}. 
      Industry Context: ${industry}. Slogan/Subtext: "${slogan || ''}". Additional Details: ${details}. 
      Ensure perfect typography, flat vector design or high-quality 3D as specified, centered on a clean dark or neutral background. 
      Masterpiece, 4k resolution, symmetrical, no distorted text.`;

      let result;
      if (useOpenAI) {
        result = await generateLogoOpenAI(prompt);
      } else {
        result = await generateVisual(prompt);
      }

      if (result) {
        setGeneratedImageUrl(result);
      } else {
        alert("A IA não retornou uma imagem no momento.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro na Geração: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLogo = async () => {
    if (!generatedImageUrl || !editPrompt) return;
    setEditing(true);
    try {
      setHistory(prev => [...prev, generatedImageUrl]);
      const prompt = `Take the previous logo for "${brandName}" and apply these modifications: ${editPrompt}. 
      Maintain the original style, font, and color identity. Professional polish, high resolution.`;
      
      let result;
      if (useOpenAI) {
        result = await generateLogoOpenAI(prompt);
      } else {
        result = await generateVisual(prompt);
      }
      
      if (result) {
        setGeneratedImageUrl(result);
        setEditPrompt('');
      }
    } catch (err: any) {
      alert("Erro ao editar: " + err.message);
    } finally {
      setEditing(false);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousImage = history[history.length - 1];
    setGeneratedImageUrl(previousImage);
    setHistory(prev => prev.slice(0, -1));
  };

  const downloadLogo = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `LOGO_${brandName.replace(/\s+/g, '_')}.png`;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            GERADOR DE <span className="text-blue-500">LOGOS PRO</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            QUALIDADE CINEMATOGRÁFICA COM {useOpenAI ? 'OPENAI DALL-E 3' : 'SUBNP FLUX'}
          </p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-2xl border border-gray-800">
           <button 
            onClick={() => setUseOpenAI(false)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!useOpenAI ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
           >
             Flux Standard
           </button>
           <button 
            onClick={() => setUseOpenAI(true)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${useOpenAI ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
           >
             OpenAI Ultra
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Nome da Marca</label>
              <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ex: Master IPTV" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Slogan</label>
              <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Ex: O Melhor do Cinema" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Estilo Visual</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold appearance-none outline-none focus:border-blue-500">
              <option value="3D Moderno / Glassmorphism">3D Moderno / Glassmorphism</option>
              <option value="Minimalista Flat Vector">Minimalista Flat Vector</option>
              <option value="Luxury / Gold & Black">Luxury / Gold & Black</option>
              <option value="Cyberpunk Neon Concept">Cyberpunk Neon Concept</option>
              <option value="Mascot / Illustrated">Mascot / Illustrated</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cor Principal:</label>
            <input type="color" value={mainColor} onChange={(e) => setMainColor(e.target.value)} className="w-16 h-12 rounded-xl bg-black/20 border border-gray-700 cursor-pointer overflow-hidden" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Instruções Extras (Prompt)</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Ex: Use um ícone circular, estilo gradiente suave..." className="w-full h-32 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm outline-none resize-none focus:border-blue-500 transition-all font-medium" />
          </div>
          <button 
            onClick={handleGenerateLogo} 
            disabled={loading || editing} 
            className={`w-full py-5 rounded-2xl font-black uppercase text-sm italic tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${useOpenAI ? 'bg-blue-600 shadow-blue-900/20' : 'bg-purple-600 shadow-purple-900/20'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                PROCESSANDO VIA {useOpenAI ? 'OPENAI' : 'SUBNP'}...
              </div>
            ) : `GERAR LOGO ${useOpenAI ? 'ULTRA (DALL-E 3)' : 'PROFISSIONAL'}`}
          </button>
        </section>

        <section className="flex flex-col items-center">
          <div className="w-full max-w-[450px] aspect-square bg-[#141824] rounded-[40px] border border-gray-800 border-dashed overflow-hidden flex items-center justify-center relative shadow-2xl">
            {generatedImageUrl ? (
              <div className="relative w-full h-full p-4 animate-fade-in">
                <img src={generatedImageUrl} className="w-full h-full object-contain" alt="Generated Logo" crossOrigin="anonymous" />
                <div className="absolute top-6 right-6">
                  <span className="bg-blue-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-lg">
                    {useOpenAI ? 'DALL-E 3 HD' : 'FLUX AI'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-20">
                <span className="text-8xl block mb-4">🎨</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando Criação</p>
              </div>
            )}
            {(loading || editing) && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">
                  {useOpenAI ? 'Renderizando via OpenAI API...' : 'Processando via SubNP...'}
                </p>
              </div>
            )}
          </div>
          
          {generatedImageUrl && !loading && (
            <div className="mt-8 w-full max-w-[450px] space-y-4 animate-fade-in">
              <div className="bg-[#141824] p-6 rounded-3xl border border-gray-800">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 block">O que você quer mudar?</label>
                <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Ex: Mude a fonte para algo mais futurista..." className="w-full h-20 bg-black/20 border border-gray-700 rounded-2xl p-4 text-xs font-medium focus:border-blue-500 outline-none resize-none" />
                <div className="flex gap-2 mt-4">
                  <button onClick={handleEditLogo} className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] italic tracking-widest hover:bg-gray-200 transition-all">REFINAR DESIGN</button>
                  <button onClick={handleUndo} disabled={history.length === 0} className="px-4 rounded-xl bg-gray-800 text-white disabled:opacity-20">↩</button>
                  <button onClick={downloadLogo} className="bg-blue-600 px-6 rounded-xl text-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">📥</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LogoGenerator;
