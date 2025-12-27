import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!key || key === "undefined" || key === "PLACEHOLDER_API_KEY") return null;
  return key;
};

export const generateCaption = async (description: string) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");
  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Modelo Correto
  const result = await model.generateContent(`Crie 3 opções de legendas para: ${description}`);
  return result.response.text();
};

export const analyzeAd = async (imageBuffer: string, text: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Modelo Correto
  const imagePart = {
    inlineData: { data: imageBuffer.split(',')[1], mimeType: 'image/jpeg' }
  };
  const result = await model.generateContent([imagePart, `Analise este anúncio: "${text}"`]);
  return result.response.text();
};

// Adicionei esta função vazia para evitar o erro de "not defined" caso o componente a chame
export const generateVisual = async () => {
  console.warn("Função generateVisual desativada para evitar erro de cota.");
  return null;
};
