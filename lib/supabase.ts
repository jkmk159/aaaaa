import { createClient } from '@supabase/supabase-js';

/**
 * Vite usa SOMENTE import.meta.env
 * Nunca process.env no frontend
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Validação básica em tempo de build/runtime
 */
if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL não configurada. Verifique seu arquivo .env'
  );
}

if (!supabaseAnonKey) {
  console.warn(
    '⚠️ VITE_SUPABASE_ANON_KEY não configurada. Autenticação não funcionará.'
  );
}

/**
 * Client Supabase (frontend)
 * Edge Functions devem usar SERVICE_ROLE_KEY no backend
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Utilitário opcional para debug
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
