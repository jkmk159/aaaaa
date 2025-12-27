import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do arquivo .env ou do ambiente (GitHub Actions)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Isso garante que o navegador encontre a chave em qualquer "idioma" (process ou import.meta)
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      
      // Supabase - Corrigindo para evitar o erro 422
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild', // Esbuild é mais rápido e padrão do Vite
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
