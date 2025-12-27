import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!key || key === "undefined" || key === "PLACEHOLDER_API_KEY") return null;
  return key;
};

export const generateCaption = async (description: string) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");

  const ai = new GoogleGenAI({ apiKey });
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const response = await model.generateContent(`Crie 3 opções de legendas para: ${description}`);
  return response.response.text();
};

export const generateBulkCopies = async (theme: string, data: { server: string; price: string }) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");

  const ai = new GoogleGenAI({ apiKey });
  const model = ai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `Gere 20 variações para: "${theme}". Servidor: ${data.server}, Preço: ${data.price}. Retorne array JSON de strings.`;
  const response = await model.generateContent(prompt);
  try {
    return JSON.parse(response.response.text() || '[]');
  } catch (e) {
    return ["Erro ao processar IA"];
  }
};

export const analyzeAd = async (imageBuffer: string, text: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const imagePart = {
    inlineData: {
      data: imageBuffer.split(',')[1],
      mimeType: 'image/jpeg',
    },
  };

  const response = await model.generateContent([imagePart, `Analise este anúncio: "${text}"`]);
  return response.response.text();
};

export const getBroadcastsForGames = async (gamesList: string[]) => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const response = await model.generateContent(`Canais para: ${gamesList.join(', ')}`);
  return [response.response.text()];
};
