
import { supabase } from '../lib/supabase';

interface IptvResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Esta função chama a Edge Function que você criou no Supabase.
 * Isso esconde sua API KEY e evita erros de CORS.
 */
const callSecureIptvApi = async (body: any): Promise<IptvResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('iptv-api', {
      body: body
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Erro na Edge Function:", error);
    return { success: false, message: "Falha na conexão segura com o painel." };
  }
};

export const createRemoteIptvUser = async (serverId: string, payload: any) => {
  return await callSecureIptvApi({
    action: 'create',
    serverId,
    ...payload
  });
};

export const renewRemoteIptvUser = async (serverId: string, username: string, days: number) => {
  return await callSecureIptvApi({
    action: 'renew',
    serverId,
    username,
    days
  });
};
