import compression from 'compression';
import express from 'express';
import sourceMapSupport from 'source-map-support';

import { routeRequestCounter } from '~/.server/express-server/instrumentation.server';
import { logging, securityHeaders, session } from '~/.server/express-server/middleware.server';
import { globalErrorHandler, rrRequestHandler } from '~/.server/express-server/request-handlers.server';
import { createViteDevServer } from '~/.server/express-server/vite.server';
import { createLogger } from '~/.server/logging';
import { getEnv } from '~/.server/utils/env.utils';

console.log('Starting Canadian Dental Care Plan server...');
const log = createLogger('express.server');

log.info('Validating runtime environment...');
const environment = getEnv();
log.info('Runtime environment validation passed 🎉');

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

log.info('    ✓ session middleware (%s)', environment.SESSION_STORAGE_TYPE);
app.use(await session(isProduction, environment));

if (viteDevServer) {
  log.info('    ✓ vite dev server middlewares');
  app.use(viteDevServer.middlewares);
}

log.info('  ✓ registering route request counter');
app.use(await routeRequestCounter(viteDevServer));

log.info('  ✓ registering react router request handler');

/**
 * Redirect Protected Renewals
 *
 * Catches all HTTP requests for protected renewal pages in both English and French
 * and temporarily redirects them to the corresponding "apply" pages.
 *
 * This is intended as a temporary fix until the "renew" and "apply" user flows are merged.
 *
 * TODO: Remove this redirect on the next major release when the renewal and apply functionalities are merged.
 */
app.all(['/:lang/protected/renew{/*splat}', '/:lang/protege/renouveler{/*splat}'], (req, res) => {
  if (req.params.lang === 'fr') {
    // Redirect French protected renewal requests to the French protected application page.
    res.redirect(`/${req.params.lang}/protege/demander`);
    return;
  }
  // Redirect other protected renewal requests to the protected application page.
  res.redirect(`/${req.params.lang}/protected/apply`);
});

/**
 * Redirect Public Renewals
 *
 * Catches all HTTP requests for public renewal pages in both English and French
 * and temporarily redirects them to the corresponding "apply" pages.
 *
 * This is a temporary measure to handle the transition of merging "renew" and "apply" functionalities.
 *
 * TODO: Remove this redirect on the next major release when the renewal and apply functionalities are merged.
 */
app.all(['/:lang/renew{/*splat}', '/:lang/renouveler{/*splat}'], (req, res) => {
  if (req.params.lang === 'fr') {
    // Redirect French public renewal requests to the French public application page.
    res.redirect(`/${req.params.lang}/demander`);
    return;
  }
  // Redirect other public renewal requests to the public application page.
  res.redirect(`/${req.params.lang}/apply`);
});

app.all('*splat', rrRequestHandler(environment.NODE_ENV, viteDevServer));

log.info('  ✓ registering global error handler');
app.use(globalErrorHandler(isProduction));

log.info('Server initialization complete');
app.listen(port, () => log.info(`Listening on http://localhost:${port}/`));
