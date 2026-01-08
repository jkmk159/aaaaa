
/**
 * SERVIÇO DE INTEGRAÇÃO IPTV (SaaS - MULTI-PAINEL)
 */

interface IptvResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Cria um novo usuário no painel remoto vinculado ao servidor selecionado
 */
export const createRemoteIptvUser = async (baseUrl: string, apiKey: string, payload: {
  username: string;
  password?: string;
  plan: string;
  nome?: string;
  whatsapp?: string;
  email?: string;
}): Promise<IptvResponse> => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        action: "create",
        ...payload
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao criar usuário remoto:", error);
    return { success: false, message: "Erro de conexão com o servidor IPTV. Verifique a URL e API Key." };
  }
};

/**
 * Renova um usuário no painel remoto enviando a quantidade de dias
 */
export const renewRemoteIptvUser = async (baseUrl: string, apiKey: string, username: string, days: number): Promise<IptvResponse> => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        action: "renew",
        username,
        dias: days
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao renovar usuário remoto:", error);
    return { success: false, message: "Erro de conexão ao renovar no painel." };
  }
};

/**
 * Busca informações de um usuário no painel remoto para sincronização
 */
export const getRemoteIptvUser = async (baseUrl: string, apiKey: string, username: string): Promise<IptvResponse> => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        action: "get",
        username
      })
    });

    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar usuário remoto:", error);
    return { success: false, message: "Erro ao consultar painel IPTV." };
  }
};
