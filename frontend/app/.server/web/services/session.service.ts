import { CookieParseOptions, CookieSerializeOptions, Session, SessionData, SessionStorage, createCookie, createSessionStorage } from '@remix-run/node';

import { inject, injectable } from 'inversify';
import { randomUUID } from 'node:crypto';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { RedisService } from '~/.server/data/services';
import type { LogFactory, Logger } from '~/.server/factories';
import { createFileSessionStorage } from '~/.server/utils/session.utils';

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

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory, @inject(TYPES.configs.ServerConfig) serverConfig: ServerConfig) {
    this.log = logFactory.createLogger(this.constructor.name);
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
  private readonly sessionStorage: SessionStorage;

  constructor(
    @inject(TYPES.data.services.RedisService) private readonly redisService: RedisService,
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) serverConfig: ServerConfig,
  ) {
    this.log = logFactory.createLogger(this.constructor.name);

    this.sessionStorage = createSessionStorage({
      cookie: createCookie(serverConfig.SESSION_COOKIE_NAME, {
        domain: serverConfig.SESSION_COOKIE_DOMAIN,
        path: serverConfig.SESSION_COOKIE_PATH,
        sameSite: serverConfig.SESSION_COOKIE_SAME_SITE,
        secrets: [serverConfig.SESSION_COOKIE_SECRET],
        httpOnly: serverConfig.SESSION_COOKIE_HTTP_ONLY,
        secure: serverConfig.SESSION_COOKIE_SECURE,
      }),
      createData: async (data): Promise<string> => {
        const sessionId = randomUUID();
        this.log.debug(`Creating new session storage slot with id=[${sessionId}]`);
        await this.redisService.set(sessionId, data, serverConfig.SESSION_EXPIRES_SECONDS);
        return sessionId;
      },
      readData: async (id): Promise<SessionData | null> => {
        this.log.debug(`Reading session data for session id=[${id}]`);
        return await this.redisService.get(id);
      },
      updateData: async (id, data): Promise<void> => {
        this.log.debug(`Updating session data for session id=[${id}]`);
        await this.redisService.set(id, data, serverConfig.SESSION_EXPIRES_SECONDS);
      },
      deleteData: async (id): Promise<void> => {
        this.log.debug(`Deleting all session data for session id=[${id}]`);
        await this.redisService.del(id);
      },
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
    return await this.sessionStorage.getSession(cookieHeader, options);
  }
}
