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
  const [industry] = useState('IPTV & Streaming');
  const [details, setDetails] = useState('');

  /**
   * 🔥 GERAÇÃO DE LOGO (PROMPT OTIMIZADO)
   */
  const handleGenerateLogo = async () => {
    if (!brandName) {
      alert("Por favor, informe o nome do servidor.");
      return;
    }

    setLoading(true);
    setGeneratedImageUrl(null);

    try {
      /**
       * PROMPT PROFISSIONAL
       * - Estruturado
       * - Funciona bem em SubNP (Flux) e OpenAI
       */
      const prompt = `
LOGO DESIGN, BRAND IDENTITY.

Subject:
Professional IPTV logo for brand name "${brandName}".

Style:
${STYLE_MAP[style]}.
Modern, clean, professional logo.

Colors:
Primary color ${mainColor}.
Balanced color harmony, strong contrast.

Composition:
Centered logo.
Symmetrical layout.
Icon + brand name.
Clean dark or neutral background.

Text Rules:
Exact readable text "${brandName}".
${slogan ? `Optional subtitle "${slogan}" smaller and subtle.` : ''}
No spelling errors.

Design Rules:
Logo only (not poster, not banner).
Vector-style OR clean 3D (never both).
Sharp edges, clean shapes.
No distortion.

Extra Instructions:
${details || 'None'}

Negative:
blurry, distorted text, extra letters, watermark,
low quality, messy design, illustration, photo,
background clutter, noise, artifacts
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
Refine the existing IPTV logo for brand "${brandName}".

Keep:
Same typography style.
Same colors.
Same logo structure.

Modify:
${editPrompt}

Rules:
Professional logo design.
High clarity.
No new symbols unless requested.
No text distortion.

Negative:
blur, artifacts, extra text, wrong spelling
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
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          GERADOR DE <span className="text-blue-500">LOGOS PRO</span>
        </h2>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
          QUALIDADE PROFISSIONAL COM SUBNP FLUX
        </p>
      </div>
    </header>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-2xl space-y-6">
          <input
            placeholder="Nome da Marca"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold"
          />

          <input
            placeholder="Slogan (opcional)"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold"
          />

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold"
          >
            {Object.keys(STYLE_MAP).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <textarea
            placeholder="Instruções extras (opcional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full h-28 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm"
          />

          <button
            onClick={handleGenerateLogo}
            disabled={loading || editing}
            className="w-full py-5 rounded-2xl font-black uppercase text-sm bg-blue-600"
          >
            {loading ? 'GERANDO LOGO...' : 'GERAR LOGO'}
          </button>
        </section>

        <section className="flex flex-col items-center">
          {generatedImageUrl && (
            <>
              <img src={generatedImageUrl} className="w-80 h-80 object-contain" />
              <div className="flex gap-2 mt-4">
                <button onClick={handleEditLogo} className="px-4 py-2 bg-white text-black rounded-xl">
                  Refinar
                </button>
                <button onClick={handleUndo} className="px-4 py-2 bg-gray-700 text-white rounded-xl">
                  ↩
                </button>
                <button onClick={downloadLogo} className="px-4 py-2 bg-blue-600 text-white rounded-xl">
                  Baixar
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default LogoGenerator;
