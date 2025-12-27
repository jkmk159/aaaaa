import { GoogleGenAI } from "@google/genai";

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

const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");
  return new GoogleGenAI({ apiKey });
};

// Gerar legendas
export const generateCaption = async (description: string) => {
  const genAI = getClient();

  const response = await genAI.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Crie 3 opções de legendas para: ${description}`
  });

  return response.text;
};

/**
 * Gerar múltiplas mensagens (bulk)
 */
export const generateBulkCopies = async (
  theme: string,
  data: { server: string; price: string }
) => {
  const genAI = getClient();

  const prompt = `
Gere 20 variações de mensagens para:
Tema: "${theme}"
Servidor: ${data.server}
Preço: ${data.price}

Retorne SOMENTE um array JSON de strings.
`;

  const response = await genAI.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return ["Erro ao interpretar resposta da IA"];
  }
};

// Analisar anúncio com imagem
export const analyzeAd = async (imageBase64: string, text: string) => {
  const genAI = getClient();

  const imagePart = {
    inlineData: {
      data: imageBase64.split(",")[1],
      mimeType: "image/jpeg"
    }
  };

  const response = await genAI.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      imagePart,
      { text: `Analise este anúncio: "${text}"` }
    ]
  });

  return response.text;
};

// Sugerir canais para jogos
export const getBroadcastsForGames = async (gamesList: string[]) => {
  const genAI = getClient();

  const response = await genAI.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Informe canais indicados para transmitir: ${gamesList.join(", ")}`
  });

  return [response.text];
};
