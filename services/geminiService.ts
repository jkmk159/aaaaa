
import { GoogleGenAI, Type } from "@google/genai";

/**
 * GERAÇÃO DE TEXTO E ANÁLISE (GEMINI)
 */
export const generateCaption = async (description: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Crie 3 opções de legendas persuasivas e curtas para um anúncio de IPTV no Instagram/WhatsApp baseadas na seguinte descrição: ${description}. Use emojis e foco em vendas. Retorne apenas as opções.` }] }],
      config: { temperature: 0.8 }
    });
    return response.text || "";
  } catch (error) {
    console.error("Erro Gemini Text:", error);
    throw error;
  }
};

/**
 * GERAÇÃO DE IMAGEM (HÍBRIDA: SUBNP + GEMINI FALLBACK)
 * Tenta usar a SubNP primeiro (sem headers para evitar CORS).
 * Se falhar, usa o Gemini 2.5 Flash Image.
 */
export const generateVisual = async (prompt: string, _originalImageBase64?: string) => {
  // 1. TENTATIVA VIA SUBNP (Simple Request para evitar CORS preflight)
  try {
    const response = await fetch('https://subnp.com/api/free/generate', {
      method: 'POST',
      // NOTA: Não enviamos 'Content-Type' para evitar o erro de CORS 'preflight'
      // O corpo da requisição é enviado como string JSON pura.
      body: JSON.stringify({
        prompt: prompt,
        model: "flux"
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.images && data.images.length > 0) return data.images[0];
      if (data.url) return data.url;
    }
  } catch (subnpError) {
    console.warn("SubNP falhou ou bloqueou via CORS. Ativando Fallback Gemini...", subnpError);
  }

  // 2. FALLBACK VIA GEMINI 2.5 FLASH IMAGE (Garantia de Funcionamento)
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (geminiError) {
    console.error("Erro crítico em ambos os provedores de imagem:", geminiError);
    throw new Error("Não foi possível gerar a imagem no momento. Tente um prompt diferente.");
  }
  
  return null;
};

/**
 * ANÁLISE DE ANÚNCIOS (VISION COM GEMINI PRO)
 */
export const analyzeAd = async (imageBuffer: string, text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = {
      inlineData: {
        data: imageBuffer.split(',')[1],
        mimeType: 'image/jpeg',
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { 
        parts: [
          imagePart, 
          { text: `Analise este anúncio de IPTV (texto: "${text}") e retorne JSON com pontos fortes (strengths), melhorias (improvements), texto otimizado (optimizedText) e um prompt visual (visualPrompt) para recriar esta arte com mais qualidade. O prompt visual deve ser em inglês e muito detalhado.` }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizedText: { type: Type.STRING },
            visualPrompt: { type: Type.STRING }
          },
          required: ['strengths', 'improvements', 'optimizedText', 'visualPrompt']
        }
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro na análise de anúncio:", error);
    throw error;
  }
};

/**
 * GERAÇÃO EM MASSA DE COPYS
 */
export const generateBulkCopies = async (theme: string, data: { server: string; price: string }) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Gere 20 variações de mensagens persuasivas para: "${theme}". Servidor: ${data.server}, Preço: ${data.price}. Retorne apenas um array JSON de strings.` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Erro Bulk Copies:", error);
    return [];
  }
};

/**
 * BUSCA DE TRANSMISSÕES
 */
export const getBroadcastsForGames = async (gamesList: string[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Liste canais de transmissão brasileiros para: ${gamesList.join(', ')}. Retorne array JSON de strings.` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch {
    return [];
  }
};
