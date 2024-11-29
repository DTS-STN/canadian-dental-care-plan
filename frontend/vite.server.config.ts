import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      plugins: [tsconfigPaths()],
      input: './express-server/express.server.ts',
      output: {
        dir: './build/',
        entryFileNames: 'express.server.mjs',
      },
    },
    ssr: true,
    target: 'node22',
  },
});
