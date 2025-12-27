
import { GoogleGenAI, Type } from "@google/genai";

// Agora a chave é buscada de forma segura do ambiente
const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY || "";

// Inicialização única seguindo as diretrizes
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Função auxiliar para converter URL em Base64 (OpenRouter retorna URLs para imagens)
const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

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

export const generateVisual = async (prompt: string, originalImageBase64?: string) => {
  if (!OPENROUTER_API_KEY) {
    console.error("Chave do OpenRouter não configurada!");
    return null;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "StreamHUB IPTV"
      },
      body: JSON.stringify({
        "model": "openai/dall-e-3",
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const urlMatch = content.match(/https?:\/\/[^\s)]+/);
    
    if (urlMatch) {
      return await urlToBase64(urlMatch[0]);
    }
    
    if (data.choices?.[0]?.message?.image_url) {
      return await urlToBase64(data.choices[0].message.image_url.url);
    }

    throw new Error("Não foi possível extrair a imagem da resposta.");
  } catch (error) {
    console.error("Erro OpenRouter Image:", error);
    return null;
  }
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
