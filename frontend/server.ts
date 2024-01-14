import { createRequestHandler } from '@remix-run/express';
import { type ServerBuild, broadcastDevReady, installGlobals } from '@remix-run/node';

import chokidar from 'chokidar';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import sourceMapSupport from 'source-map-support';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

// set the node environment to production if one hasn't yet been set
process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';

const BUILD_PATH = path.resolve('./build/index.js');
const VERSION_PATH = path.resolve('./build/version.txt');

const log = getLogger('server');
const { NODE_ENV, PORT } = getEnv();
const isDevMode = NODE_ENV === 'development';

installSourceMapSupport();
installGlobals();
run();

async function run() {
  let build = await importBuild();

  // function to reload the build when the server is updated
  async function onBuildUpdate() {
    build = await importBuild();
    if (isDevMode) broadcastDevReady(build);
  }

  // express listen event handler
  function onServerListen() {
    log.info(`Server listening on http://localhost:${PORT}/`);
    if (isDevMode) broadcastDevReady(build);
  }

  // fire onBuildUpdate() when build changes
  // prettier-ignore
  chokidar.watch(VERSION_PATH, { ignoreInitial: true })
    .on('add', onBuildUpdate)
    .on('change', onBuildUpdate);

  const app = express();
  app.disable('x-powered-by');
  app.use(compression());
  app.use(build.publicPath, express.static(build.assetsBuildDirectory, { immutable: true, maxAge: '1y' }));
  app.use(express.static('public', { maxAge: '1h' }));
  app.use(morgan(isDevMode ? 'dev' : 'tiny', { stream: { write: (str) => log.info(str) } }));
  app.all('*', createRequestHandler({ build, mode: NODE_ENV }));

  const server = app.listen(PORT, onServerListen);
  ['SIGTERM', 'SIGINT'].forEach((signal) => process.once(signal, () => server?.close(console.error)));
}

function installSourceMapSupport() {
  sourceMapSupport.install({
    retrieveSourceMap: (source) => {
      const match = source.startsWith('file://');

      if (match) {
        const sourceMapPath = `${url.fileURLToPath(source)}.map`;

        if (fs.existsSync(sourceMapPath)) {
          return { url: source, map: fs.readFileSync(sourceMapPath, 'utf8') };
        }
      }

      return null;
    },
  });
}

function importBuild() {
  const stat = fs.statSync(BUILD_PATH);
  const buildUrl = url.pathToFileURL(BUILD_PATH).href;
  // use a timestamp query parameter to bust the import cache
  return import(`${buildUrl}?t=${stat.mtimeMs}`) as Promise<ServerBuild>;
}
