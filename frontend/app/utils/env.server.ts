import { z } from 'zod';

const toBoolean = (val: string) => val === 'true';

/**
 * Environment variables that will be available to server only.
 */
const serverEnv = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  I18NEXT_DEBUG: z.string().transform(toBoolean).default('false'),
  // server configuration
  PORT: z.coerce.number().default(3000),
  // language cookie configuration
  LANG_COOKIE_NAME: z.string().default('_gc_lang'),
  LANG_COOKIE_DOMAIN: z.string().optional(),
  LANG_COOKIE_PATH: z.string().default('/'),
  LANG_COOKIE_HTTP_ONLY: z.string().transform(toBoolean).default('true'),
  LANG_COOKIE_SECURE: z.string().transform(toBoolean).default('true'),
  LANG_QUERY_PARAM: z.string().default('lang'),
  // feature flags
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
