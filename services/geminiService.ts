
import { GoogleGenAI, Type } from "@google/genai";

/**
 * GERAÇÃO DE TEXTO E ANÁLISE (GEMINI-3-FLASH-PREVIEW)
 * Utiliza: process.env.API_KEY (VITE_GEMINI_API_KEY)
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
 * GERAÇÃO DE IMAGEM (ORSHOT API)
 * Utiliza: process.env.ORSHOT_KEY (VITE_ORSHOT_KEY)
 */
export const generateVisual = async (prompt: string, originalImageBase64?: string) => {
  const orshotKey = (process as any).env.ORSHOT_KEY;
  
  if (!orshotKey) {
    throw new Error("Chave da Orshot (VITE_ORSHOT_KEY) não configurada.");
  }

  try {
    const response = await fetch('https://api.orshot.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${orshotKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "flux-1-dev",
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Falha na API da Orshot");
    }

    const data = await response.json();
    
    if (data.data && data.data[0]?.b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    } else if (data.data && data.data[0]?.url) {
      return data.data[0].url;
    }
    
    throw new Error("A Orshot não retornou uma imagem válida.");
  } catch (error: any) {
    console.error("Erro na geração de imagem Orshot:", error);
    throw error;
  }
};

/**
 * ANÁLISE DE ANÚNCIOS (VISION)
 * Utiliza: process.env.API_KEY (VITE_GEMINI_API_KEY)
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
      model: 'gemini-3-flash-preview',
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
 * Utiliza: process.env.API_KEY (VITE_GEMINI_API_KEY)
 */
export const generateBulkCopies = async (theme: string, data: { server: string; price: string }) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Gere 20 variações de mensagens para: "${theme}". Servidor: ${data.server}, Preço: ${data.price}. Retorne array JSON.` }] }],
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

/**
 * BUSCA DE TRANSMISSÕES
 * Utiliza: process.env.API_KEY (VITE_GEMINI_API_KEY)
 */
export const getBroadcastsForGames = async (gamesList: string[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Liste canais de transmissão para: ${gamesList.join(', ')}. Retorne array JSON.` }] }],
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
