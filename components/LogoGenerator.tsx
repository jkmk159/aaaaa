
import React, { useState } from 'react';
import { generateVisual } from '../services/geminiService';

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
      const prompt = `Crie um logotipo profissional de alta qualidade para um servidor de ${industry}. Nome da Marca: ${brandName}. Slogan: ${slogan || 'Nenhum'}. Estilo Visual: ${style}. Cor Principal: ${mainColor}. Detalhes Adicionais: ${details}. O logo deve ser centralizado em um fundo limpo, alta resolução, estética premium de streaming moderno.`;

      const result = await generateVisual(prompt);

      if (result) {
        setGeneratedImageUrl(result);
      } else {
        alert("Falha ao gerar imagem via OpenRouter. Verifique sua chave ou saldo.");
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
      setHistory(prev => [...prev, generatedImageUrl]);
      
      const prompt = `Redesenhe ou edite este logotipo de IPTV: ${brandName}. Alteração solicitada: ${editPrompt}. Mantenha as cores e o estilo original, mas aplique a mudança. Estilo: ${style}.`;
      
      const result = await generateVisual(prompt, generatedImageUrl);

      if (result) {
        setGeneratedImageUrl(result);
        setEditPrompt('');
      } else {
        alert("Erro ao editar a logo via OpenRouter.");
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
    link.download = `LOGO_${brandName.toUpperCase().replace(/\s+/g, '_')}.png`;
    link.click();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-12">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          GERADOR DE <span className="text-blue-500">LOGOS PROFISSIONAIS</span>
        </h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Alimentado por OpenRouter / DALL-E 3</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Nome do Servidor" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all" />
            <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Slogan (Opcional)" className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all" />
          </div>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold appearance-none outline-none focus:border-blue-500">
            <option value="3D Moderno">3D Moderno</option>
            <option value="Minimalista Flat">Minimalista Flat</option>
            <option value="Futurista / Cyber">Futurista / Cyber</option>
            <option value="Emblema Retro">Emblema Retro</option>
          </select>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cor Principal:</label>
            <input type="color" value={mainColor} onChange={(e) => setMainColor(e.target.value)} className="flex-1 h-12 rounded-xl bg-black/20 border border-gray-700 cursor-pointer overflow-hidden" />
          </div>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Descreva detalhes como ícones (TV, foguete, luzes)..." className="w-full h-32 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm outline-none resize-none focus:border-blue-500 transition-all" />
          <button onClick={handleGenerateLogo} disabled={loading || editing} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-sm italic tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'SOLICITANDO AO OPENROUTER...' : 'GERAR LOGO PREMIUM'}
          </button>
        </section>
        <section className="flex flex-col items-center">
          <div className="w-full max-w-[450px] aspect-square bg-[#141824] rounded-[40px] border border-gray-800 border-dashed overflow-hidden flex items-center justify-center relative shadow-2xl">
            {generatedImageUrl ? <img src={generatedImageUrl} className="w-full h-full object-contain p-4" alt="Generated Logo" /> : <div className="text-center opacity-20"><span className="text-8xl block mb-4">🎨</span><p className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando Criação</p></div>}
            {(loading || editing) && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 animate-fade-in"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-[10px] font-black uppercase tracking-widest text-blue-500">A IA está desenhando...</p></div>}
          </div>
          {generatedImageUrl && !loading && (
            <div className="mt-8 w-full max-w-[450px] space-y-4 animate-fade-in">
              <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Deseja mudar algo? Ex: Mude o ícone para um leão..." className="w-full h-24 bg-black/40 border border-gray-700 rounded-2xl p-4 text-xs font-medium focus:border-blue-500 outline-none transition-all" />
              <div className="flex gap-2">
                <button onClick={handleEditLogo} className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] italic tracking-widest hover:bg-gray-200 transition-all">APLICAR EDIÇÃO</button>
                {history.length > 0 && <button onClick={handleUndo} className="bg-gray-800 px-6 rounded-xl text-lg hover:bg-gray-700 transition-all" title="Desfazer">↩</button>}
                <button onClick={downloadLogo} className="bg-blue-600 px-6 rounded-xl text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20" title="Baixar">📥</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LogoGenerator;
