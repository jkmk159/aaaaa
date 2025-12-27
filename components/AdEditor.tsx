
import React, { useState } from 'react';
import { generateCaption } from '../services/geminiService';

const AdEditor: React.FC = () => {
  const [desc, setDesc] = useState('');
  const [captions, setCaptions] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCaptions = async () => {
    if (!desc) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateCaption(desc);
      setCaptions(res || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro desconhecido ao gerar legendas.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Legenda copiada para a área de transferência!");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-12">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          GERADOR DE <span className="text-blue-500">LEGENDAS IA</span>
        </h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
          Crie textos persuasivos para seus anúncios em segundos
        </p>
      </header>

      <div className="space-y-8">
        <section className="bg-[#141824] p-8 rounded-[32px] border border-gray-800 shadow-xl">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
            <span className="mr-3 text-xl">📝</span> O que você quer vender?
          </h3>
          
          <div className="space-y-6">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex: Promoção de 40 reais, todos os canais abertos, suporte 24h, teste grátis disponível..."
              className="w-full h-40 bg-black/40 border border-gray-700 rounded-2xl p-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-gray-600"
            />
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleGenerateCaptions}
              disabled={loading || !desc}
              className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase italic tracking-[0.2em] text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  CRIANDO LEGENDAS...
                </div>
              ) : (
                'GERAR LEGENDAS INTELIGENTES'
              )}
            </button>
          </div>
        </section>

        {captions && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#141824] border border-gray-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="bg-blue-600/10 px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Sugestões Geradas pela IA</span>
                <button 
                  onClick={() => copyToClipboard(captions)}
                  className="text-[10px] font-black uppercase text-white/50 hover:text-white transition-colors"
                >
                  Copiar Tudo
                </button>
              </div>
              
              <div className="p-8">
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-sm font-medium">
                    {captions}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-black/20 text-center">
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  Dica: Use essas legendas no Instagram, WhatsApp e Facebook Ads
                </p>
              </div>
            </div>
          </section>
        )}

        {!captions && !loading && !error && (
          <div className="py-20 text-center opacity-20 border-2 border-dashed border-gray-800 rounded-[32px]">
            <span className="text-6xl mb-4 block">🤖</span>
            <p className="text-sm font-black uppercase italic tracking-widest">Aguardando sua descrição...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdEditor;
