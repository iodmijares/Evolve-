import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'groq': ['groq-sdk'],
          'charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable sourcemaps in production for security
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: [
      'localhost',
      '.onrender.com',
      '.vercel.app',
    ],
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'groq-sdk', 'recharts'],
  },
});
