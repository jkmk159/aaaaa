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
  // Versão compatível com o seu log de erro
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`Crie 3 opções de legendas para: ${description}`);
  const response = await result.response;
  return response.text();
};

export const generateBulkCopies = async (theme: string, data: { server: string; price: string }) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");

  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Gere 20 variações de mensagens para: "${theme}". Servidor: ${data.server}, Preço: ${data.price}. Retorne um array JSON de strings.`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  try {
    return JSON.parse(response.text() || '[]');
  } catch (e) {
    return ["Erro ao processar resposta da IA."];
  }
};

export const analyzeAd = async (imageBuffer: string, text: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const imagePart = {
    inlineData: {
      data: imageBuffer.split(',')[1],
      mimeType: 'image/jpeg',
    },
  };
  const result = await model.generateContent([imagePart, `Analise este anúncio: "${text}"`]);
  const response = await result.response;
  return response.text();
};

export const getBroadcastsForGames = async (gamesList: string[]) => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`Canais de transmissão para: ${gamesList.join(', ')}`);
  const response = await result.response;
  return [response.text()];
};
