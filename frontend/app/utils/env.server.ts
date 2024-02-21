import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { privateKeyPemToCryptoKey, publicKeyPemToCryptoKey } from './crypto-utils.server';

/**
 * returns false if and only if the passed-in function throws
 */
function tryOrElseFalse(fn: () => unknown) {
  // prettier-ignore
  try { fn(); return true; }
  catch { return false; }
}

// @see app/mocks/node.ts
const validMockNames = ['cct', 'lookup', 'power-platform', 'raoidc', 'wsaddress'];

// refiners
const areValidMockNames = (arr: Array<string>) => arr.every((str) => validMockNames.includes(str));
const isValidPublicKey = (val: string) => tryOrElseFalse(() => publicKeyPemToCryptoKey(val));
const isValidPrivateKey = (val: string) => tryOrElseFalse(() => privateKeyPemToCryptoKey(val));

// transformers
const csvToArray = (csv?: string) => csv?.split(',').map((str) => str.trim()) ?? [];
const emptyToUndefined = (val?: string) => (val === '' ? undefined : val);
const toBoolean = (val?: string) => val === 'true';

/**
 * Environment variables that will be available to server only.
 */
const serverEnv = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  I18NEXT_DEBUG: z.string().transform(toBoolean).default('false'),

  // TODO :: GjB :: these base URIs should not have defaults
  INTEROP_API_BASE_URI: z.string().url().default('https://api.example.com'),
  CCT_API_BASE_URI: z.string().url().default('https://api.example.com'),
  SCCH_BASE_URI: z.string().url().default('https://www.example.com'),

  // auth/oidc settings
  AUTH_JWT_PRIVATE_KEY: z.string().refine(isValidPrivateKey),
  AUTH_JWT_PUBLIC_KEY: z.string().refine(isValidPublicKey),
  AUTH_LOGOUT_REDIRECT_URL: z.string().url(),
  AUTH_RAOIDC_BASE_URL: z.string().trim().min(1),
  AUTH_RAOIDC_CLIENT_ID: z.string().trim().min(1),
  AUTH_RAOIDC_PROXY_URL: z.string().trim().transform(emptyToUndefined).optional(),
  AUTH_RASCL_LOGOUT_URL: z.string().trim().min(1),

  // language cookie settings
  LANG_COOKIE_NAME: z.string().default('_gc_lang'),
  LANG_COOKIE_DOMAIN: z.string().optional(),
  LANG_COOKIE_PATH: z.string().default('/'),
  LANG_COOKIE_HTTP_ONLY: z.string().transform(toBoolean).default('true'),
  LANG_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  LANG_COOKIE_SECURE: z.string().transform(toBoolean).default('true'),
  LANG_QUERY_PARAM: z.string().default('lang'),

  // session configuration
  SESSION_STORAGE_TYPE: z.enum(['file', 'redis']).default('file'),
  SESSION_EXPIRES_SECONDS: z.coerce.number().default(1200),
  SESSION_COOKIE_NAME: z.string().trim().min(1).default('__CDCP//session'),
  SESSION_COOKIE_DOMAIN: z.string().trim().min(1).optional(),
  SESSION_COOKIE_PATH: z.string().trim().min(1).default('/'),
  SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  SESSION_COOKIE_SECRET: z.string().trim().min(16).default(randomUUID()),
  SESSION_COOKIE_MAX_AGE_SECONDS: z.coerce.number().default(1200),
  SESSION_COOKIE_HTTP_ONLY: z.string().transform(toBoolean).default('true'),
  SESSION_COOKIE_SECURE: z.string().transform(toBoolean).default('true'),
  SESSION_FILE_DIR: z.string().trim().min(1).default('./node_modules/cache/sessions/'),
  SESSION_TIMEOUT_SECONDS: z.coerce
    .number()
    .min(0)
    .default(19 * 60),
  SESSION_TIMEOUT_PROMPT_SECONDS: z.coerce
    .number()
    .min(0)
    .default(5 * 60),

  // redis server configuration
  REDIS_URL: z.string().trim().min(1).default('redis://localhost'),
  REDIS_USERNAME: z.string().trim().min(1).optional(),
  REDIS_PASSWORD: z.string().trim().min(1).optional(),

  // mocks settings
  ENABLED_MOCKS: z.string().transform(emptyToUndefined).transform(csvToArray).refine(areValidMockNames).default(''),
  MOCK_AUTH_ALLOWED_REDIRECTS: z.string().transform(emptyToUndefined).transform(csvToArray).default('http://localhost:3000/auth/callback/raoidc'),

  // CCT get PDF settings
  CCT_VAULT_COMMUNITY: z.string().default('community_default'),
});

export type ServerEnv = z.infer<typeof serverEnv>;

/**
 * Environment variables that are safe to expose publicly.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
const publicEnv = serverEnv.pick({
  I18NEXT_DEBUG: true,
  LANG_QUERY_PARAM: true,
  SCCH_BASE_URI: true,
  SESSION_TIMEOUT_SECONDS: true,
  SESSION_TIMEOUT_PROMPT_SECONDS: true,
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
