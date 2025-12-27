
import { GoogleGenAI, Type } from "@google/genai";

// Inicialização única seguindo as diretrizes
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCaption = async (description: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Crie 3 opções de legendas persuasivas e curtas para um anúncio de IPTV no Instagram/WhatsApp baseadas na seguinte descrição: ${description}. Use emojis e foco em vendas.` }] }],
      config: {
        temperature: 0.8,
      }
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Erro Gemini:", error);
    throw new Error("Falha na IA: " + (error.message || "Erro desconhecido"));
  }
};

export const generateBulkCopies = async (theme: string, data: { server: string; agent: string; price: string; period: string }) => {
  const ai = getAI();
  const prompt = `Gere EXATAMENTE 20 variações de mensagens de vendas para: "${theme}". Servidor: ${data.server}, Preço: ${data.price}. Retorne array JSON de strings.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return ["Erro ao formatar resposta da IA."];
  }
};

export const generateVisual = async (prompt: string, originalImageBase64: string) => {
  const ai = getAI();
  const imagePart = {
    inlineData: {
      data: originalImageBase64.split(',')[1],
      mimeType: 'image/jpeg',
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [
        imagePart, 
        { text: prompt }
      ] 
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  return null;
};

export const analyzeAd = async (imageBuffer: string, text: string) => {
  const ai = getAI();
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
        { text: `Analise este anúncio: "${text}" e retorne JSON com os campos strengths, improvements, optimizedText e visualPrompt.` }
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
};

export const getBroadcastsForGames = async (gamesList: string[]) => {
  if (gamesList.length === 0) return [];
  const ai = getAI();
  const prompt = `Canais de transmissão para: ${gamesList.join(', ')}. Retorne apenas array JSON de strings.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  try { 
    return JSON.parse(response.text || '[]'); 
  } catch { 
    return []; 
  }
};
