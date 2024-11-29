import type { ViteDevServer } from 'vite';

/**
 * Creates a Vite development server for non-production environments.
 * This function imports the Vite module and creates a new Vite server instance with middleware mode enabled.
 */
export async function createViteDevServer(isProduction: boolean): Promise<ViteDevServer | undefined> {
  if (!isProduction) {
    const vite = await import('vite');
    return await vite.createServer({
      server: { middlewareMode: true },
    });
  }
}
