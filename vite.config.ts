import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '$': path.resolve(__dirname, './'),
        },
    },
    server: {
        host: true,
        port: 3985,
        open: false,
        https: false,
        strictPort: true,
        cors: true,
    },
    build: {
        outDir: 'dist',
        target: 'esnext',
        assetsInlineLimit: 4096,
        chunkSizeWarningLimit: 1000,
    },
});
