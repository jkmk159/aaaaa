import { GoogleGenAI, Type } from "@google/genai";

/* =========================================================
   🔹 GERAÇÃO DE TEXTO (GEMINI)
========================================================= */
export const generateCaption = async (description: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Crie 3 opções de legendas persuasivas e curtas para um anúncio de IPTV no Instagram/WhatsApp baseadas na seguinte descrição: ${description}. Use emojis e foco em vendas. Retorne apenas as opções.`,
            },
          ],
        },
      ],
      config: { temperature: 0.8 },
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro Gemini Text:", error);
    throw error;
  }
};

/* =========================================================
   🔹 GERAÇÃO DE IMAGEM (VIA SUPABASE EDGE FUNCTION)
========================================================= */
export const generateVisual = async (prompt: string): Promise<string | null> => {
  try {
    const response = await fetch(
      "https://pyjdlfbxgcutqzfqcpcd.supabase.co/functions/v1/subnp-generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();

    if (data.provider === "huggingface") {
      return `data:image/png;base64,${data.image}`;
    }

    if (data.provider === "subnp") {
      return data.image;
    }

    return null;
  } catch (err) {
    console.error("Erro generateVisual:", err);
    return null;
  }
};


/* =========================================================
   🔹 ANÁLISE DE ANÚNCIOS (VISION - GEMINI PRO)
========================================================= */
export const analyzeAd = async (imageBuffer: string, text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
      inlineData: {
        data: imageBuffer.split(",")[1],
        mimeType: "image/png",
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          imagePart,
          {
            text: `Analise este anúncio de IPTV (texto: "${text}") e retorne JSON com:
- strengths
- improvements
- optimizedText
- visualPrompt (em inglês, muito detalhado).`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizedText: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
          },
          required: [
            "strengths",
            "improvements",
            "optimizedText",
            "visualPrompt",
          ],
        },
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro na análise de anúncio:", error);
    throw error;
  }
};

/* =========================================================
   🔹 GERAÇÃO EM MASSA DE COPYS
========================================================= */
export const generateBulkCopies = async (
  theme: string,
  data: { server: string; price: string }
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Gere 20 variações de mensagens persuasivas para:
Tema: ${theme}
Servidor: ${data.server}
Preço: ${data.price}
Retorne apenas um array JSON de strings.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro Bulk Copies:", error);
    return [];
  }
};

/* =========================================================
   🔹 BUSCA DE TRANSMISSÕES
========================================================= */
export const getBroadcastsForGames = async (gamesList: string[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Liste canais de transmissão brasileiros para: ${gamesList.join(
                ", "
              )}. Retorne array JSON de strings.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};
