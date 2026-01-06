import React, { useState } from 'react';
import { generateVisual } from '../services/geminiService';

/**
 * Mapeamento de estilos para PROMPT TÉCNICO (funciona bem no SubNP / Flux)
 */
const STYLE_MAP: Record<string, string> = {
  "3D Moderno / Glassmorphism": "modern 3D logo, glassmorphism, soft reflections, clean surfaces",
  "Minimalista Flat Vector": "flat vector logo, minimal, clean lines, simple geometry",
  "Luxury / Gold & Black": "luxury logo, gold accents, black background, premium brand identity",
  "Cyberpunk Neon Concept": "cyberpunk logo, neon glow, futuristic, high contrast",
  "Mascot / Illustrated": "mascot logo, illustrated style, clean vector, friendly character"
};

const LogoGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [editPrompt, setEditPrompt] = useState('');

  const [brandName, setBrandName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [style, setStyle] = useState('3D Moderno / Glassmorphism');
  const [mainColor, setMainColor] = useState('#3b82f6');
  const [details, setDetails] = useState('');

  /**
   * 🔥 GERAÇÃO DE LOGO (PROMPT OTIMIZADO PARA DAR PESO AOS DETALHES)
   */
  const handleGenerateLogo = async () => {
    if (!brandName) {
      alert("Por favor, informe o nome da marca.");
      return;
    }

    setLoading(true);
    setGeneratedImageUrl(null);

    try {
      /**
       * O segredo aqui é colocar o 'details' logo no início.
       * Se o usuário escreveu algo detalhado, a IA prioriza isso.
       */
      const userInstructions = details 
        ? `CUSTOM DESIGN INSTRUCTIONS: ${details}.` 
        : `Style: ${STYLE_MAP[style]}.`;

      const prompt = `
LOGO DESIGN for "${brandName}".
${userInstructions}

Brand Name to display: "${brandName}"
${slogan ? `Subtitle/Slogan: "${slogan}"` : ''}
Primary Color: ${mainColor}

Technical Specs: 
Professional brand identity, centered, symmetrical, clean dark background, high resolution, sharp details, masterfully crafted typography.

Negative prompt: blurry, distorted text, extra letters, watermark, low quality, messy, photo, noisy.
`;

      const result = await generateVisual(prompt);

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

  /**
   * ✏️ EDIÇÃO / REFINAMENTO DE LOGO
   */
  const handleEditLogo = async () => {
    if (!generatedImageUrl || !editPrompt) return;

    setEditing(true);

    try {
      setHistory(prev => [...prev, generatedImageUrl]);

      const prompt = `
Modify this logo for "${brandName}".
New Change Requested: ${editPrompt}
Keep the same colors (${mainColor}) and brand name "${brandName}".
High quality professional logo.
`;

      const result = await generateVisual(prompt);

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
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            GERADOR DE <span className="text-blue-500">LOGOS PRO</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            POWERED BY SUBNP AI - MODELO FLUX
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-2xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase ml-2 mb-1 block">Nome da Marca</label>
              <input
                placeholder="Ex: Futebol"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase ml-2 mb-1 block">Slogan</label>
              <input
                placeholder="Ex: Amador"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase ml-2 mb-1 block">Estilo Visual</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold text-white"
            >
              {Object.keys(STYLE_MAP).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase ml-2 mb-1 block">Cor Principal</label>
            <div className="flex items-center gap-3 bg-black/40 border border-gray-700 rounded-2xl p-3">
              <input 
                type="color" 
                value={mainColor} 
                onChange={(e) => setMainColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
              />
              <span className="text-xs font-mono text-gray-400 uppercase">{mainColor}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase ml-2 mb-1 block">Detalhes (Opcional)</label>
            <textarea
              placeholder="Descreva exatamente o que quer ver na logo... (Ex: Um leão segurando uma bola, cores neon, estilo futurista)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full h-32 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm text-white resize-none"
            />
          </div>

          <button
            onClick={handleGenerateLogo}
            disabled={loading || editing}
            className="w-full py-5 rounded-2xl font-black uppercase text-sm bg-blue-600 hover:bg-blue-700 transition-colors text-white shadow-lg shadow-blue-900/20"
          >
            {loading ? 'GERANDO LOGO...' : 'GERAR LOGO PROFISSIONAL'}
          </button>
        </section>

        <section className="flex flex-col items-center justify-start py-4">
          {generatedImageUrl ? (
            <div className="w-full flex flex-col items-center">
              <div className="bg-[#141824] p-4 rounded-[40px] border border-gray-800 shadow-2xl">
                <img src={generatedImageUrl} className="w-96 h-96 object-contain rounded-3xl" alt="Logo Gerada" />
              </div>
              
              <div className="w-full max-w-md mt-8 space-y-4">
                <textarea
                  placeholder="Refinar design... (Ex: Mude o fundo para azul)"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm text-white h-20 resize-none"
                />
                
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={handleEditLogo} 
                    disabled={editing || !editPrompt}
                    className="py-3 bg-white text-black font-bold rounded-xl text-xs uppercase hover:bg-gray-200 transition-colors"
                  >
                    {editing ? '...' : 'Refinar'}
                  </button>
                  <button onClick={handleUndo} className="py-3 bg-gray-800 text-white font-bold rounded-xl text-xs hover:bg-gray-700 transition-colors">
                    Voltar
                  </button>
                  <button onClick={downloadLogo} className="py-3 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase hover:bg-blue-700 transition-colors">
                    Baixar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-96 h-96 border-2 border-dashed border-gray-800 rounded-[40px] flex items-center justify-center text-gray-700 text-center p-8">
              {loading ? (
                 <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-xs uppercase tracking-widest">Criando sua identidade visual...</p>
                 </div>
              ) : (
                <p className="font-bold text-xs uppercase tracking-widest">Aguardando seu comando para gerar...</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LogoGenerator;
