import { GoogleGenAI, Type } from "@google/genai";

// Configuração da API Key (Ajuste para import.meta.env se estiver usando Vite)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenAI(API_KEY);

/**
 * GERAÇÃO DE TEXTO (LEGENDA)
 */
export const generateCaption = async (description: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Crie 3 opções de legendas persuasivas e curtas para um anúncio de IPTV no Instagram/WhatsApp baseadas na seguinte descrição: ${description}. Use emojis e foco em vendas. Retorne apenas as opções.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "";
  } catch (error) {
    console.error("Erro Gemini Text:", error);
    throw error;
  }
};

/**
 * GERAÇÃO DE IMAGEM (VIA SUBNP)
 */
export async function generateVisual(
  prompt: string, 
  provider: "subnp" | "huggingface" = "subnp"
): Promise<string> {
  const response = await fetch(
    "https://pyjdlfbxgcutqzfqcpcd.supabase.co/functions/v1/subnp-generate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ prompt, provider }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro Imagem: ${response.status} - ${errText}`);
  }

  const data = await response.json();

  if (typeof data.image === "string") return `data:image/png;base64,${data.image}`;
  if (typeof data.url === "string") return data.url;
  if (Array.isArray(data.data) && data.data[0]?.url) return data.data[0].url;
  if (Array.isArray(data.output) && data.output[0]?.b64_json) return `data:image/png;base64,${data.output[0].b64_json}`;

  throw new Error("Resposta inválida do provedor de imagem");
}

/**
 * ANÁLISE DE ANÚNCIOS (VISION)
 */
export const analyzeAd = async (params: { imageBuffer: string; text: string }) => {
  const { imageBuffer, text } = params;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imagePart = {
      inlineData: {
        data: imageBuffer.split(',')[1],
        mimeType: 'image/jpeg',
      },
    };

    const prompt = `
      Analise este anúncio de IPTV.
      Texto do anúncio: "${text}"
      Retorne APENAS um JSON com:
      - strengths (array de strings)
      - improvements (array de strings)
      - optimizedText (string)
      - visualPrompt (string em inglês, detalhado)
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text() || '';
  } catch (error) {
    console.error('Erro na análise:', error);
    throw error;
  }
};

/**
 * GERAÇÃO EM MASSA
 */
export const generateBulkCopies = async (theme: string, data: { server: string; price: string }) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `Gere 20 variações de mensagens persuasivas para: "${theme}". Servidor: ${data.server}, Preço: ${data.price}. Retorne apenas um array JSON de strings.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || '[]');
  } catch (error) {
    console.error("Erro Bulk:", error);
    return [];
  }
};
