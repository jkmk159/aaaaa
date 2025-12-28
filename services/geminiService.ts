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
 * GERAÇÃO DE IMAGEM (ORSHOT API - ATUALIZADO CONFORME DOCS)
 */
export const generateVisual = async (prompt: string, _originalImageBase64?: string) => {
  const orshotKey = getOrshotKey();
  
  if (!orshotKey || orshotKey === "") {
    throw new Error("Chave VITE_ORSHOT_KEY não encontrada. Verifique as configurações do GitHub Actions.");
  }

  try {
    // Endpoint oficial e correto conforme a documentação fornecida
    const response = await fetch('https://api.orshot.com/v1/generate/images', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${orshotKey}` // Autenticação Bearer obrigatória
      },
      body: JSON.stringify({
        // IMPORTANTE: Substitua pelo ID do seu template criado no painel Orshot
        templateId: "SEU_TEMPLATE_ID_AQUI", 
        response: {
          type: "base64", // Retorna a imagem diretamente em base64
          format: "png"
        },
        modifications: {
          // Nome da variável que você definiu no seu template Orshot
          "prompt_text": prompt 
        }
      })
    });

    // Tratamento para evitar o erro de SyntaxError ao receber HTML de erro
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro detalhado Orshot:", errorText);
      throw new Error(`Erro na Orshot (${response.status}). Verifique o ID do template.`);
    }

    const data = await response.json();
    
    // De acordo com a doc, se o type for base64, a imagem vem na propriedade 'image'
    if (data.image) {
      return `data:image/png;base64,${data.image}`;
    } else if (data.url) {
      return data.url;
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
