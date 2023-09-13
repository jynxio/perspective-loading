import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '$': path.resolve(__dirname, './'),
        },
    },
    base: './',
    server: {
        host: true,
        port: 3985,
        open: false,
        https: false,
        strictPort: true,
        cors: true,
    },
    build: {
        outDir: 'docs',
        target: 'esnext',
        assetsInlineLimit: 4096,
        chunkSizeWarningLimit: 1000,
    },
});
