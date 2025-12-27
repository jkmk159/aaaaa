
import React, { useState } from 'react';
import { Client, Plan } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  clients: Client[];
  plans: Plan[];
  getClientStatus: (date: string) => string;
}

const GestorTemplateAI: React.FC<Props> = ({ clients, plans, getClientStatus }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');

  const generateBillingMessage = async () => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;
    
    setLoadingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const plan = plans.find(p => p.id === client.planId);
      
      const prompt = `Crie uma mensagem de cobrança profissional e amigável para WhatsApp para o cliente ${client.name}. Detalhes: Usuário: ${client.username}, Plano: ${plan?.name}, Valor: R$ ${plan?.price}, Vencimento: ${new Date(client.expirationDate).toLocaleDateString()}. Retorne apenas o texto da mensagem.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }]
      });

      setGeneratedMessage(response.text || '');
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar mensagem com IA.");
    } finally {
      setLoadingAI(false);
    }
  };

  const sendWhatsApp = () => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;
    const url = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(generatedMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <h3 className="text-xl font-black italic uppercase tracking-tighter">Gerador de Cobrança <span className="text-blue-500">Inteligente</span></h3>
      <div className="bg-[#141824] p-10 rounded-[40px] border border-gray-800 space-y-6">
        <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold appearance-none outline-none focus:border-blue-500">
          <option value="">Selecione o Cliente para Cobrar</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({getClientStatus(c.expirationDate)})</option>)}
        </select>
        <button onClick={generateBillingMessage} disabled={loadingAI || !selectedClientId} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-sm italic tracking-widest disabled:opacity-50 transition-all hover:bg-blue-700">
          {loadingAI ? 'IA REDIGINDO...' : 'GERAR MENSAGEM COM IA'}
        </button>
      </div>
      {generatedMessage && (
        <div className="bg-[#141824] p-8 rounded-[32px] border border-gray-800 space-y-6 animate-fade-in">
          <div className="bg-black/40 p-6 rounded-2xl text-sm whitespace-pre-line text-gray-300 italic">
            {generatedMessage}
          </div>
          <button onClick={sendWhatsApp} className="w-full bg-green-600 py-4 rounded-2xl font-black uppercase text-sm italic flex items-center justify-center gap-3 transition-all hover:bg-green-700">
            <span>📲</span> ENVIAR PARA WHATSAPP
          </button>
        </div>
      )}
    </div>
  );
};

export default GestorTemplateAI;
