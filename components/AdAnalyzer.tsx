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

  const [imageProvider, setImageProvider] = useState<"subnp" | "huggingface">("subnp");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) {
      alert("Envie uma imagem primeiro.");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setSuggestedImage(null);

    try {
      const result = await analyzeAd({
        imageBuffer: image,
        text: adText,
      });

      const cleanJson = result
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed: AdAnalysis = JSON.parse(cleanJson);
      setAnalysis(parsed);
      setLoading(false);

      setGeneratingVisual(true);
      const visualUrl = await generateVisual(
        parsed.visualPrompt,
        imageProvider
      );
      setSuggestedImage(visualUrl);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro no processo");
      setLoading(false);
    } finally {
      setGeneratingVisual(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      {/* HEADER */}
      <header className="mb-10 bg-[#141824] p-8 rounded-[32px] border border-gray-800">
        <h2 className="text-3xl font-black uppercase italic">
          ANALISADOR DE <span className="text-blue-500">PERFORMANCE</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Gemini Vision + IA de Imagem
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUT SECTION */}
        <section className="lg:col-span-5">
          <div className="bg-[#141824] p-6 rounded-[32px] border border-gray-800 space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase mb-2">🖼️ Anúncio</h3>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {image && (
                <img src={image} alt="Preview" className="mt-4 rounded-xl w-full border border-gray-700" />
              )}
            </div>

            <div>
              <h3 className="text-xs font-black uppercase mb-2">📝 Texto</h3>
              <textarea
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                placeholder="Insira a copy do anúncio..."
                className="w-full h-28 bg-black/40 border border-gray-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-4 rounded-xl font-bold uppercase transition-all"
            >
              {loading ? "Analisando..." : "Analisar Performance"}
            </button>
          </div>
        </section>

        {/* RESULTS SECTION */}
        <section className="lg:col-span-7 space-y-6">
          {analysis && (
            <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-green-500 text-xs font-black uppercase mb-4">Pontos Fortes</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                    {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="text-yellow-500 text-xs font-black uppercase mb-4">Melhorias</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                    {analysis.improvements.map((im, i) => <li key={i}>{im}</li>)}
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-800">
                <h3 className="text-blue-500 text-xs font-black uppercase mb-2">Copy Otimizada</h3>
                <p className="bg-black/20 p-4 rounded-xl italic text-gray-200">"{analysis.optimizedText}"</p>
              </div>

              <div className="pt-6 border-t border-gray-800">
                <h3 className="text-purple-500 text-xs font-black uppercase mb-4">Nova Sugestão Visual</h3>
                {generatingVisual ? (
                  <div className="animate-pulse bg-gray-800 h-64 rounded-xl flex items-center justify-center">
                    <p className="text-gray-400">Gerando imagem pela IA...</p>
                  </div>
                ) : suggestedImage && (
                  <img src={suggestedImage} alt="Sugestão IA" className="rounded-xl w-full" />
                )}
              </div>
            </div>
          )}

          {!analysis && !loading && (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-800 rounded-[32px] p-12 text-gray-600">
              Aguardando análise para mostrar os resultados...
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdAnalyzer;
