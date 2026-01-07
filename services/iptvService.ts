
/**
 * SERVIÇO DE INTEGRAÇÃO IPTV (CLOUDSERVE API)
 */

interface IptvResponse {
  success: boolean;
  message: string;
  data?: any;
}

const DEFAULT_ENDPOINT = "https://jordantv.shop/api/create_user.php";

/**
 * Cria um novo usuário no painel remoto
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
    const url = baseUrl || DEFAULT_ENDPOINT;
    const response = await fetch(url, {
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

    return await response.json();
  } catch (error) {
    console.error("Erro ao criar usuário remoto:", error);
    return { success: false, message: "Erro de conexão com o servidor IPTV." };
  }
};

/**
 * Renova um usuário no painel remoto
 */
export const renewRemoteIptvUser = async (baseUrl: string, apiKey: string, username: string, days: number): Promise<IptvResponse> => {
  try {
    const url = baseUrl || DEFAULT_ENDPOINT;
    const response = await fetch(url, {
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

    return await response.json();
  } catch (error) {
    console.error("Erro ao renovar usuário remoto:", error);
    return { success: false, message: "Erro de conexão ao renovar no painel." };
  }
};

/**
 * Busca informações de um usuário no painel remoto
 */
export const getRemoteIptvUser = async (baseUrl: string, apiKey: string, username: string): Promise<IptvResponse> => {
  try {
    const url = baseUrl || DEFAULT_ENDPOINT;
    const response = await fetch(url, {
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
    return { success: false, message: "Erro ao consultar painel." };
  }
};
