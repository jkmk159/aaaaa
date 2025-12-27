import { GoogleGenAI } from "@google/genai";

/**
 * Recupera a API Key de forma segura
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
 * Instância única do cliente
 */
const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");
  return new GoogleGenAI({ apiKey });
};

/**
 * Gerar legendas
 */
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
