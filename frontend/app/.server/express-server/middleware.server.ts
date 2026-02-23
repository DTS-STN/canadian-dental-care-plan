import type { Request } from 'express';
import type { RequestHandler } from 'express';
import { parse as parseCookie } from 'cookie';
import { unsign } from 'cookie-signature';
import sessionMiddleware from 'express-session';
import { minimatch } from 'minimatch';
import morganMiddleware from 'morgan';
import { randomUUID } from 'node:crypto';

import type { ServerConfig } from '~/.server/configs';
import { acquireSessionLock } from '~/.server/data/session-lock.service';
import { createMemoryStore, createRedisStore } from '~/.server/express-server/session.server';
import { createLogger } from '~/.server/logging';

/**
 * Checks if a given path should be ignored based on a list of ignore patterns.
 *
 * @param ignorePatterns - An array of glob patterns to match against the path.
 * @param path - The path to check.
 * @returns - True if the path should be ignored, false otherwise.
 */
function shouldIgnore(ignorePatterns: string[], path: string): boolean {
  return ignorePatterns.some((entry) => minimatch(path, entry, { dot: true }));
}

function shouldLockSessions(serverConfig: Pick<ServerConfig, 'SESSION_LOCK_ENABLED' | 'SESSION_STORAGE_TYPE'>): boolean {
  return serverConfig.SESSION_STORAGE_TYPE === 'redis' && serverConfig.SESSION_LOCK_ENABLED;
}

function unsignSessionCookie(rawCookieValue: string, secret: string): string | undefined {
  if (!rawCookieValue.startsWith('s:')) {
    return undefined;
  }

  const unsignedValue = unsign(rawCookieValue.slice(2), secret);
  return unsignedValue === false ? undefined : unsignedValue;
}

function extractSessionIdFromRequest(request: Request, serverConfig: Pick<ServerConfig, 'SESSION_COOKIE_NAME' | 'SESSION_COOKIE_SECRET'>): string | undefined {
  const { SESSION_COOKIE_NAME, SESSION_COOKIE_SECRET } = serverConfig;

  const cookieHeader = request.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookie(cookieHeader);
    const rawCookieValue = cookies[SESSION_COOKIE_NAME];

    if (rawCookieValue) {
      const sessionId = unsignSessionCookie(rawCookieValue, SESSION_COOKIE_SECRET);
      if (sessionId) {
        return sessionId;
      }
    }
  }

  if (request.signedCookies?.[SESSION_COOKIE_NAME]) {
    return request.signedCookies[SESSION_COOKIE_NAME] as string;
  }

  const rawCookieValue = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (!rawCookieValue) {
    return undefined;
  }

  return unsignSessionCookie(rawCookieValue, SESSION_COOKIE_SECRET);
}

// @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
export function securityHeaders(): RequestHandler {
  const log = createLogger('express.server/securityHeadersRequestHandler');
  const ignorePatterns: string[] = [];

  // prettier-ignore
  const permissionsPolicy = [
    'camera=()',
    'display-capture=()',
    'fullscreen=()',
    'geolocation=()',
    'interest-cohort=()',
    'microphone=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
  ].join(', ');

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping adding security headers to response: [%s]', request.path);
      return next();
    }

    log.debug('Adding security headers to response');

    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Permissions-Policy', permissionsPolicy);
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Server', 'webserver');
    response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'deny');

    next();
  };
}

export function logging(isProduction: boolean): RequestHandler {
  const log = createLogger('express.server/loggingRequestHandler');
  const ignorePatterns: string[] = ['/api/readyz'];

  const logFormat = isProduction ? 'tiny' : 'dev';

  const middleware = morganMiddleware(logFormat, {
    stream: { write: (msg) => log.info(msg.trim()) },
  });

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) return next();
    return middleware(request, response, next);
  };
}

/**
 * Configures session lock middleware for Redis-backed session stores.
 */
export function sessionLock(serverConfig: ServerConfig): RequestHandler {
  const log = createLogger('express.server/sessionLockRequestHandler');

  const ignorePatterns = [
    '/api/buildinfo', //
    '/api/health',
    '/api/readyz',
    '/.well-known/jwks.json',
    '/oidc/**',
  ];

  const { SESSION_LOCK_TTL_MS, SESSION_LOCK_WAIT_MS, SESSION_LOCK_RETRY_MS, SESSION_LOCK_ENABLED, SESSION_STORAGE_TYPE } = serverConfig;

  if (!shouldLockSessions(serverConfig)) {
    log.debug('Session lock disabled. storageType=[%s] lockEnabled=[%s]', SESSION_STORAGE_TYPE, SESSION_LOCK_ENABLED);
  } else {
    log.debug('Session lock enabled. storageType=[%s] ttlMs=[%s] waitMs=[%s] retryMs=[%s]', SESSION_STORAGE_TYPE, SESSION_LOCK_TTL_MS, SESSION_LOCK_WAIT_MS, SESSION_LOCK_RETRY_MS);
  }

  return async (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping session lock: [%s]', request.path);
      return next();
    }

    if (!shouldLockSessions(serverConfig)) {
      return next();
    }

    const sessionId = extractSessionIdFromRequest(request, serverConfig);
    if (!sessionId) {
      return next();
    }

    const sessionLock = await acquireSessionLock({
      sessionId,
      ttlMs: SESSION_LOCK_TTL_MS,
      waitMs: SESSION_LOCK_WAIT_MS,
      retryMs: SESSION_LOCK_RETRY_MS,
    });

    if (!sessionLock) {
      response.status(503).send('Unable to acquire session lock, please retry.');
      return;
    }

    let lockReleased = false;

    const releaseLock = async () => {
      if (lockReleased) {
        return;
      }

      lockReleased = true;

      try {
        await sessionLock.release();
      } catch (error) {
        log.error(error);
      }
    };

    response.once('finish', () => {
      void releaseLock();
    });

    response.once('close', () => {
      void releaseLock();
    });

    return next();
  };
}

/**
 * Configures session middleware, optionally skipping it for bots and specific paths.
 */
export async function session(isProduction: boolean, serverConfig: ServerConfig): Promise<RequestHandler> {
  const log = createLogger('express.server/sessionRequestHandler');

  const ignorePatterns = [
    '/api/buildinfo', //
    '/api/health',
    '/api/readyz',
    '/.well-known/jwks.json',
    '/oidc/**',
  ];

  const {
    SESSION_STORAGE_TYPE,
    SESSION_COOKIE_DOMAIN,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_PATH,
    SESSION_COOKIE_SAME_SITE,
    SESSION_COOKIE_SECRET,
    SESSION_COOKIE_SECURE,
  } = serverConfig;

  const sessionStore =
    SESSION_STORAGE_TYPE === 'redis' //
      ? await createRedisStore(serverConfig)
      : createMemoryStore();

  const middleware = sessionMiddleware({
    store: sessionStore,
    name: SESSION_COOKIE_NAME,
    secret: SESSION_COOKIE_SECRET,
    genid: () => randomUUID(),
    proxy: true,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: {
      domain: SESSION_COOKIE_DOMAIN,
      path: SESSION_COOKIE_PATH,
      secure: SESSION_COOKIE_SECURE ? isProduction : false,
      httpOnly: true,
      sameSite: SESSION_COOKIE_SAME_SITE,
    },
  });

  return async (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping session: [%s]', request.path);
      return next();
    }

    return await middleware(request, response, next);
  };
}
