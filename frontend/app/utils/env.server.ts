import { DiagLogLevel } from '@opentelemetry/api';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { privateKeyPemToCryptoKey, publicKeyPemToCryptoKey } from './crypto-utils.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('env.server');

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

const validMockNames = ['cct', 'lookup', 'power-platform', 'raoidc', 'status-check', 'wsaddress'] as const;
export type MockName = (typeof validMockNames)[number];

const validFeatureNames = ['doc-upload', 'email-alerts', 'hcaptcha', 'update-personal-info', 'view-applications', 'view-letters', 'view-messages'] as const;
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

  // lookup identifiers
  CANADA_COUNTRY_ID: z.string().trim().min(1).default('0cf5389e-97ae-eb11-8236-000d3af4bfc3'),
  COMMUNICATION_METHOD_EMAIL_ID: z.string().trim().min(1).default('775170000'),
  FIRST_NATIONS_YES_TYPE_ID: z.string().trim().min(1).default('first-nations-yes'),
  OTHER_EQUITY_TYPE_ID: z.string().trim().min(1).default('equity-other'),
  OTHER_GENDER_TYPE_ID: z.string().trim().min(1).default('gender-other'),
  USA_COUNTRY_ID: z.string().trim().min(1).default('fcf7389e-97ae-eb11-8236-000d3af4bfc3'),
  CLIENT_STATUS_SUCCESS_ID: z.string().trim().min(1).default('51af5170-614e-ee11-be6f-000d3a09d640'),

  // language codes
  ENGLISH_LANGUAGE_CODE: z.coerce.number().default(1033),
  FRENCH_LANGUAGE_CODE: z.coerce.number().default(1036),

  // marital status codes
  MARITAL_STATUS_CODE_MARRIED: z.coerce.number().default(775170001),
  MARITAL_STATUS_CODE_COMMONLAW:z.coerce.number().default(775170002),

  // interop api settings
  INTEROP_API_BASE_URI: z.string().url(),
  INTEROP_API_SUBSCRIPTION_KEY: z.string().trim().min(1),
  INTEROP_APPLICANT_API_BASE_URI: z.string().trim().transform(emptyToUndefined).optional(),
  INTEROP_APPLICANT_API_SUBSCRIPTION_KEY: z.string().trim().transform(emptyToUndefined).optional(),
  INTEROP_BENEFIT_APPLICATION_API_BASE_URI: z.string().trim().transform(emptyToUndefined).optional(),
  INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY: z.string().trim().transform(emptyToUndefined).optional(),
  INTEROP_CCT_API_BASE_URI: z.string().trim().transform(emptyToUndefined).optional(),
  INTEROP_CCT_API_SUBSCRIPTION_KEY: z.string().trim().transform(emptyToUndefined).optional(),
  INTEROP_CCT_API_COMMUNITY: z.string().default('CDCP'),
  INTEROP_STATUS_CHECK_API_BASE_URI: z.string().trim().transform(emptyToUndefined).optional(),
  INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY: z.string().trim().transform(emptyToUndefined).optional(),

  SHOW_SIN_EDIT_STUB_PAGE : z.string().transform(toBoolean).default('false'),

  // base URIs for My Service Canada Account variations
  SCCH_BASE_URI: z.string().url().default('https://service.canada.ca'),
  MSCA_BASE_URI: z.string().url().default('https://srv136.services.gc.ca'),

  // auth/oidc settings
  AUTH_JWT_PRIVATE_KEY: z.string().refine(isValidPrivateKey),
  AUTH_JWT_PUBLIC_KEY: z.string().refine(isValidPublicKey),
  AUTH_LOGOUT_REDIRECT_URL: z.string().url(),
  AUTH_RAOIDC_BASE_URL: z.string().trim().min(1),
  AUTH_RAOIDC_CLIENT_ID: z.string().trim().min(1),
  AUTH_RAOIDC_PROXY_URL: z.string().trim().transform(emptyToUndefined).optional(),
  AUTH_RASCL_LOGOUT_URL: z.string().trim().min(1),

  // hCaptcha settings
  HCAPTCHA_MAX_SCORE: z.coerce.number().default(0.79),
  HCAPTCHA_SECRET_KEY: z.string().trim().min(1),
  HCAPTCHA_SITE_KEY: z.string().trim().min(1),
  HCAPTCHA_VERIFY_URL: z.string().url().default('https://api.hcaptcha.com/siteverify'),

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
  REDIS_SENTINEL_NAME: z.string().trim().transform(emptyToUndefined).optional(),
  REDIS_SENTINEL_HOST: z.string().trim().transform(emptyToUndefined).optional(),
  REDIS_SENTINEL_PORT: z.coerce.number().optional(),
  REDIS_STANDALONE_HOST: z.string().trim().min(1).default('localhost'),
  REDIS_STANDALONE_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().trim().min(1).optional(),
  REDIS_PASSWORD: z.string().trim().min(1).optional(),

  // mocks settings
  ENABLED_MOCKS: z.string().transform(emptyToUndefined).transform(csvToArray).refine(areValidMockNames).default(''),
  MOCK_AUTH_ALLOWED_REDIRECTS: z.string().transform(emptyToUndefined).transform(csvToArray).default('http://localhost:3000/auth/callback/raoidc'),

  // cache duration settings
  LOOKUP_SVC_ALL_AVOIDED_DENTAL_COST_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_BORN_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_CLIENT_FRIENDLY_STATUSES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_DISABILITY_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_EQUITY_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_FEDERAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_GENDER_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_INDIGENOUS_GROUP_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_INDIGENOUS_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_LAST_TIME_DENTIST_VISIT_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_MOUTH_PAIN_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_PROVINCIAL_TERRITORIAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_REGIONS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_SEX_AT_BIRTH_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
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
  OTEL_USE_CONSOLE_EXPORTERS: z.string().transform(toBoolean).default('false'),

  // Adobe Analytics scripts
  ADOBE_ANALYTICS_SRC: z.string().url().optional(),
  ADOBE_ANALYTICS_JQUERY_SRC: z.string().url().default('https://code.jquery.com/jquery-3.7.1.min.js')
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
  MSCA_BASE_URI: true,
  SESSION_TIMEOUT_SECONDS: true,
  SESSION_TIMEOUT_PROMPT_SECONDS: true,
  ADOBE_ANALYTICS_SRC: true,
  ADOBE_ANALYTICS_JQUERY_SRC: true,
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
 * A helper function to be used in actions and loaders that checks if a feature
 * is enabled. If the feature is not enabled, a 404 response will be thrown.
 */
export function featureEnabled(feature: FeatureName) {
  const { ENABLED_FEATURES } = getEnv();
  if (!ENABLED_FEATURES.includes(feature)) {
    log.warn('Feature [%s] is not enabled; returning 404 response', feature);
    throw new Response(null, { status: 404 });
  }
}

/**
 * Return true if the given mock is enabled
 */
export function mockEnabled(mock: MockName) {
  const { ENABLED_MOCKS } = getEnv();
  return ENABLED_MOCKS.includes(mock);
}
