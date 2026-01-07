import { createClient } from '@supabase/supabase-js';

// Helper robusto para variáveis de ambiente (Vite / Node / Edge)
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key] ?? '';
  }
  if (typeof process !== 'undefined') {
    return process.env[key] ?? '';
  }
  return '';
};

const SUPABASE_URL =
  getEnvVar('VITE_SUPABASE_URL') ||
  'https://pyjdlfbxgcutqzfqcpcd.supabase.co';

const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Aviso claro no console
if (!SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Supabase ANON KEY não configurada. Verifique VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || 'no-key-provided',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Verifica se o Supabase está configurado corretamente
 */
export const checkSupabaseConnection = (): boolean => {
  return (
    !!SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== 'no-key-provided' &&
    SUPABASE_ANON_KEY !== 'undefined'
  );
};
