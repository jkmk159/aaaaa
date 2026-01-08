
/**
 * SERVIÇO DE INTEGRAÇÃO IPTV (SaaS - MULTI-PAINEL)
 * Compatível com o endpoint: https://jordantv.shop/api/create_user.php
 */

interface IptvResponse {
  success: boolean;
  message: string;
  data?: {
    credenciais?: {
      usuario: string;
      senha: string;
      url_m3u: string;
      servidor: string;
      porta: number;
    };
    nova_data_vencimento?: string;
  };
}

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
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Erro ao criar usuário remoto:", error);
    return { success: false, message: error.message || "Erro de conexão com o servidor IPTV." };
  }
};

/**
 * Renova um usuário no painel remoto
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
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Erro ao renovar usuário remoto:", error);
    return { success: false, message: "Erro ao processar renovação no painel remoto." };
  }
};
