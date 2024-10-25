import type { Session } from '@remix-run/node';
import { sign } from '@remix-run/node/dist/crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import { FileSessionService, RedisSessionService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';
import { getRedisService } from '~/services/redis-service.server';

describe('FileSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  vi.mock('~/utils/session-utils.server', () => ({
    createFileSessionStorage: vi.fn().mockReturnValue({
      commitSession: vi.fn(),
      destroySession: vi.fn(),
      getSession: vi.fn(),
    }),
  }));

  const fileSessionService = new FileSessionService(
    mock<LogFactory>({
      createLogger: vi.fn().mockReturnValue(mock<Logger>()),
    }),
    mock<ServerConfig>({
      SESSION_COOKIE_NAME: 'session',
      SESSION_COOKIE_DOMAIN: 'example.com',
      SESSION_COOKIE_PATH: '/',
      SESSION_COOKIE_SAME_SITE: 'strict',
      SESSION_COOKIE_SECRET: 'secret',
      SESSION_COOKIE_HTTP_ONLY: true,
      SESSION_COOKIE_SECURE: true,
      SESSION_FILE_DIR: '/tmp',
    }),
  );

  describe('commitSession', () => {
    it('should call sessionStorage.commitSession()', async () => {
      await fileSessionService.commitSession(mock<Session>());
      expect(fileSessionService['sessionStorage'].commitSession).toHaveBeenCalled();
    });
  });

  describe('destroySession', () => {
    it('should call sessionStorage.destroySession()', async () => {
      await fileSessionService.destroySession(mock<Session>());
      expect(fileSessionService['sessionStorage'].destroySession).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should call sessionStorage.getSession()', async () => {
      await fileSessionService.getSession();
      expect(fileSessionService['sessionStorage'].getSession).toHaveBeenCalled();
    });
  });
});

describe('RedisSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  vi.mock('~/services/redis-service.server', () => ({
    getRedisService: vi.fn().mockResolvedValue({
      del: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
    }),
  }));

  const redisSessionService = new RedisSessionService(
    mock<LogFactory>({
      createLogger: vi.fn().mockReturnValue(mock<Logger>()),
    }),
    mock<ServerConfig>({
      SESSION_COOKIE_NAME: 'session',
      SESSION_COOKIE_DOMAIN: 'example.com',
      SESSION_COOKIE_PATH: '/',
      SESSION_COOKIE_SAME_SITE: 'strict',
      SESSION_COOKIE_SECRET: 'secret',
      SESSION_COOKIE_HTTP_ONLY: true,
      SESSION_COOKIE_SECURE: true,
      SESSION_EXPIRES_SECONDS: 3600,
    }),
  );

  describe('commitSession', () => {
    it('should call redisService.set()', async () => {
      const redisService = await getRedisService();
      await redisSessionService.commitSession(mock<Session>());
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('destroySession', () => {
    it('should call redisService.del()', async () => {
      const redisService = await getRedisService();
      await redisSessionService.destroySession(mock<Session>());
      expect(redisService.del).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should call redisService.get()', async () => {
      const redisService = await getRedisService();

      //
      // the following encoded session data was acquired by debugging
      // node_modules/@remix-run/server-runtime/dist/cookies.js
      // and adding a watch on encodeData('00000000-0000-0000-0000-000000000000')
      //
      const encodedSessionData = 'IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCI=';
      const signedSessionData = await sign(encodedSessionData, 'secret');

      await redisSessionService.getSession(`session=${signedSessionData}`);
      expect(redisService.get).toHaveBeenCalled();
    });
  });
});
