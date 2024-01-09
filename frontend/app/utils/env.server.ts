import { z } from 'zod';

/**
 * Environment variables that will be available to server only.
 */
const serverEnv = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LANG_COOKIE_NAME: z.string().default('_gc_lang'),
  LANG_COOKIE_DOMAIN: z.string().optional(),
  LANG_COOKIE_PATH: z.string().default('/'),
  LANG_COOKIE_HTTP_ONLY: z.coerce.boolean().default(true),
  LANG_COOKIE_SECURE: z.coerce.boolean().default(true),
  LANG_QUERY_PARAM: z.string().default('lang'),
});

export type ServerEnv = z.infer<typeof serverEnv>;

/**
 * Environment variables that will be available to client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
const clientEnv = serverEnv.pick({
  LANG_QUERY_PARAM: true,
});

export type ClientEnv = z.infer<typeof clientEnv>;

export function getEnv() {
  const result = serverEnv.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid application configuration: ${result.error}`);
  }

  return result.data;
}

export function getClientEnv() {
  const result = clientEnv.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid application configuration: ${result.error}`);
  }

  return result.data;
}
