
import React, { useState } from 'react';
import { analyzeAd } from '../services/geminiService';

interface AnalysisResult {
  strengths: string[];
  improvements: string[];
  optimizedText: string;
  visualPrompt: string;
}

const AdAnalyzer: React.FC = () => {
  const [adText, setAdText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleRunAnalysis = async () => {
    if (!image) {
      alert("Por favor, envie uma imagem do anúncio.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Correção do erro TS2554: Passando os 2 argumentos esperados (image e text)
      const response = await analyzeAd(image, adText || "Anúncio de IPTV sem texto específico.");
      
      // A função analyzeAd retorna uma string que é um JSON (conforme configurado no GeminiService)
      if (typeof response === 'string') {
        const parsed = JSON.parse(response) as AnalysisResult;
        setResult(parsed);
      }
    } catch (err: any) {
      console.error(err);
      setError("Falha ao analisar o anúncio. Certifique-se de que a imagem é nítida.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-12">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          ANALISADOR DE <span className="text-blue-500">ANÚNCIOS IA</span>
        </h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
          Descubra como melhorar suas artes e textos para vender mais
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-xl space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">Imagem do Anúncio (Criativo)</label>
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
                className="w-full aspect-video bg-black/40 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center cursor-pointer group-hover:border-blue-500 transition-all overflow-hidden"
              >
                {image ? (
                  <img src={image} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="text-center">
                    <span className="text-4xl block mb-2">📸</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Clique para enviar arte</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">Texto Original (Opcional)</label>
            <textarea 
              value={adText} 
              onChange={(e) => setAdText(e.target.value)}
              placeholder="Cole aqui a legenda que você usa ou pretende usar..."
              className="w-full h-32 bg-black/40 border border-gray-700 rounded-2xl p-4 text-xs font-medium focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <button 
            onClick={handleRunAnalysis}
            disabled={loading || !image}
            className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all disabled:opacity-30"
          >
            {loading ? "IA ANALISANDO DESIGN..." : "ANALISAR MEU ANÚNCIO"}
          </button>
        </section>

        <section>
          {result ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#141824] p-6 rounded-3xl border border-gray-800">
                <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-4">✅ Pontos Fortes</h4>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-green-500">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#141824] p-6 rounded-3xl border border-gray-800">
                <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-4">⚠️ Oportunidades de Melhoria</h4>
                <ul className="space-y-2">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-yellow-500">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#141824] p-6 rounded-3xl border border-blue-600/30">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">💎 Texto Otimizado</h4>
                <p className="text-xs text-white font-medium leading-relaxed italic">"{result.optimizedText}"</p>
                <button 
                  onClick={() => { navigator.clipboard.writeText(result.optimizedText); alert("Texto copiado!"); }}
                  className="mt-4 text-[9px] font-black text-blue-500 uppercase hover:underline"
                >
                  Copiar Texto Otimizado
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[40px] text-center">
              <span className="text-3xl block mb-2">❌</span>
              <p className="text-red-500 text-xs font-black uppercase tracking-widest">{error}</p>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-gray-800 rounded-[40px] flex flex-col items-center justify-center text-center p-12 opacity-20">
              <span className="text-6xl mb-4">🔬</span>
              <p className="text-xs font-black uppercase tracking-widest">Aguardando envio para análise</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdAnalyzer;
