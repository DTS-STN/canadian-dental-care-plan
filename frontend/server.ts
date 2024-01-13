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
import { createLogger, format, transports } from 'winston';

// TODO :: GjB :: figure out how to import the logger from ./app/utils/
function formatCategory(category: string, size: number) {
  const str = category.padStart(size);
  return str.length <= size ? str : `...${str.slice(-size + 3)}`;
}

// TODO :: GjB :: figure out how to import the logger from ./app/utils/
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf((info) => `${info.timestamp} ${info.level.toUpperCase().padStart(7)} --- [${formatCategory('server', 25)}]: ${info.message}`),
  ),
  transports: [new transports.Console()],
});

const BUILD_PATH = './build/index.js';
const VERSION_PATH = './build/version.txt';
const require = { cache: {} as Record<string, unknown> };

//
// Remix native server code below...
// copied from: https://github.com/remix-run/remix/blob/remix@2.5.0/packages/remix-serve/cli.ts
//

process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';

sourceMapSupport.install({
  retrieveSourceMap: function (source) {
    let match = source.startsWith('file://');
    if (match) {
      let filePath = url.fileURLToPath(source);
      let sourceMapPath = `${filePath}.map`;
      if (fs.existsSync(sourceMapPath)) {
        return {
          url: source,
          map: fs.readFileSync(sourceMapPath, 'utf8'),
        };
      }
    }
    return null;
  },
});
installGlobals();

run();

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  let maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

async function run() {
  let port = parseNumber(process.env.PORT) ?? (await getPort({ port: 3000 }));

  let buildPath = path.resolve(BUILD_PATH);
  let versionPath = path.resolve(VERSION_PATH);

  async function reimportServer() {
    Object.keys(require.cache).forEach((key) => {
      if (key.startsWith(buildPath)) {
        delete require.cache[key];
      }
    });

    let stat = fs.statSync(buildPath);

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

    chokidar.watch(versionPath, { ignoreInitial: true }).on('add', handleServerUpdate).on('change', handleServerUpdate);

    // wrap request handler to make sure its recreated with the latest build for every request
    return async (req, res, next) => {
      try {
        return createRequestHandler({
          build,
          mode: 'development',
        })(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  let build: ServerBuild = await reimportServer();

  let onListen = () => {
    let address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes('4') && !ip?.internal)?.address;

    if (!address) {
      console.log(`[remix-serve] http://localhost:${port}`);
    } else {
      console.log(`[remix-serve] http://localhost:${port} (http://${address}:${port})`);
    }
    if (process.env.NODE_ENV === 'development') {
      void broadcastDevReady(build);
    }
  };

  let app = express();
  app.disable('x-powered-by');
  app.use(compression());
  app.use(
    build.publicPath,
    express.static(build.assetsBuildDirectory, {
      immutable: true,
      maxAge: '1y',
    }),
  );

  app.use(express.static('public', { maxAge: '1h' }));
  app.use(morgan('tiny', { stream: { write: (str) => logger.info(str) } }));

  app.all(
    '*',
    process.env.NODE_ENV === 'development'
      ? createDevRequestHandler(build)
      : createRequestHandler({
          build,
          mode: process.env.NODE_ENV,
        }),
  );

  let server = process.env.HOST ? app.listen(port, process.env.HOST, onListen) : app.listen(port, onListen);

  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
