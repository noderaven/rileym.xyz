import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    // Output directory for production build
    outDir: 'dist',
    
    // Enable minification
    minify: 'terser',
    
    // Terser options for aggressive minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // Configure CSS minification
    cssMinify: true,
    
    // Configure asset handling
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        projects: resolve(__dirname, 'projects.html'),
        contact: resolve(__dirname, 'contact.html')
      },
      output: {
        // Chunk naming strategy
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        
        // Configure code splitting
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    
    // Enable source maps for debugging
    sourcemap: false,
    
    // Asset handling
    assetsInlineLimit: 4096, // 4kb
  },
  
  // Configure server options
  server: {
    port: 3000,
    open: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['@fortawesome/fontawesome-free']
  }
}); 
