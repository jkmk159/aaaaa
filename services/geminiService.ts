
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
// No geminiService.ts

import { supabase } from "@/lib/supabase";

export const generateVisual = async (prompt: string) => {
  try {
    // 🔐 Pega a sessão atual do usuário
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Usuário não autenticado");
    }

    // 🔥 Chamada para a Edge Function PROTEGIDA
    const response = await fetch(
      "https://pyjdlfbxgcutqzfqcpcd.supabase.co/functions/v1/subnp-generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro na Edge Function: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    // 🔁 Tratamento seguro da resposta
    if (data.image) {
      return `data:image/png;base64,${data.image}`;
    }

    if (data.images?.length) {
      return `data:image/png;base64,${data.images[0]}`;
    }

    if (data.url) {
      return data.url;
    }

    throw new Error("Resposta da API sem imagem.");
  } catch (error) {
    console.error("Falha na geração visual:", error);
    throw error;
  }
};

/**
 * ANÁLISE DE ANÚNCIOS (VISION COM GEMINI PRO)
 * Refatorado para receber objeto e evitar erros de parâmetros no TS.
 */
export const analyzeAd = async (params: { imageBuffer: string, text: string }) => {
  const { imageBuffer, text } = params;
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
