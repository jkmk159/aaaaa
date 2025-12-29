
import React, { useState } from 'react';
import { analyzeAd, generateVisual } from '../services/geminiService';

interface AdAnalysis {
  strengths: string[];
  improvements: string[];
  optimizedText: string;
  visualPrompt: string;
}

const AdAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [adText, setAdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [analysis, setAnalysis] = useState<AdAnalysis | null>(null);
  const [suggestedImage, setSuggestedImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      alert("Por favor, envie uma imagem do seu anúncio.");
      return;
    }
    setLoading(true);
    setAnalysis(null);
    setSuggestedImage(null);
    
    try {
      // Passo 1: Analisar anúncio com Gemini Vision
      // Corrigido: Passando como objeto para satisfazer a assinatura da função
      const result = await analyzeAd({ imageBuffer: image, text: adText });
      if (result) {
        const parsed = JSON.parse(result);
        setAnalysis(parsed);
        setLoading(false);

        // Passo 2: Gerar nova imagem baseada na análise usando SubNP
        
setGeneratingVisual(true);
const visualUrl = await generateVisual(parsed.visualPrompt);
setSuggestedImage(visualUrl);



      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro no processo de IA: ${err.message || "Tente novamente."}`);
      setLoading(false);
    } finally {
      setGeneratingVisual(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado com sucesso!");
  };

  const downloadSuggested = () => {
    if (!suggestedImage) return;
    const link = document.createElement('a');
    link.href = suggestedImage;
    link.download = "CRIATIVO_OTIMIZADO_SUBNP.png";
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#141824] p-8 rounded-[40px] border border-gray-800">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            ANALISADOR DE <span className="text-blue-500">PERFORMANCE</span>
          </h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
            Auditoria via Gemini & Redesign via SubNP AI
          </p>
        </div>
        {(analysis || loading) && (
          <button onClick={() => { setAnalysis(null); setSuggestedImage(null); }} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            Nova Análise
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* INPUT SECTION */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-xl space-y-6 sticky top-24">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span>🖼️</span> SEU ANÚNCIO ATUAL
              </h3>
              
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  id="ad-image-upload" 
                />
                <label 
                  htmlFor="ad-image-upload" 
                  className="w-full aspect-square bg-black/40 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden"
                >
                  {image ? (
                    <img src={image} className="w-full h-full object-contain" alt="Preview" />
                  ) : (
                    <div className="text-center opacity-30">
                      <span className="text-5xl block mb-3">📤</span>
                      <p className="text-[10px] font-black uppercase tracking-widest">Subir imagem para otimizar</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span>📝</span> TEXTO ATUAL
              </h3>
              <textarea 
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                placeholder="Informe o texto que você usa neste anúncio..."
                className="w-full h-28 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-medium focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={loading || generatingVisual || !image}
              className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 active:scale-95"
            >
              {loading || generatingVisual ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {loading ? 'GEMINI ANALISANDO...' : 'SUBNP REDESIGN...'}
                </div>
              ) : 'ANALISAR & REIMAGINAR'}
            </button>
          </div>
        </section>

        {/* RESULTS SECTION */}
        <section className="lg:col-span-7">
          {analysis ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
              
              {/* GRID DE PONTOS FORTES E MELHORIAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-[32px] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Pontos Fortes</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2">
                        <span className="text-green-500 opacity-50">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-[32px] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">A Melhorar</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.improvements.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2">
                        <span className="text-orange-500 opacity-50">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* TEXTO OTIMIZADO */}
              <div className="bg-[#141824] border border-gray-800 rounded-[32px] overflow-hidden shadow-xl">
                <div className="bg-blue-600/10 px-8 py-5 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✍️</span>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Nova Copy (Gemini)</h4>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(analysis.optimizedText)}
                    className="text-[9px] font-black uppercase bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all"
                  >
                    Copiar Texto
                  </button>
                </div>
                <div className="p-8">
                  <p className="text-sm text-gray-200 leading-relaxed font-medium italic whitespace-pre-line">
                    "{analysis.optimizedText}"
                  </p>
                </div>
              </div>

              {/* IMAGEM SUGERIDA (REIMAGINADA) */}
              <div className="bg-[#141824] border border-gray-800 rounded-[32px] overflow-hidden shadow-xl">
                <div className="bg-purple-600/10 px-8 py-5 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎨</span>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Redesign (SubNP AI)</h4>
                  </div>
                  {suggestedImage && (
                    <button 
                      onClick={downloadSuggested}
                      className="text-[9px] font-black uppercase bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full transition-all"
                    >
                      Baixar Redesign
                    </button>
                  )}
                </div>
                <div className="p-8">
                  <div className="relative aspect-square bg-black/40 rounded-2xl border border-white/5 overflow-hidden group">
                    {generatingVisual ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm space-y-4">
                         <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 px-12 text-center">
                           A SubNP está gerando uma nova versão profissional...
                         </p>
                      </div>
                    ) : suggestedImage ? (
                      <img src={suggestedImage} className="w-full h-full object-cover" alt="Redesign sugerido" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <span className="text-6xl">🎨</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> IA OTIMIZADA</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> DESIGN ELEVADO</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> BRANDING MANTIDO</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[500px] border-2 border-dashed border-gray-800 rounded-[40px] flex flex-col items-center justify-center text-center p-12 bg-black/10">
               <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center text-4xl mb-6 animate-pulse">🔍</div>
               <h3 className="text-xl font-black uppercase italic tracking-tight text-gray-400">Auditorias Híbridas</h3>
               <p className="text-xs text-gray-600 font-bold uppercase mt-2 tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                 Análise estrutural via Gemini Vision e redesign visual de alta qualidade via SubNP Flux.
               </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdAnalyzer;
