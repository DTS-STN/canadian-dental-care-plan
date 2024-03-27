import { createRemixRequest, sendRemixResponse } from '@remix-run/express/dist/server';
import type { ServerBuild } from '@remix-run/node';
import { broadcastDevReady, installGlobals, createRequestHandler as remixCreateRequestHandler } from '@remix-run/node';

import chokidar from 'chokidar';
import compression from 'compression';
import express, { NextFunction, Request, Response } from 'express';
import getPort from 'get-port';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import sourceMapSupport from 'source-map-support';

import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getLogger } from '~/utils/logging.server';

// instrumentation needs to be started as early as possible to ensure proper initialization
getInstrumentationService().startInstrumentation();

const log = getLogger('express.server');

installSourceMapSupport();
installGlobals();
runServer();

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
    log.error('Usage: express.server.ts <application-build-path> -- e.g. ./express.server.ts ./build/index.js');
    process.exit(1);
  }

  const buildPath = path.resolve(buildPathArg);
  const versionPath = path.resolve(buildPathArg, '..', 'version.txt');
  const build = await reimportServer(buildPath);
  const logFormat = process.env.NODE_ENV === 'development' ? 'dev' : 'tiny';

  const loggingRequestHandler = morgan(logFormat, {
    skip: (req, res) => {
      const ignoredUrls = ['/api/readyz'];
      return req.url ? ignoredUrls.includes(req.url) : false;
    },
    stream: {
      write: (str: string) => log.info(str.trim()),
    },
  });

  // @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
  const securityRequestHandler = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), display-capture=(), fullscreen=(), geolocation=(), interest-cohort=(), microphone=(), publickey-credentials-get=(), screen-wake-lock=()');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Server', 'webserver');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'deny');
    next();
  };

  // prettier-ignore
  const remixRequestHandler = process.env.NODE_ENV === 'development'
    ? await createDevRequestHandler(build, buildPath, versionPath)
    : await createRequestHandler(build, process.env.NODE_ENV);

  const app = express();
  // disable the X-Powered-By header to make it harder to fingerprint the server
  // (GjB :: yes, I acknowledge that this is rather moot, since our application is open source)
  app.disable('x-powered-by');
  // use gzip compression for all responses
  app.use(compression());
  // note: securityRequestHandler must execute before any static-content handlers
  app.use(securityRequestHandler);
  // serve static files from the 'public/' directory with a 1 hour cache-control
  app.use(express.static('public', { maxAge: '1h' }));
  // since remix fingerprints assets served from build/ we can use more aggressive caching
  app.use(build.publicPath, express.static(build.assetsBuildDirectory, { immutable: true, maxAge: '1y' }));
  // log all requests using the loggingRequestHandler
  app.use(loggingRequestHandler);
  // enable X-Forwarded-* header support to build OAuth callback URLs
  app.set('trust proxy', true);
  // hand off all requests processing to one of the remix request handlers
  app.all('*', remixRequestHandler);

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

async function createDevRequestHandler(initialBuild: ServerBuild, buildPath: string, versionPath: string) {
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
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestHandler = await createRequestHandler(build, 'development');
      return await requestHandler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Modified createRequestHandler(..) from Remix's express adapter that adds session support.
 * @see https://github.com/remix-run/remix/blob/main/packages/remix-express/server.ts
 */
async function createRequestHandler(build: ServerBuild, mode: string) {
  const sessionService = await getSessionService();
  const handleRequest = remixCreateRequestHandler(build, mode);

  return async (req: Request, res: Response, next: NextFunction) => {
    const session = await sessionService.getSession(req.headers.cookie);

    try {
      const remixResponse = await handleRequest(createRemixRequest(req, res), { session });
      remixResponse.headers.append('Set-Cookie', await sessionService.commitSession(session));

      await sendRemixResponse(res, remixResponse);
    } catch (error: unknown) {
      // Express doesn't support async functions, so we have to pass along the
      // error manually using next().
      next(error);
    }
  };
}

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  const maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

function reimportServer(buildPath: string): Promise<ServerBuild> {
  // TODO :: GjB :: do we need to bust the ESM import cache here?
  // use a timestamp query parameter to bust the import cache
  return import(url.pathToFileURL(buildPath).href + '?t=' + fs.statSync(buildPath).mtimeMs);
}
