
import React, { useState, useEffect } from 'react';
import { generateBulkCopies } from '../services/geminiService';

const THEMES = [
  { id: "final", title: "Copy para Cliente Final", icon: "👤" },
  { id: "revenda", title: "Copy para Revendedores", icon: "🤝" },
  { id: "sumido", title: "Copy para Cliente Sumido", icon: "👻" },
  { id: "aumento", title: "Copy para Aumento de Preço", icon: "📈" }
];

const SalesCopy: React.FC = () => {
  const [formData, setFormData] = useState({
    server: '',
    agent: '',
    price: '',
    period: 'mensal'
  });

  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [copies, setCopies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateBulkCopies(activeTheme.title, formData);
      setCopies(result);
    } catch (err) {
      alert("Erro ao gerar cópias premium.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado com sucesso! 🚀");
  };

  const filteredCopies = copies.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            BIBLIOTECA DE <span className="text-blue-500">COPYS PREMIUM</span>
          </h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
            20 variações de textos trabalhados e profissionais por tema
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl">
              <span className="text-blue-500 font-black text-xs uppercase tracking-widest">IA ESPECIALISTA</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* CONFIGURAÇÕES E TEMAS */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-xl space-y-6 sticky top-24">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <span>⚙️</span> PERSONALIZAÇÃO DOS DADOS
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <input 
                  type="text" 
                  value={formData.server}
                  onChange={(e) => setFormData({...formData, server: e.target.value})}
                  placeholder="Nome do seu Servidor"
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-xs font-bold focus:border-blue-500 outline-none transition-all"
                />
                <input 
                  type="text" 
                  value={formData.agent}
                  onChange={(e) => setFormData({...formData, agent: e.target.value})}
                  placeholder="Seu Nome de Atendente"
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-xs font-bold focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="Preço Sugerido R$"
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-xs font-bold focus:border-blue-500 outline-none transition-all"
                />
                <select 
                  value={formData.period}
                  onChange={(e) => setFormData({...formData, period: e.target.value})}
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-xs font-bold focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="mensal">Mensal</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>

            <hr className="border-gray-800" />

            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">ESCOLHA O TEMA</h3>
              <div className="grid grid-cols-1 gap-2">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => { setActiveTheme(theme); setCopies([]); }}
                    className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      activeTheme.id === theme.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-black/20 text-gray-500 hover:bg-gray-800 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="text-lg">{theme.icon}</span>
                    {theme.title}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !formData.server}
              className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  CRIANDO 20 COPYS ELABORADAS...
                </div>
              ) : 'GERAR 20 VARIAÇÕES AGORA'}
            </button>
          </div>
        </aside>

        {/* LISTAGEM DE COPYS */}
        <main className="lg:col-span-8 space-y-6">
          {copies.length > 0 && (
            <div className="sticky top-24 z-10">
              <input 
                type="text"
                placeholder="🔍 Filtrar mensagens (ex: lucro, estabilidade, suporte)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141824] border border-gray-800 rounded-3xl p-6 text-sm font-bold focus:border-blue-500 outline-none shadow-2xl"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="py-40 text-center animate-pulse">
                <div className="text-6xl mb-6">🖋️</div>
                <h3 className="text-xl font-black uppercase italic text-gray-400 tracking-tight">Redigindo textos de alta conversão...</h3>
                <p className="text-xs text-gray-600 font-bold uppercase mt-2 tracking-[0.2em]">Aguarde enquanto nossa IA elabora argumentos persuasivos.</p>
              </div>
            ) : copies.length > 0 ? (
              filteredCopies.map((copy, idx) => (
                <div key={idx} className="bg-[#141824] border border-gray-800 rounded-[32px] overflow-hidden hover:border-blue-500/50 transition-all shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-gray-800/20 px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Opção Elaborada #{idx + 1}</span>
                    <button 
                      onClick={() => handleCopy(copy)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Copiar Copy
                    </button>
                  </div>
                  <div className="p-8">
                    <p className="text-sm text-gray-300 leading-relaxed font-medium whitespace-pre-wrap italic">
                      {copy}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-[600px] border-2 border-dashed border-gray-800 rounded-[40px] flex flex-col items-center justify-center text-center p-12 bg-black/10">
                <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center text-4xl mb-6 opacity-30">📜</div>
                <h3 className="text-xl font-black uppercase italic tracking-tight text-gray-500">Biblioteca Vazia</h3>
                <p className="text-xs text-gray-700 font-bold uppercase mt-2 tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                  Selecione um tema e gere 20 scripts trabalhados para turbinar suas vendas hoje mesmo.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SalesCopy;
