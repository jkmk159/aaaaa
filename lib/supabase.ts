import { createClient } from '@supabase/supabase-js';

// Prioridade: Variáveis de ambiente injetadas pelo Vite > Chaves diretas
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://pyjdlfbxgcutqzfqcpcd.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5amRsZmJ4Z2N1dHF6ZnFjcGNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODk4NSwiZXhwIjoyMDgxNjA0OTg1fQ.81UGd35iSNOswIuNrk9iszuR2dqWkK_bU28lIGpTrfE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
