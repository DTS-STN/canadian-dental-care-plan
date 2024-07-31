import compression from 'compression';
import morgan from 'morgan';
import { createExpressApp } from 'remix-create-express-app';

import { getEnv } from './utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

const { NODE_ENV } = getEnv();

const log = getLogger('express.server');
const logFormat = NODE_ENV === 'development' ? 'dev' : 'tiny';

const loggingRequestHandler = morgan(logFormat, {
  skip: (request) => {
    const ignoredUrls = ['/api/readyz'];
    return request.url ? ignoredUrls.includes(request.url) : false;
  },
  stream: {
    write: (str: string) => log.info(str.trim()),
  },
});

export const expressApp = await createExpressApp({
  unstable_middleware: true,
  configure: (app) => {
    // disable the X-Powered-By header to make it harder to fingerprint the server
    // (GjB :: yes, I acknowledge that this is rather moot, since our application is open source)
    app.disable('x-powered-by');
    // use gzip compression for all responses
    app.use(compression());
    // log all requests using the loggingRequestHandler
    app.use(loggingRequestHandler);
    // enable X-Forwarded-* header support to build OAuth callback URLs
    app.set('trust proxy', true);
  },
});
