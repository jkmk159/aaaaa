
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
 * GERAÇÃO DE IMAGEM (VIA SUBNP - ROTA COMPATÍVEL)
 * Utiliza o endpoint oficial para evitar erros de cota e CORS encontrados no endpoint público.
 */
export const generateVisual = async (prompt: string) => {
  const apiKey = (process as any).env.ORSHOT_KEY;
  
  if (!apiKey) {
    throw new Error("Chave da API de imagem (ORSHOT_KEY) não configurada.");
  }

  try {
    const response = await fetch('https://api.subnp.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "flux",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SubNP Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Formato padrão de resposta SubNP/OpenAI
    if (data.data && data.data[0]?.b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    } else if (data.data && data.data[0]?.url) {
      return data.data[0].url;
    }
    
    throw new Error("Resposta da SubNP sem dados de imagem.");

  } catch (error: any) {
    console.error("Erro na SubNP:", error);
    throw error;
  }
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
