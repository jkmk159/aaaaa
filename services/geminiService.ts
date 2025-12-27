// services/geminiService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Obtém a API Key de forma segura
 */
const getApiKey = () => {
 const key =
 import.meta.env.VITE_GEMINI_API_KEY ||
 (process.env as any).API_KEY ||
 "";

 if (!key || key === "undefined" || key === "PLACEHOLDER_API_KEY") {
 return null;
 }
 return key;
};

/**
 * Cria o cliente da API do Gemini
 */
const getClient = () => {
 const apiKey = getApiKey();
 if (!apiKey) throw new Error("API Key ausente.");
 return new GoogleGenerativeAI(apiKey);
};

/**
 * Obtém o modelo principal (ajuste o nome se quiser outro modelo)
 */
const getModel = () =>
 getClient().getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Gera legendas para anúncios
 */
export const generateCaption = async (description: string) => {
 const model = getModel();

 const response = await model.generateContent(
 `Crie 3 opções de legendas curtas e criativas para o seguinte anúncio, em português, 
 focadas em conversão e com CTA claro:
 "${description}"`
 );

 return response.response.text();
};

/**
 * Gera múltiplas variações de mensagens (bulk)
 */
export const generateBulkCopies = async (
 theme: string,
 data: { server: string; price: string }
) => {
 const model = getModel();

 const prompt = `
Gere 20 variações de mensagens curtas para anúncio, em português, com base nas informações:
Tema: "${theme}"
Servidor: ${data.server}
Preço: ${data.price}

Regras:
- Cada mensagem em uma linha separada.
- Tom persuasivo, objetivo, com foco em cliques.
- Inclua chamadas para ação (CTA), por exemplo: "Assine agora", "Garanta já", etc.
`;

 const response = await model.generateContent(prompt);
 const text = response.response.text();

 // Opcional: quebra em array de linhas
 return text
 .split("\n")
 .map((line) => line.trim())
 .filter((line) => !!line);
};

/**
 * Gera análise de anúncio (ex.: para o componente AdAnalyzer)
 */
export const generateAdAnalysis = async (description: string) => {
 const model = getModel();

 const prompt = `
Você é um especialista em marketing digital. 
Analise o seguinte anúncio e responda em português com:
1) Pontos fortes
2) Pontos fracos
3) Sugestões de melhoria (título, copy, CTA, oferta).

Anúncio:
"${description}"
`;

 const response = await model.generateContent(prompt);
 return response.response.text();
};

/**
 * Exemplo de função para "visual" (se o seu AdAnalyzer usa generateVisual)
 * IMPORTANTE: a API de imagens do Gemini ainda está mudando; aqui é só um stub de texto.
 * Se você não usar isso, pode remover e retirar o import em AdAnalyzer.tsx.
 */
export const generateVisual = async (description: string) => {
 const model = getModel();

 const prompt = `
Gere uma sugestão de conceito visual para um criativo de anúncio com base na descrição:
"${description}"

Responda em português, descrevendo:
- Cena principal
- Elementos visuais
- Cores
- Estilo geral
`;

 const response = await model.generateContent(prompt);
 return response.response.text();
};
