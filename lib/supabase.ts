
import { createClient } from '@supabase/supabase-js';

// Get environment variables with safe fallbacks
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://pyjdlfbxgcutqzfqcpcd.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

// Initialize the client. If the key is missing, requests will fail with a 401/403 
// but the application itself will not crash on import.
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey || "no-key-provided"
);

// Log a simple warning for developers instead of a critical error that blocks UI progress
if (!supabaseAnonKey || supabaseAnonKey === "undefined") {
  console.warn("Supabase: VITE_SUPABASE_ANON_KEY is missing. Database features will be unavailable.");
}
