import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Isso carrega variáveis do .env + variáveis do GitHub Actions (process.env)
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  
  return {
    plugins: [react()],
    define: {
      // MAPEAMENTO TOTAL: Garante que o navegador ache a chave de qualquer forma
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      
      // Supabase - Resolve o erro 422 de login
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild', 
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@supabase/supabase-js', '@google/genai'],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
