import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const toBoolean = (val: string) => val === 'true';

/**
 * Environment variables that will be available to server only.
 */
const serverEnv = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  I18NEXT_DEBUG: z.string().transform(toBoolean).default('false'),
  INTEROP_API_BASE_URI: z.string().url().default('https://api.example.com'),

  // language cookie settings
  LANG_COOKIE_NAME: z.string().default('_gc_lang'),
  LANG_COOKIE_DOMAIN: z.string().optional(),
  LANG_COOKIE_PATH: z.string().default('/'),
  LANG_COOKIE_HTTP_ONLY: z.string().transform(toBoolean).default('true'),
  LANG_COOKIE_SECURE: z.string().transform(toBoolean).default('true'),
  LANG_QUERY_PARAM: z.string().default('lang'),

  // session configuration
  SESSION_STORAGE_TYPE: z.enum(['file', 'redis']).default('file'),
  SESSION_EXPIRES_SECONDS: z.coerce.number().default(600),
  SESSION_COOKIE_NAME: z.string().trim().min(1).default('__CDCP//session'),
  SESSION_COOKIE_DOMAIN: z.string().trim().min(1).optional(),
  SESSION_COOKIE_PATH: z.string().trim().min(1).default('/'),
  SESSION_COOKIE_SECRET: z.string().trim().min(16).default(randomUUID()),
  SESSION_COOKIE_MAX_AGE: z.coerce.number().default(600),
  SESSION_COOKIE_HTTP_ONLY: z.string().transform(toBoolean).default('true'),
  SESSION_COOKIE_SECURE: z.string().transform(toBoolean).default('true'),
  SESSION_FILE_DIR: z.string().trim().min(1).default('./node_modules/cache/sessions/'),

  // redis server configuration
  REDIS_URL: z.string().trim().min(1).default('redis://localhost'),
  REDIS_USERNAME: z.string().trim().min(1).optional(),
  REDIS_PASSWORD: z.string().trim().min(1).optional(),

  // feature flags (ie: THING_ENABLED=true/false)
  JAVASCRIPT_ENABLED: z.string().transform(toBoolean).default('true'),
  MOCKS_ENABLED: z.string().transform(toBoolean).default('false'),
});

export type ServerEnv = z.infer<typeof serverEnv>;

/**
 * Environment variables that are safe to expose publicly.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
const publicEnv = serverEnv.pick({
  I18NEXT_DEBUG: true,
  LANG_QUERY_PARAM: true,
  JAVASCRIPT_ENABLED: true,
});

export type PublicEnv = z.infer<typeof publicEnv>;

export function getEnv() {
  const result = serverEnv.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid application configuration: ${result.error}`);
  }

  return result.data;
}

export function getPublicEnv() {
  const result = publicEnv.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid application configuration: ${result.error}`);
  }

  return result.data;
}
