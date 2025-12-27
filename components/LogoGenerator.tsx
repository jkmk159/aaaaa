
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const LogoGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  
  const [brandName, setBrandName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [style, setStyle] = useState('3D Moderno');
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
    setHistory([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Crie um logotipo profissional de alta qualidade para um servidor de ${industry}. Nome da Marca: ${brandName}. Slogan: ${slogan || 'Nenhum'}. Estilo Visual: ${style}. Cor Principal: ${mainColor}. Detalhes Adicionais: ${details}. O logo deve ser centralizado, alta resolução, estética premium.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImageUrl(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao gerar a logo.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditLogo = async () => {
    if (!generatedImageUrl || !editPrompt) return;
    setEditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      setHistory(prev => [...prev, generatedImageUrl]);
      const base64Image = generatedImageUrl.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/png'
              }
            },
            {
              text: `Edite esta logo conforme: ${editPrompt}. Mantenha a essência da marca ${brandName}.`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImageUrl(`data:image/png;base64,${part.inlineData.data}`);
            setEditPrompt('');
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao editar a logo.");
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
    link.download = `LOGO_${brandName.toUpperCase()}.png`;
    link.click();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-12">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          GERADOR DE <span className="text-blue-500">LOGOS PROFISSIONAIS</span>
        </h2>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Nome do Servidor" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
            <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Slogan (Opcional)" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" />
          </div>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold appearance-none">
            <option value="3D Moderno">3D Moderno</option>
            <option value="Minimalista">Minimalista</option>
            <option value="Futurista">Futurista</option>
          </select>
          <input type="color" value={mainColor} onChange={(e) => setMainColor(e.target.value)} className="w-full h-12 rounded-xl bg-transparent border-none cursor-pointer" />
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Mais detalhes..." className="w-full h-32 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm outline-none resize-none" />
          <button onClick={handleGenerateLogo} disabled={loading || editing} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-sm disabled:opacity-50">
            {loading ? 'GERANDO...' : 'GERAR LOGO'}
          </button>
        </section>
        <section className="flex flex-col items-center">
          <div className="w-full max-w-[450px] aspect-square bg-[#141824] rounded-[40px] border border-gray-800 border-dashed overflow-hidden flex items-center justify-center relative shadow-2xl">
            {generatedImageUrl ? <img src={generatedImageUrl} className="w-full h-full object-cover" /> : <span className="text-4xl opacity-20">🎨</span>}
            {(loading || editing) && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}
          </div>
          {generatedImageUrl && !loading && (
            <div className="mt-8 w-full max-w-[450px] space-y-4">
              <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Peça edições..." className="w-full h-24 bg-black/40 border border-gray-700 rounded-2xl p-4 text-xs" />
              <div className="flex gap-2">
                <button onClick={handleEditLogo} className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase text-[10px]">APLICAR</button>
                {history.length > 0 && <button onClick={handleUndo} className="bg-gray-800 px-4 rounded-xl text-xs">↩</button>}
                <button onClick={downloadLogo} className="bg-blue-600 px-4 rounded-xl text-xs">📥</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LogoGenerator;
