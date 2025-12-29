
// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "../lib/supabase";

/**
 * GERAÇÃO DE IMAGEM (VIA SUBNP OU HUGGING FACE)
 * Agora aceita o parâmetro 'provider' para corrigir o erro TS2554.
 */
export async function generateVisual(
  prompt: string, 
  provider: "subnp" | "huggingface" = "subnp" // Adicionado o parâmetro com valor padrão
): Promise<string> {
  
  // Se você implementar a lógica do Hugging Face no futuro, pode usar o 'provider' aqui.
  // Por enquanto, manteremos a lógica da SubNP conforme seu código original.
  
  const response = await fetch(
    "https://pyjdlfbxgcutqzfqcpcd.supabase.co/functions/v1/subnp-generate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ prompt, provider }), // Opcional: enviar o provider para a Edge Function
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro SubNP: ${response.status} - ${errText}`);
  }

  const data = await response.json();

  console.log("RESPOSTA IMAGEM:", data);

  // 🔥 CASO 1: { image: "base64" }
  if (typeof data.image === "string") {
    return `data:image/png;base64,${data.image}`;
  }

  // 🔥 CASO 2: { url: "https://..." }
  if (typeof data.url === "string") {
    return data.url;
  }

  // 🔥 CASO 3: { data: [{ url }] }
  if (Array.isArray(data.data) && data.data[0]?.url) {
    return data.data[0].url;
  }

  // 🔥 CASO 4: { output: [{ b64_json }] }
  if (Array.isArray(data.output) && data.output[0]?.b64_json) {
    return `data:image/png;base64,${data.output[0].b64_json}`;
  }

  throw new Error("Resposta inválida do provedor de imagem");
}


/**
 * ANÁLISE DE ANÚNCIOS (VISION COM GEMINI PRO)
 * Refatorado para receber objeto e evitar erros de parâmetros no TS.
 */
export const analyzeAd = async (params: { imageBuffer: string; text: string }) => {
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
      // ✅ MODELO COM COTA GRATUITA
      model: 'gemini-3-flash-preview',

      contents: [
        {
          parts: [
            imagePart,
            {
              text: `
Analise este anúncio de IPTV.

Texto do anúncio:
"${text}"

Retorne APENAS um JSON com:
- strengths (array de strings)
- improvements (array de strings)
- optimizedText (string)
- visualPrompt (string em inglês, detalhado, para gerar imagem profissional)
              `,
            },
          ],
        },
      ],

      config: {
        temperature: 0.4,
      },
    });

    return response.text || '';
  } catch (error) {
    console.error('Erro na análise de anúncio:', error);
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
