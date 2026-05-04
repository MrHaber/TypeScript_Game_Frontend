var _a;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    base: './',
    server: {
        proxy: {
            '/api': {
                target: (_a = process.env.VITE_DEV_API_PROXY) !== null && _a !== void 0 ? _a : 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        target: 'es2020',
        outDir: 'dist',
        assetsDir: 'assets',
    },
});
