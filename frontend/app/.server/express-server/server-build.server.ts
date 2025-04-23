import type { ServerBuild } from 'react-router';

import type { ViteDevServer } from 'vite';

export async function initServerBuild(viteDevServer?: ViteDevServer): Promise<ServerBuild> {
  if (viteDevServer) {
    return (await viteDevServer.ssrLoadModule('virtual:react-router/server-build')) as ServerBuild;
  }

  // dynamically declare the path to avoid static analysis errors 💩
  const remixServerBuild = './app.js';
  return await import(remixServerBuild);
}
