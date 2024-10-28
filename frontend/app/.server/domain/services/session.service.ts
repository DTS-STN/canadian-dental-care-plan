import { Cookie, CookieParseOptions, CookieSerializeOptions, Session, SessionStorage, createCookie, createSessionStorage } from '@remix-run/node';

import { inject, injectable } from 'inversify';
import { randomUUID } from 'node:crypto';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { getRedisService } from '~/services/redis-service.server';
import { createFileSessionStorage } from '~/utils/session-utils.server';

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
 * @see https://remix.run/docs/en/main/utils/sessions
 */
export interface SessionService {
  /**
   * Stores all data in the Session and returns the Set-Cookie header to be used in the HTTP response.
   */
  commitSession: (session: Session, options?: CookieSerializeOptions) => Promise<string>;
  /**
   * Deletes all data associated with the Session and returns the Set-Cookie header to be used in the HTTP response.
   */
  destroySession: (session: Session, options?: CookieSerializeOptions) => Promise<string>;
  /**
   * Parses a Cookie header from a HTTP request and returns the associated
   * Session. If there is no session associated with the cookie, this will
   * return a new Session with no data.
   */
  getSession: (cookieHeader?: string | null, options?: CookieParseOptions) => Promise<Session>;
}

@injectable()
export class FileSessionService implements SessionService {
  private readonly log: Logger;
  private readonly sessionStorage: SessionStorage;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory, @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) serverConfig: ServerConfig) {
    this.log = logFactory.createLogger('FileSessionService');
    this.sessionStorage = createFileSessionStorage({
      cookie: createCookie(serverConfig.SESSION_COOKIE_NAME, {
        domain: serverConfig.SESSION_COOKIE_DOMAIN,
        path: serverConfig.SESSION_COOKIE_PATH,
        sameSite: serverConfig.SESSION_COOKIE_SAME_SITE,
        secrets: [serverConfig.SESSION_COOKIE_SECRET],
        httpOnly: serverConfig.SESSION_COOKIE_HTTP_ONLY,
        secure: serverConfig.SESSION_COOKIE_SECURE,
      }),
      dir: serverConfig.SESSION_FILE_DIR,
    });
  }

  async commitSession(session: Session, options?: CookieSerializeOptions): Promise<string> {
    return await this.sessionStorage.commitSession(session, options);
  }

  async destroySession(session: Session, options?: CookieSerializeOptions): Promise<string> {
    Object.keys(session.data).forEach((key) => session.unset(key));
    return await this.sessionStorage.destroySession(session, options);
  }

  async getSession(cookieHeader?: string | null, options?: CookieParseOptions): Promise<Session> {
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
      return await this.sessionStorage.getSession(cookieHeader, options);
    } catch (error) {
      this.log.warn(`Session file read failed: [${error}]; retrying one time`);
      return await this.sessionStorage.getSession(cookieHeader, options);
    }
  }
}

@injectable()
export class RedisSessionService implements SessionService {
  private readonly log: Logger;
  private readonly sessionStorage: Promise<SessionStorage>;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory, @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) serverConfig: ServerConfig) {
    this.log = logFactory.createLogger('RedisSessionService');
    this.sessionStorage = this.createRedisSessionStorage(
      createCookie(serverConfig.SESSION_COOKIE_NAME, {
        domain: serverConfig.SESSION_COOKIE_DOMAIN,
        path: serverConfig.SESSION_COOKIE_PATH,
        sameSite: serverConfig.SESSION_COOKIE_SAME_SITE,
        secrets: [serverConfig.SESSION_COOKIE_SECRET],
        httpOnly: serverConfig.SESSION_COOKIE_HTTP_ONLY,
        secure: serverConfig.SESSION_COOKIE_SECURE,
      }),
      serverConfig.SESSION_EXPIRES_SECONDS,
    );
  }

  async commitSession(session: Session, options?: CookieSerializeOptions): Promise<string> {
    const sessionStorage = await this.sessionStorage;
    return await sessionStorage.commitSession(session, options);
  }

  async destroySession(session: Session, options?: CookieSerializeOptions): Promise<string> {
    Object.keys(session.data).forEach((key) => session.unset(key));
    return await (await this.sessionStorage).destroySession(session, options);
  }

  async getSession(cookieHeader?: string | null, options?: CookieParseOptions): Promise<Session> {
    return await (await this.sessionStorage).getSession(cookieHeader, options);
  }

  private async createRedisSessionStorage(cookie: Cookie, ttlSecs: number) {
    const redisService = await getRedisService();

    return createSessionStorage({
      cookie,
      createData: async (data) => {
        const sessionId = randomUUID();
        this.log.debug(`Creating new session storage slot with id=[${sessionId}]`);
        await redisService.set(sessionId, data, ttlSecs);
        return sessionId;
      },
      readData: async (id) => {
        this.log.debug(`Reading session data for session id=[${id}]`);
        return await redisService.get(id);
      },
      updateData: async (id, data) => {
        this.log.debug(`Updating session data for session id=[${id}]`);
        await redisService.set(id, data, ttlSecs);
      },
      deleteData: async (id) => {
        this.log.debug(`Deleting all session data for session id=[${id}]`);
        await redisService.del(id);
      },
    });
  }
}
