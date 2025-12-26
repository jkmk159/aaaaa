
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const LogoGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]); // Histórico para o botão desfazer
  const [editPrompt, setEditPrompt] = useState('');
  
  // Estados do Formulário
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
    setHistory([]); // Limpa o histórico ao gerar uma nova logo do zero
    setEditPrompt('');

    try {
      // Fix: Use process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Crie um logotipo profissional de alta qualidade para um servidor de ${industry}.
      Nome da Marca: ${brandName}.
      Slogan: ${slogan || 'Nenhum'}.
      Estilo Visual: ${style}.
      Cor Principal: ${mainColor}.
      Detalhes Adicionais: ${details}.
      O logo deve ser centralizado em fundo sólido escuro ou transparente, com tipografia moderna e ícone representativo. 
      Evite textos pequenos ilegíveis. Alta resolução, estética premium, estilo SaaS/Tech.`;

      // Fix: Consistent usage of contents as an object with parts
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

      // Fix: Safe iteration through parts to find image data
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao gerar a logo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditLogo = async () => {
    if (!generatedImageUrl || !editPrompt) return;

    setEditing(true);
    try {
      // Fix: Use process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Salva a imagem atual no histórico antes de editar
      setHistory(prev => [...prev, generatedImageUrl]);
      
      // Extrair apenas o base64 do data URL
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
              text: `Edite esta logo conforme as seguintes instruções: ${editPrompt}. Mantenha a essência da marca ${brandName} mas aplique as mudanças solicitadas com perfeição técnica e estética premium.`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      // Fix: Safe iteration through parts to find image data
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
            setEditPrompt(''); // Limpa o prompt após editar
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao editar a logo. Verifique sua conexão ou tente um comando diferente.");
    } finally {
      setEditing(false);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const previousImage = history[history.length - 1];
    setGeneratedImageUrl(previousImage);
    setHistory(prev => prev.slice(0, -1)); // Remove a última imagem do histórico
  };

  const downloadLogo = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `LOGO_${brandName.replace(/\s+/g, '_').toUpperCase() || 'GERADA'}.png`;
    link.click();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-12">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          GERADOR DE <span className="text-blue-500">LOGOS PROFISSIONAIS</span>
        </h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
          Identidade visual instantânea para donos de servidores
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* FORMULÁRIO DE ESPECIFICAÇÃO */}
        <section className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome do Servidor</label>
              <input 
                type="text" 
                value={brandName} 
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ex: IPTV MASTER" 
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Slogan (Opcional)</label>
              <input 
                type="text" 
                value={slogan} 
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: O Melhor do Streaming" 
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estilo Visual</label>
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value="3D Moderno">3D Moderno</option>
                <option value="Minimalista">Minimalista</option>
                <option value="Futurista / Cyber">Futurista / Cyber</option>
                <option value="Luxo / Elegante">Luxo / Elegante</option>
                <option value="Mascote Cartoon">Mascote Cartoon</option>
                <option value="Tipográfico">Apenas Tipográfico</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cor Principal</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={mainColor}
                  onChange={(e) => setMainColor(e.target.value)}
                  className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-xl"
                />
                <input 
                  type="text" 
                  value={mainColor}
                  onChange={(e) => setMainColor(e.target.value)}
                  className="flex-1 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold uppercase"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Indústria / Nicho</label>
            <select 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all appearance-none"
            >
              <option value="IPTV & Streaming">IPTV & Streaming</option>
              <option value="Gaming & Esports">Gaming & Esports</option>
              <option value="Tecnologia & Software">Tecnologia & Software</option>
              <option value="Entretenimento">Entretenimento</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Detalhes da Logo (Ícones, Formas...)</label>
            <textarea 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Ex: Use um ícone de um foguete ou uma tela de TV estilizada. Quero algo que transmita velocidade..."
              className="w-full h-32 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-medium focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          <button 
            onClick={handleGenerateLogo}
            disabled={loading || editing}
            className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                CRIANDO SUA IDENTIDADE...
              </div>
            ) : 'GERAR NOVA LOGOTIPO'}
          </button>
        </section>

        {/* ÁREA DE PREVIEW / RESULTADO E EDIÇÃO */}
        <section className="flex flex-col items-center">
          <div className="w-full max-w-[450px] aspect-square bg-[#141824] rounded-[40px] border border-gray-800 border-dashed overflow-hidden flex items-center justify-center relative group shadow-2xl">
            {generatedImageUrl ? (
              <>
                <img src={generatedImageUrl} className="w-full h-full object-cover" alt="Logo Gerada" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={downloadLogo} className="bg-white text-black px-6 py-3 rounded-full font-black uppercase text-xs italic tracking-widest hover:scale-105 transition-all">
                    BAIXAR PNG
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center opacity-20 p-12">
                <span className="text-8xl mb-6 block">🎨</span>
                <p className="text-sm font-black uppercase italic tracking-[0.2em]">O preview da sua logo aparecerá aqui</p>
              </div>
            )}

            {(loading || editing) && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h4 className="text-xl font-black italic uppercase tracking-tight">
                  {loading ? 'Processando Design' : 'Aplicando Edições'}
                </h4>
                <p className="text-xs text-gray-500 font-bold uppercase mt-2 tracking-widest">
                  {loading ? 'A IA está desenhando cada detalhe para você...' : 'A IA está reformulando sua logo conforme solicitado...'}
                </p>
              </div>
            )}
          </div>

          {/* PAINEL DE EDIÇÃO IA (Aparece após gerar a logo) */}
          {generatedImageUrl && !loading && (
            <div className="mt-8 w-full max-w-[450px] space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-[#141824] p-6 rounded-[32px] border border-blue-500/20 shadow-xl">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xl">🪄</span>
                       <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Editor Inteligente</h3>
                    </div>
                    {/* BOTÃO DESFAZER */}
                    {history.length > 0 && (
                      <button 
                        onClick={handleUndo}
                        disabled={editing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-[9px] font-black uppercase tracking-widest text-gray-300 rounded-full transition-all active:scale-95 disabled:opacity-30"
                      >
                        <span>↩</span> Desfazer
                      </button>
                    )}
                 </div>
                 
                 <div className="space-y-3">
                    <textarea 
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="Peça para mudar algo: 'Remova o ícone de TV', 'Mude a cor do fundo para preto', 'Adicione um detalhe neon azul'..."
                      className="w-full h-24 bg-black/40 border border-gray-700 rounded-2xl p-4 text-xs font-medium focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-600"
                    />
                    
                    <button 
                      onClick={handleEditLogo}
                      disabled={editing || !editPrompt}
                      className="w-full bg-white text-black py-4 rounded-xl font-black uppercase italic tracking-widest text-[10px] hover:bg-gray-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      {editing ? 'MODIFICANDO...' : 'APLICAR MUDANÇAS NA LOGO'}
                    </button>
                 </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Design Customizável</p>
                <p className="text-[9px] text-gray-600 font-bold max-w-xs mx-auto">Você pode pedir edições ilimitadas nesta logo até ficar perfeita.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LogoGenerator;
