
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY || ""),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
      'process.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY || "")
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
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
