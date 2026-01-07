
import { createClient } from '@supabase/supabase-js';

// Helper robusto para capturar variáveis de ambiente
const getEnvVar = (key: string): string => {
  const value = process.env[key] || (import.meta as any).env?.[key] || "";
  return value.trim();
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || "https://pyjdlfbxgcutqzfqcpcd.supabase.co";
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Log de diagnóstico
if (!supabaseAnonKey || supabaseAnonKey === "no-key-provided") {
  console.warn("AVISO: Chave do Supabase não detectada. Configure VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey || "no-key-provided",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

/**
 * Verifica se as credenciais do Supabase estão configuradas no ambiente.
 */
export function checkSupabaseConnection(): boolean {
  const key = getEnvVar('VITE_SUPABASE_ANON_KEY');
  return !!key && key !== "no-key-provided" && key !== "undefined" && key !== "";
}
