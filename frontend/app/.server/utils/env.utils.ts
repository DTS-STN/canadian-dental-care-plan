import { DiagLogLevel } from '@opentelemetry/api';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { generateCryptoKey } from '~/.server/utils/crypto.utils';
import { clientEnvSchema } from '~/utils/env-utils';

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

const validMockNames = ['cct', 'power-platform', 'raoidc', 'status-check', 'wsaddress'] as const;
export type MockName = (typeof validMockNames)[number];

// refiners
const areValidMockNames = (arr: Array<string>): arr is Array<MockName> => arr.every((mockName) => validMockNames.includes(mockName as MockName));
const isValidPublicKey = (val: string) => tryOrElseFalse(() => generateCryptoKey(val, 'verify'));
const isValidPrivateKey = (val: string) => tryOrElseFalse(() => generateCryptoKey(val, 'sign'));

// transformers
const csvToArray = (csv?: string) => csv?.split(',').map((str) => str.trim()) ?? [];
const emptyToUndefined = (val?: string) => (val === '' ? undefined : val);
const toBoolean = (val?: string) => val === 'true';

/**
 * Environment variables that will be available to server only.
 */
// prettier-ignore
const serverEnv = clientEnvSchema.extend({
  NODE_ENV: z.enum(['production', 'development', 'test']),

  // applicant category codes
  APPLICANT_CATEGORY_CODE_INDIVIDUAL: z.coerce.number().default(775170000),
  APPLICANT_CATEGORY_CODE_FAMILY: z.coerce.number().default(775170001),
  APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY: z.coerce.number().default(775170002),

  // province/territory lookup identifiers
  ALBERTA_PROVINCE_ID: z.string().trim().min(1).default("3b17d494-35b3-eb11-8236-0022486d8d5f"),
  BRITISH_COLUMBIA_PROVINCE_ID: z.string().trim().min(1).default("9c440baa-35b3-eb11-8236-0022486d8d5f"),
  MANITOBA_PROVINCE_ID: z.string().trim().min(1).default("6d861c55-36b3-eb11-8236-0022486d8d5f"),
  NEW_BRUNSWICK_PROVINCE_ID: z.string().trim().min(1).default("23dc27a2-36b3-eb11-8236-0022486d8d5f"),
  NOVA_SCOTIA_PROVINCE_ID: z.string().trim().min(1).default("fc2243c9-36b3-eb11-8236-0022486d8d5f"),
  ONTARIO_PROVINCE_ID: z.string().trim().min(1).default("daf4d05b-37b3-eb11-8236-0022486d8d5f"),
  QUEBEC_PROVINCE_ID: z.string().trim().min(1).default("39449f70-37b3-eb11-8236-0022486d8d5f"),
  SASKATCHEWAN_PROVINCE_ID: z.string().trim().min(1).default("5bc09caf-38b3-eb11-8236-0022486d8d5f"),
  NEWFOUNDLAND_PROVINCE_ID: z.string().trim().min(1).default("5abc28c9-38b3-eb11-8236-0022486d8d5f"),
  PRINCE_EDWARD_ISLAND_PROVINCE_ID: z.string().trim().min(1).default("3b8110df-38b3-eb11-8236-0022486d8d5f"),
  NUNAVUT_PROVINCE_ID: z.string().trim().min(1).default("9936c08e-39b3-eb11-8236-0022486d8d5f"),
  NORTHWEST_TERRITORIES_PROVINCE_ID: z.string().trim().min(1).default("6026aca2-39b3-eb11-8236-0022486d8d5f"),
  YUKON_PROVINCE_ID: z.string().trim().min(1).default("8fef32b7-39b3-eb11-8236-0022486d8d5f"),

  // language codes
  ENGLISH_LANGUAGE_CODE: z.coerce.number().default(1033),
  FRENCH_LANGUAGE_CODE: z.coerce.number().default(1036),

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

  // auth/oidc settings
  AUTH_JWT_PRIVATE_KEY: z.string().refine(isValidPrivateKey),
  AUTH_JWT_PUBLIC_KEY: z.string().refine(isValidPublicKey),
  AUTH_LOGOUT_REDIRECT_URL: z.string().url(),
  AUTH_RAOIDC_BASE_URL: z.string().trim().min(1),
  AUTH_RAOIDC_CLIENT_ID: z.string().trim().min(1),
  AUTH_RAOIDC_METADATA_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  AUTH_RASCL_LOGOUT_URL: z.string().trim().min(1),

  // hCaptcha settings
  HCAPTCHA_MAX_SCORE: z.coerce.number().default(0.79),
  HCAPTCHA_SECRET_KEY: z.string().trim().min(1),
  HCAPTCHA_VERIFY_URL: z.string().url().default('https://api.hcaptcha.com/siteverify'),

  // http proxy settings
  HTTP_PROXY_URL: z.string().trim().transform(emptyToUndefined).optional(),
  HTTP_PROXY_TLS_TIMEOUT: z.coerce.number().default(30*1000),

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


  // redis server configuration
  REDIS_SENTINEL_NAME: z.string().trim().transform(emptyToUndefined).optional(),
  REDIS_SENTINEL_HOST: z.string().trim().transform(emptyToUndefined).optional(),
  REDIS_SENTINEL_PORT: z.coerce.number().optional(),
  REDIS_STANDALONE_HOST: z.string().trim().min(1).default('localhost'),
  REDIS_STANDALONE_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().trim().min(1).optional(),
  REDIS_PASSWORD: z.string().trim().min(1).optional(),
  REDIS_COMMAND_TIMEOUT_SECONDS: z.coerce.number().default(1),

  // mocks settings
  ENABLED_MOCKS: z.string().transform(emptyToUndefined).transform(csvToArray).refine(areValidMockNames).default(''),
  MOCK_AUTH_ALLOWED_REDIRECTS: z.string().transform(emptyToUndefined).transform(csvToArray).default('http://localhost:3000/auth/callback/raoidc'),

  // cache duration settings
  LOOKUP_SVC_ALL_AVOIDED_DENTAL_COST_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_BORN_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_DISABILITY_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_EQUITY_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_FEDERAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_GENDER_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_INDIGENOUS_GROUP_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_INDIGENOUS_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_LAST_TIME_DENTIST_VISIT_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_LETTER_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_MOUTH_PAIN_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_SEX_AT_BIRTH_TYPES_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_ALL_YEARS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_CLIENT_FRIENDLY_STATUS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_COUNTRY_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_FEDERAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_LETTER_TYPE_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),
  LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),

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

  // Dynatrace OneAgent (RUM) - Manual insertion - Retrieve via REST API - Use the Dynatrace API to insert the RUM JavaScript.
  // @see https://docs.dynatrace.com/docs/platform-modules/digital-experience/web-applications/initial-setup/rum-injection#retrieve-via-rest-api
  DYNATRACE_API_RUM_SCRIPT_TOKEN: z.string().trim().transform(emptyToUndefined).optional(),
  DYNATRACE_API_RUM_SCRIPT_URI: z.string().trim().transform(emptyToUndefined).optional(),
  DYNATRACE_API_RUM_SCRIPT_URI_CACHE_TTL_SECONDS: z.coerce.number().default(1 * 60 * 60),

  // CDCP Website URLs
  CDCP_WEBSITE_APPLY_URL_EN: z.string().url().default('https://www.canada.ca/en/services/benefits/dental/dental-care-plan/apply.html'),
  CDCP_WEBSITE_APPLY_URL_FR: z.string().url().default('https://www.canada.ca/fr/services/prestations/dentaire/regime-soins-dentaires/demande.html'),
  CDCP_WEBSITE_STATUS_URL_EN: z.string().url().default('https://www.canada.ca/en/services/benefits/dental/dental-care-plan/apply.html#status'),
  CDCP_WEBSITE_STATUS_URL_FR: z.string().url().default('https://www.canada.ca/fr/services/prestations/dentaire/regime-soins-dentaires/demande.html#etat'),
  CDCP_WEBSITE_URL_EN: z.string().url().default('https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html'),
  CDCP_WEBSITE_URL_FR: z.string().url().default('https://www.canada.ca/fr/services/prestations/dentaire/regime-soins-dentaires.html'),

  // health check configuration
  HEALTH_CACHE_TTL: z.coerce.number().default(10 * 1000),
  HEALTH_AUTH_JWKS_URI: z.string().url().optional(),
  HEALTH_AUTH_ROLE: z.string().default('HealthCheck.ViewDetails'),
  HEALTH_AUTH_TOKEN_AUDIENCE: z.string().default('00000000-0000-0000-0000-000000000000'), // intentional default to enforce an audience check when verifying JWTs
  HEALTH_AUTH_TOKEN_ISSUER: z.string().default('https://auth.example.com/'), // intentional default to enforce an issuer check when verifying JWTs
});

export type ServerEnv = z.infer<typeof serverEnv>;

export function getEnv() {
  const result = serverEnv.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid application configuration: ${result.error}`);
  }

  return result.data;
}

export function getClientEnv() {
  const result = clientEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid application configuration: ${result.error}`);
  }

  return result.data;
}

/**
 * Return true if the given mock is enabled
 */
export function mockEnabled(mock: MockName) {
  const { ENABLED_MOCKS } = getEnv();
  return ENABLED_MOCKS.includes(mock);
}
