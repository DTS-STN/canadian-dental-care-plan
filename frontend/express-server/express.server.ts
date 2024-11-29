// require by inversify to be the first import
import 'reflect-metadata';

import compression from 'compression';
import express from 'express';
import sourceMapSupport from 'source-map-support';

import { logging, securityHeaders } from './middleware.server';
import { globalErrorHandler, remixRequestHandler } from './request-handlers.server';
import { createViteDevServer } from './vite.server';
import { getEnv } from '~/.server/utils/env.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { server } from '~/mocks/node';
import { getInstrumentationService } from '~/services/instrumentation-service.server';

console.log('Starting Canadian Dental Care Plan server...');
const log = getLogger('express.server');

log.info('Validating runtime environment...');
const environment = getEnv();
log.info('Runtime environment validation passed 🎉');

// instrumentation needs to be started as early as possible to ensure proper initialization
log.info('Initializing instrumentation');
const instrumentationService = getInstrumentationService();
instrumentationService.startInstrumentation();

if (environment.ENABLED_MOCKS.length > 0) {
  server.listen({ onUnhandledRequest: 'bypass' });
  log.info('‼️ Mock Service Worker has been enabled with the following mocks: %s', environment.ENABLED_MOCKS);
}

const isProduction = environment.NODE_ENV === 'production';
const port = process.env.PORT ?? '3000'; // TODO :: add this to env schema

log.info('Installing source map support');
sourceMapSupport.install();

log.info(`Initializing %s mode express server...`, environment.NODE_ENV);
const viteDevServer = await createViteDevServer(isProduction);
const app = express();

log.info('  ✓ disabling X-Powered-By response header');
app.disable('x-powered-by');

log.info('  ✓ enabling reverse proxy support');
app.set('trust proxy', true);

log.info('  ‼️ configuring express middlewares...');

log.info('    ✓ compression middleware');
app.use(compression());

log.info('    ✓ logging middleware');
app.use(logging(isProduction));

if (isProduction) {
  log.info('    ✓ static assets middleware (production)');
  log.info('      ✓ caching /assets for 1y');
  app.use('/assets', express.static('./build/client/assets', { immutable: true, maxAge: '1y' }));
  log.info('      ✓ caching /locales for 1d');
  app.use('/locales', express.static('./build/client/locales', { maxAge: '1d' }));
  log.info('      ✓ caching remaining static content for 1y');
  app.use(express.static('./build/client', { maxAge: '1y' }));
} else {
  log.info('    ✓ static assets middleware (development)');
  log.info('      ✓ caching /locales for 1m');
  app.use('/locales', express.static('public/locales', { maxAge: '1m' }));
  log.info('      ✓ caching remaining static content for 1h');
  app.use(express.static('./build/client', { maxAge: '1h' }));
}

log.info('    ✓ security headers middleware');
app.use(securityHeaders());

if (viteDevServer) {
  log.info('    ✓ vite dev server middlewares');
  app.use(viteDevServer.middlewares);
}

log.info('  ✓ registering remix request handler');
app.all('*', remixRequestHandler(environment.NODE_ENV, viteDevServer));

log.info('  ✓ registering global error handler');
app.use(globalErrorHandler(isProduction));

log.info('Server initialization complete');
app.listen(port, () => log.info(`Listening on http://localhost:${port}/`));
