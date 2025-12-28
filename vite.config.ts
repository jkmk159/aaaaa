
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      'process.env.ORSHOT_KEY': JSON.stringify(env.VITE_ORSHOT_KEY || ""),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || "https://pyjdlfbxgcutqzfqcpcd.supabase.co"),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
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
