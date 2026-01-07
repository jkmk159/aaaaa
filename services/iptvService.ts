import { supabase } from '../lib/supabase';

interface IptvResponse {
  success: boolean;
  message: string;
  data?: any;
}

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

// Ajustado para receber serverId dentro do payload
export const createRemoteIptvUser = async (payload: { serverId: string; [key: string]: any }) => {
  return await callSecureIptvApi({
    action: 'create',
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
