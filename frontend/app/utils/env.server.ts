import { DiagLogLevel } from '@opentelemetry/api';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { privateKeyPemToCryptoKey, publicKeyPemToCryptoKey } from './crypto-utils.server';

// none, error, warn, info, debug, verbose, all
const otelLogLevels = Object.keys(DiagLogLevel).map((key) => key.toLowerCase());

/**
 * returns false if and only if the passed-in function throws
 */
function tryOrElseFalse(fn: () => unknown) {
  // prettier-ignore
  try { fn(); return true; }
  catch { return false; }
}

const validMockNames = ['cct', 'lookup', 'power-platform', 'raoidc', 'wsaddress'] as const;
export type MockName = (typeof validMockNames)[number];

const validFeatureNames = ['demographic-questions', 'doc-upload', 'email-alerts', 'update-personal-info', 'view-applications', 'view-letters', 'view-messages'] as const;
export type FeatureName = (typeof validFeatureNames)[number];

// refiners
const areValidFeatureNames = (arr: Array<string>) => arr.every((featureName) => validFeatureNames.includes(featureName as FeatureName));
const areValidMockNames = (arr: Array<string>) => arr.every((mockName) => validMockNames.includes(mockName as MockName));
const isValidPublicKey = (val: string) => tryOrElseFalse(() => publicKeyPemToCryptoKey(val));
const isValidPrivateKey = (val: string) => tryOrElseFalse(() => privateKeyPemToCryptoKey(val));

// transformers
const csvToArray = (csv?: string) => csv?.split(',').map((str) => str.trim()) ?? [];
const emptyToUndefined = (val?: string) => (val === '' ? undefined : val);
const toBoolean = (val?: string) => val === 'true';

/**
 * Environment variables that will be available to server only.
 */
// prettier-ignore
const serverEnv = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  ENABLED_FEATURES: z.string().transform(emptyToUndefined).transform(csvToArray).refine(areValidFeatureNames).default(validFeatureNames.join(',')),
  I18NEXT_DEBUG: z.string().transform(toBoolean).default('false'),
  COMMUNICATION_METHOD_EMAIL_ID: z.string().trim().min(1).default('email'),
  OTHER_GENDER_TYPE_ID: z.string().trim().min(1).default('gender-other'),
  COUNTRY_CODE_CANADA: z.string().trim().min(1).default('CAN'),
  COUNTRY_CODE_USA: z.string().trim().min(1).default('USA'),
  OTHER_EQUITY_TYPE_ID: z.string().trim().min(1).default('equity-other'),
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

  // hCaptcha settings
  HCAPTCHA_SECRET_KEY: z.string().trim().min(1),
  HCAPTCHA_SITE_KEY: z.string().trim().min(1),
  HCAPTCHA_VERIFY_URL: z.string().url(),

  // language cookie settings
  LANG_COOKIE_NAME: z.string().default('__CDCP//lang'),
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
  SESSION_COOKIE_HTTP_ONLY: z.string().transform(toBoolean).default('true'),
  SESSION_COOKIE_SECURE: z.string().transform(toBoolean).default('true'),
  SESSION_FILE_DIR: z.string().trim().min(1).default('./node_modules/cache/sessions/'),
  SESSION_TIMEOUT_SECONDS: z.coerce.number().min(0).default(19 * 60),
  SESSION_TIMEOUT_PROMPT_SECONDS: z.coerce.number().min(0).default(5 * 60),

  // redis server configuration
  REDIS_URL: z.string().trim().min(1).default('redis://localhost'),
  REDIS_USERNAME: z.string().trim().min(1).optional(),
  REDIS_PASSWORD: z.string().trim().min(1).optional(),

  // mocks settings
  ENABLED_MOCKS: z.string().transform(emptyToUndefined).transform(csvToArray).refine(areValidMockNames).default(''),
  MOCK_AUTH_ALLOWED_REDIRECTS: z.string().transform(emptyToUndefined).transform(csvToArray).default('http://localhost:3000/auth/callback/raoidc'),

  // CCT get PDF settings
  CCT_VAULT_COMMUNITY: z.string().default('community_default'),

  // Memo cache max age
  LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_PREFERREDLANGUAGE_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLCOUNTRIES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLREGIONS_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLBORNTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLDISABILITYTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLSEXATBIRTHTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_MARITALSTATUSES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLMOUTHPAINTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_LASTTIMEDENTISTVISITTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_AVOIDEDDENTALCOSTTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_GENDERTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_TAXFILINGINDICATIONS_CACHE_TTL_MILLISECONDS:  z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_APPLICATIONTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLFEDERALBENEFITS_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLFEDERALSOCIALPROGRAMS_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_ALLEQUITYTYPES_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_PROVINCIAL_TERRITORIAL_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  LOOKUP_SVC_PROVINCIAL_TERRITORIAL_SOCIALPROGRAMS_CACHE_TTL_MILLISECONDS: z.coerce.number().default(60 * 60 * 1000),
  
  GET_ALL_LETTER_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),

  // OpenTelemetry/Dynatrace settings
  OTEL_LOG_LEVEL: z.string().refine((val) => otelLogLevels.includes(val)).default('info'),
  OTEL_API_KEY: z.string().trim().transform(emptyToUndefined).optional(),
  OTEL_ENVIRONMENT: z.string().trim().min(1).default('local'),
  OTEL_METRICS_ENDPOINT: z.string().trim().transform(emptyToUndefined).optional(),
  OTEL_METRICS_EXPORT_INTERVAL_MILLIS: z.coerce.number().default(60 * 1000),
  OTEL_METRICS_EXPORT_TIMEOUT_MILLIS: z.coerce.number().default(30 * 1000),
  OTEL_SERVICE_NAME: z.string().trim().min(1).default('canadian-dental-care-plan'),
  OTEL_TRACES_ENDPOINT: z.string().trim().transform(emptyToUndefined).optional(),
  OTEL_USE_CONSOLE_EXPORTERS: z.string().transform(toBoolean).default('false')
});

export type ServerEnv = z.infer<typeof serverEnv>;

/**
 * Environment variables that are safe to expose publicly.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
const publicEnv = serverEnv.pick({
  ENABLED_FEATURES: true,
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

/**
 * Return true if the given feature flag is enabled
 */
export function featureEnabled(feature: FeatureName) {
  const { ENABLED_FEATURES } = getEnv();
  return ENABLED_FEATURES.includes(feature);
}

/**
 * Return true if the given mock is enabled
 */
export function mockEnabled(mock: MockName) {
  const { ENABLED_MOCKS } = getEnv();
  return ENABLED_MOCKS.includes(mock);
}
