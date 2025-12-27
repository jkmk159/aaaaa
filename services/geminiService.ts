import { GoogleGenAI, SchemaType } from "@google/genai";

// Função para pegar a chave de forma segura no Vite
const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!key || key === "undefined" || key === "PLACEHOLDER_API_KEY") return null;
  return key;
};

export const generateCaption = async (description: string) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");

  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(`Crie 3 opções de legendas persuasivas e curtas para um anúncio de IPTV no Instagram/WhatsApp baseadas na seguinte descrição: ${description}. Use emojis e foco em vendas.`);
  const response = await result.response;
  return response.text();
};

export const generateBulkCopies = async (theme: string, data: { server: string; price: string }) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");

  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      },
    },
  });

  const prompt = `Gere EXATAMENTE 20 variações de mensagens de vendas para: "${theme}". Servidor: ${data.server}, Preço: ${data.price}. Retorne array JSON de strings.`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  try {
    return JSON.parse(response.text() || '[]');
  } catch (e) {
    return ["Erro ao formatar resposta da IA."];
  }
};

export const analyzeAd = async (imageBuffer: string, text: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          improvements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          optimizedText: { type: SchemaType.STRING },
          visualPrompt: { type: SchemaType.STRING }
        },
        required: ['strengths', 'improvements', 'optimizedText', 'visualPrompt']
      },
    },
  });

  const imagePart = {
    inlineData: { data: imageBuffer.split(',')[1], mimeType: 'image/jpeg' },
  };

  const result = await model.generateContent([imagePart, `Analise este anúncio: "${text}"`]);
  const response = await result.response;
  return response.text();
};

export const getBroadcastsForGames = async (gamesList: string[]) => {
  const apiKey = getApiKey();
  if (!apiKey || gamesList.length === 0) return [];

  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`Canais de transmissão para: ${gamesList.join(', ')}. Retorne apenas array JSON de strings.`);
  const response = await result.response;
  try { return JSON.parse(response.text() || '[]'); } catch { return []; }
};

// Mantenha essa função mesmo que vazia para não dar erro de importação no AdAnalyzer
export const generateVisual = async (prompt: string, originalImageBase64: string) => {
    console.warn("Geração visual não disponível no plano gratuito.");
    return null;
};
