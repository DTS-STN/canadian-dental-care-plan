/**
 * SessionService is a service module responsible for managing user sessions.
 * Sessions can be stored in memory, as files on disk, or in a Redis database.
 *
 * All createSessionStorage() functions take a cookie object, which is used to
 * create browser's the session cookie. The session cookie is then used to track
 * the user's session.
 *
 * The SessionService module provides functions for creating, reading,
 * updating, and deleting session data.
 *
 * Example usage:
 *
 *    const sessionStorage = await getSessionService().createSessionStorage();
 *    const session = await sessionStorage.getSession(request);
 *    return json({}, {
 *      headers: {
 *        'Set-Cookie': await sessionStorage.commitSession(session)
 *      }
 *    });
 *
 * @see https://remix.run/docs/en/main/utils/sessions
 */
import { createCookie, createFileSessionStorage, createSessionStorage } from '@remix-run/node';

import moize from 'moize';
import { randomUUID } from 'node:crypto';

import { getRedisService } from '~/services/redis-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('session-service.server');

/**
 * Return a singleton instance (by means of memomization) of the session service.
 */
export const getSessionService = moize.promise(createSessionService, { onCacheAdd: () => log.info('Creating new session service') });

async function createSessionService() {
  const env = getEnv();

  const sessionCookie = createCookie(env.SESSION_COOKIE_NAME, {
    path: env.SESSION_COOKIE_PATH,
    domain: env.SESSION_COOKIE_DOMAIN,
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    secrets: [env.SESSION_COOKIE_SECRET],
    secure: env.SESSION_COOKIE_SECURE,
    httpOnly: env.SESSION_COOKIE_HTTP_ONLY,
  });

  switch (env.SESSION_STORAGE_TYPE) {
    case 'file': {
      log.warn('Using file-backed sessions. This is not recommended for production.');
      const sessionStorage = createFileSessionStorage({ cookie: sessionCookie, dir: env.SESSION_FILE_DIR });

      return {
        ...sessionStorage,
        getSession: async (request: Request) => {
          // BUG :: GjB :: **POTENTIALLY INCONSISTENT SESSION FILE READS**
          //
          // Under certain circumstances, reading the session store file using
          // `fs.readFile()` can sometimes return an empty string. The exact
          // cause of this behavior is unknown, but immediately retrying the
          // read seems to resolve the issue. As a temporary workaround,
          // a `try/catch` block is implemented to attempt reading the file twice.
          //
          // Since file-based sessions are intended to only be used during
          // development, I think this is an acceptable fix.
          //
          // @see node_modules/@remix-run/node/dist/sessions/fileStorage.js · async readData(id) { .. }
          try {
            return await sessionStorage.getSession(request.headers.get('Cookie'));
          } catch (error) {
            log.warn(`Session file read failed: [${error}]; retrying one time`);
            return await sessionStorage.getSession(request.headers.get('Cookie'));
          }
        },
      };
    }

    case 'redis': {
      log.info('Using Redis-backed sessions.');
      const sessionStorage = await createRedisSessionStorage();

      return {
        ...sessionStorage,
        getSession: async (request: Request) => {
          return await sessionStorage.getSession(request.headers.get('Cookie'));
        },
      };
    }

    default: {
      // this should never happen (because: typescript)
      throw new Error(`Unknown session storage type: ${env.SESSION_STORAGE_TYPE}`);
    }
  }

  async function createRedisSessionStorage() {
    const redisService = await getRedisService();
    const setCommandOptions = { EX: env.SESSION_EXPIRES_SECONDS };

    return createSessionStorage({
      cookie: sessionCookie,
      createData: async (data) => {
        const sessionId = randomUUID();
        log.debug(`Creating new session storage slot with id=[${sessionId}]`);
        await redisService.set(sessionId, data, setCommandOptions);
        return sessionId;
      },
      readData: async (id) => {
        log.debug(`Reading session data for session id=[${id}]`);
        return await redisService.get(id);
      },
      updateData: async (id, data) => {
        log.debug(`Updating session data for session id=[${id}]`);
        await redisService.set(id, data, setCommandOptions);
      },
      deleteData: async (id) => {
        log.debug(`Deleting all session data for session id=[${id}]`);
        await redisService.del(id);
      },
    });
  }
}
