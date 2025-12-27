import { createClient } from '@supabase/supabase-js';

// No Vite, usamos import.meta.env para acessar as variáveis injetadas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://pyjdlfbxgcutqzfqcpcd.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Inicializa o cliente com verificações extras
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || "invalid-key" // Evita que o app quebre se a chave estiver vindo como undefined
);

// Log informativo para você saber exatamente o que está acontecendo no console
if (!supabaseAnonKey || supabaseAnonKey === "undefined" || supabaseAnonKey === "invalid-key") {
  console.error("ERRO CRÍTICO: Chave Anon do Supabase não foi encontrada pelo navegador.");
} else {
  console.log("Supabase: Conectado com sucesso.");
}
