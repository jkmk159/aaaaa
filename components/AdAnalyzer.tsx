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

  const [imageProvider, setImageProvider] = useState<
    "subnp" | "huggingface"
  >("subnp");

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
      // PASSO 1 — ANALISAR
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

      // PASSO 2 — GERAR IMAGEM
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
    <div className="p-8 max-w-7xl mx-auto">

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

        {/* INPUT */}
        <section className="lg:col-span-5">
          <div className="bg-[#141824] p-6 rounded-[32px] border border-gray-800 space-y-6">

            {/* IMAGEM */}
            <div>
              <h3 className="text-xs font-black uppercase mb-2">🖼️ Anúncio</h3>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {image && (
                <img
                  src={image}
                  alt="Preview"
                  className="mt-4 rounded-xl"
                />
              )}
            </div>

            {/* TEXTO */}
            <div>
              <h3 className="text-xs font-black uppercase mb-2">📝 Texto</h3>
              <textarea
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                className="w-full h-28 bg-black/40 border border-gray-700 rounded-xl p-4"
              />
            </div>

            {/* IA */}
            <div>
