import { type RequestHandler, createRequestHandler } from '@remix-run/express';
import { type ServerBuild, broadcastDevReady, installGlobals } from '@remix-run/node';

import chokidar from 'chokidar';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import morgan from 'morgan';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import sourceMapSupport from 'source-map-support';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('express.server');

//
// Remix native server code below...
// copied from: https://github.com/remix-run/remix/blob/remix@2.5.0/packages/remix-serve/cli.ts
// with only slight modifications to logging (console → logger) and SIGTERM/SIGINT handlers (and formatting)
//

process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';

installSourceMapSupport();
installGlobals();
run();

function installSourceMapSupport() {
  sourceMapSupport.install({
    retrieveSourceMap: (source) => {
      const match = source.startsWith('file://');

      if (match) {
        const filePath = url.fileURLToPath(source);
        const sourceMapPath = `${filePath}.map`;

        if (fs.existsSync(sourceMapPath)) {
          return { url: source, map: fs.readFileSync(sourceMapPath, 'utf8') };
        }
      }

      return null;
    },
  });
}

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  let maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

async function run() {
  const port = parseNumber(process.env.PORT) ?? (await getPort({ port: 3000 }));

  const buildPathArg = process.argv[2];

  if (!buildPathArg) {
    console.error(`Usage: remix-serve <server-build-path> - e.g. remix-serve build/index.js`);
    process.exit(1);
  }

  const buildPath = path.resolve(buildPathArg);
  const versionPath = path.resolve(buildPath, '..', 'version.txt');

  async function reimportServer() {
    Object.keys(require.cache).forEach((key) => {
      if (key.startsWith(buildPath)) {
        delete require.cache[key];
      }
    });

    const stat = fs.statSync(buildPath);

    // use a timestamp query parameter to bust the import cache
    return import(url.pathToFileURL(buildPath).href + '?t=' + stat.mtimeMs);
  }

  function createDevRequestHandler(initialBuild: ServerBuild): RequestHandler {
    let build = initialBuild;

    async function handleServerUpdate() {
      // 1. re-import the server build
      build = await reimportServer();

      // 2. tell Remix that this app server is now up-to-date and ready
      broadcastDevReady(build);
    }

    // prettier-ignore
    chokidar.watch(versionPath, { ignoreInitial: true })
      .on('add', handleServerUpdate)
      .on('change', handleServerUpdate);

    // wrap request handler to make sure its recreated
    // with the latest build for every request
    return async (req, res, next) => {
      try {
        const requestHandler = createRequestHandler({ build, mode: 'development' });
        return requestHandler(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  const build: ServerBuild = await reimportServer();

  const app = express();
  app.disable('x-powered-by');
  app.use(compression());
  app.use(express.static('public', { maxAge: '1h' }));
  app.use(build.publicPath, express.static(build.assetsBuildDirectory, { immutable: true, maxAge: '1y' }));
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'tiny', { stream: { write: (str) => log.info(str) } }));
  app.all('*', process.env.NODE_ENV === 'development' ? createDevRequestHandler(build) : createRequestHandler({ build, mode: process.env.NODE_ENV }));

  const onListen = () => {
    const address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes('4') && !ip?.internal)?.address;

    if (!address) {
      log.info(`[remix-serve] http://localhost:${port}`);
    } else {
      log.info(`[remix-serve] http://localhost:${port} (http://${address}:${port})`);
    }

    if (process.env.NODE_ENV === 'development') {
      void broadcastDevReady(build);
    }
  };

  const server = process.env.HOST ? app.listen(port, process.env.HOST, onListen) : app.listen(port, onListen);

  if (process.env.NODE_ENV === 'production') {
    ['SIGTERM', 'SIGINT'].forEach((signal) => process.once(signal, () => server?.close(console.error)));
  }
}
