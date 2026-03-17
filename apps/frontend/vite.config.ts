import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const graphqlProxyTarget = env.VITE_GRAPHQL_PROXY_TARGET || process.env.VITE_GRAPHQL_PROXY_TARGET || 'http://backend:3000';

    return {
        plugins: [react()],
        server: {
            host: '0.0.0.0',
            port: 5173,
            proxy: {
                '/graphql': {
                    target: graphqlProxyTarget,
                    changeOrigin: true,
                    ws: true,
                },
            },
        },
    };
});
