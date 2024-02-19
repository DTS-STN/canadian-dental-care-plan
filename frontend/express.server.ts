import { createRequestHandler } from '@remix-run/express';
import type { RequestHandler } from '@remix-run/express';
import { broadcastDevReady, installGlobals } from '@remix-run/node';
import type { ServerBuild } from '@remix-run/node';

import chokidar from 'chokidar';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import sourceMapSupport from 'source-map-support';
import { createLogger, format, transports } from 'winston';

const log = getLogger('express.server');

installSourceMapSupport();
installGlobals();
runServer();

/**
 * Function copied from ./app/utils/logging.server.ts to work around typescript
 * path alias issues with ESM and ESBuild. 🤷
 */
function getLogger(category: string) {
  function formatCategory(category: string, size: number) {
    const str = category.padStart(size);
    return str.length <= size ? str : `...${str.slice(-size + 3)}`;
  }

  return createLogger({
    level: process.env['LOG_LEVEL'] ?? 'info',
    format: format.combine(
      format.timestamp(),
      format.splat(),
      format.printf((info) => `${info.timestamp} ${info.level.toUpperCase().padStart(7)} --- [${formatCategory(category, 25)}]: ${info.message}`),
    ),
    transports: [new transports.Console()],
  });
}

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

/**
 * Configure and start the express server, listening on localhost.
 */
async function runServer() {
  const port = parseNumber(process.env.PORT) ?? (await getPort({ port: 3000 }));
  const buildPathArg = process.argv[2];

  if (!buildPathArg) {
    log.error('Usage: express.server.js <application-build-path> -- e.g. ./build/express.server.js ./build/index.js');
    process.exit(1);
  }

  const buildPath = path.resolve(buildPathArg);
  const versionPath = path.resolve(buildPathArg, '..', 'version.txt');
  const build = await reimportServer(buildPath);
  const loggingOptions = {
    stream: {
      write: (str: string) => log.info(str.trim()),
    },
  };

  const app = express();
  app.disable('x-powered-by');
  app.use(compression());
  app.use(express.static('public', { maxAge: '1h' }));
  // since remix fingerprints assets served from build/ we can use aggressive caching
  app.use(build.publicPath, express.static(build.assetsBuildDirectory, { immutable: true, maxAge: '1y' }));
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'tiny', loggingOptions));
  app.set('trust proxy', true); // enable X-Forwarded-* header support to build OAuth callback URLs
  app.all('*', process.env.NODE_ENV === 'development' ? createDevRequestHandler(build, buildPath, versionPath) : createRequestHandler({ build, mode: process.env.NODE_ENV }));

  const server = app.listen(port, () => {
    log.info(`Server listening at http://localhost:${port}/`);
    if (process.env.NODE_ENV === 'development') {
      void broadcastDevReady(build);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    ['SIGTERM', 'SIGINT'].forEach((signal) => process.once(signal, () => server.close(log.error)));
  }
}

function createDevRequestHandler(initialBuild: ServerBuild, buildPath: string, versionPath: string) {
  let build = initialBuild;

  const handleServerUpdate = async () => {
    build = await reimportServer(buildPath);
    broadcastDevReady(build);
  };

  // prettier-ignore
  chokidar.watch(versionPath, { ignoreInitial: true })
    .on('add', handleServerUpdate)
    .on('change', handleServerUpdate);

  // wrap request handler to make sure its recreated
  // with the latest build for every request
  const requestHandler: RequestHandler = async (req, res, next) => {
    try {
      return createRequestHandler({ build, mode: 'development' })(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  return requestHandler;
}

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  const maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

function reimportServer(buildPath: string) {
  // TODO :: GjB :: do we need to bust the ESM import cache here?
  // use a timestamp query parameter to bust the import cache
  return import(url.pathToFileURL(buildPath).href + '?t=' + fs.statSync(buildPath).mtimeMs);
}
