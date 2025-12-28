
import { GoogleGenAI, Type } from "@google/genai";

// Helper para pegar as chaves de forma segura no Vite
const getApiKey = () => process.env.API_KEY || "";
const getOrshotKey = () => (process.env as any).ORSHOT_KEY || "";

/**
 * GERAÇÃO DE TEXTO E ANÁLISE (GEMINI-3-FLASH-PREVIEW)
 */
export const generateCaption = async (description: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
 */
export const generateVisual = async (prompt: string, _originalImageBase64?: string) => {
  const orshotKey = getOrshotKey();
  
  if (!orshotKey || orshotKey === "") {
    throw new Error("Chave VITE_ORSHOT_KEY não encontrada. Verifique as configurações do GitHub Actions.");
  }

  try {
    // Tentando o endpoint padrão compatível com OpenAI da Orshot
    const response = await fetch('https://api.orshot.com/v1/generation', { 
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${orshotKey}`
  },
  body: JSON.stringify({
    prompt: prompt,
    model: "flux-1-dev", // Verifique se este modelo está ativo na sua conta
    width: 1024,
    height: 1024,
  })
});

    // Se não for OK, tentamos ler o erro antes de falhar no JSON
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro API Orshot: ${response.status}`);
      } else {
        const errorText = await response.text();
        console.error("Resposta não-JSON da Orshot:", errorText);
        throw new Error(`Erro de rede Orshot (${response.status}). O serviço pode estar instável.`);
      }
    }

    const data = await response.json();
    
    if (data.data && data.data[0]?.b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    } else if (data.data && data.data[0]?.url) {
      return data.data[0].url;
    }
    
    throw new Error("A Orshot não retornou dados de imagem válidos.");
  } catch (error: any) {
    console.error("Falha Crítica Orshot:", error);
    throw error;
  }
};

/**
 * ANÁLISE DE ANÚNCIOS (VISION)
 */
export const analyzeAd = async (imageBuffer: string, text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
 */
export const generateBulkCopies = async (theme: string, data: { server: string; price: string }) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
 */
export const getBroadcastsForGames = async (gamesList: string[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
