import { z } from 'zod';

const validFeatureNames = ['address-validation', 'doc-upload', 'hcaptcha', 'show-prototype-banner', 'stub-login', 'status', 'view-letters', 'view-letters-online-application', 'view-messages', 'view-payload'] as const;

export type FeatureName = (typeof validFeatureNames)[number];

// refiners
const areValidFeatureNames = (arr: Array<string>): arr is FeatureName[] => arr.every((featureName) => validFeatureNames.includes(featureName as FeatureName));

// transformers
const csvToArray = (csv?: string) => csv?.split(',').map((str) => str.trim()) ?? [];
const emptyToUndefined = (val?: string) => (val === '' ? undefined : val);
const toBoolean = (val?: string) => val === 'true';

/**
 * Environment variables that are safe to expose publicly to the client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
// prettier-ignore
export const clientEnvSchema = z.object({
  // Adobe Analytics scripts
  ADOBE_ANALYTICS_SRC: z.string().url().optional(),
  ADOBE_ANALYTICS_JQUERY_SRC: z.string().url().default('https://code.jquery.com/jquery-3.7.1.min.js'),

  ENABLED_FEATURES: z.string().transform(emptyToUndefined).transform(csvToArray).refine(areValidFeatureNames).default(""),

  I18NEXT_DEBUG: z.string().transform(toBoolean).default('false'),

  // base URIs for My Service Canada Account variations
  ECAS_BASE_URI: z.string().url().default('https://srv136.services.gc.ca/ecas-seca/rascl/SCL'),
  SCCH_BASE_URI: z.string().url().default('https://service.canada.ca'),

  // Header Logo URLs
  HEADER_LOGO_URL_EN: z.string().url().default('https://canada.ca/en'),
  HEADER_LOGO_URL_FR: z.string().url().default('https://canada.ca/fr'),

  // hCaptcha settings
  HCAPTCHA_SITE_KEY: z.string().trim().min(1),

  SESSION_TIMEOUT_SECONDS: z.coerce.number().min(0).default(19 * 60),
  SESSION_TIMEOUT_PROMPT_SECONDS: z.coerce.number().min(0).default(5 * 60),

  // demographic survey codes
  IS_APPLICANT_FIRST_NATIONS_YES_OPTION: z.coerce.number().default(775170000),
  ANOTHER_ETHNIC_GROUP_OPTION: z.coerce.number().default(775170009),
  INDIGENOUS_STATUS_PREFER_NOT_TO_ANSWER: z.coerce.number().default(775170003),
  DISABILITY_STATUS_PREFER_NOT_TO_ANSWER: z.coerce.number().default(775170004),
  ETHNIC_GROUP_PREFER_NOT_TO_ANSWER: z.coerce.number().default(775170011),
  LOCATION_BORN_STATUS_PREFER_NOT_TO_ANSWER: z.coerce.number().default(775170003),
  GENDER_STATUS_PREFER_NOT_TO_ANSWER: z.coerce.number().default(775170004),

  // marital status codes
  MARITAL_STATUS_CODE_MARRIED: z.coerce.number().default(775170001),
  MARITAL_STATUS_CODE_COMMONLAW:z.coerce.number().default(775170002),

  // lookup identifiers
  CANADA_COUNTRY_ID: z.string().trim().min(1).default('0cf5389e-97ae-eb11-8236-000d3af4bfc3'),
  USA_COUNTRY_ID: z.string().trim().min(1).default('fcf7389e-97ae-eb11-8236-000d3af4bfc3'),
  COMMUNICATION_METHOD_EMAIL_ID: z.string().trim().min(1).default('775170000'),
  COMMUNICATION_METHOD_MAIL_ID: z.string().trim().min(1).default('775170002'),
  CLIENT_STATUS_SUCCESS_ID: z.string().trim().min(1).default('51af5170-614e-ee11-be6f-000d3a09d640'),
  INVALID_CLIENT_FRIENDLY_STATUS: z.string().trim().min(1).default('504fba6e-604e-ee11-be6f-000d3a09d640'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * A utility function that returns environment varaibles:
 *
 *   - from the global window object when called from a client-side browser
 *   - from process.env when called from a server-side component
 *
 * For this to work in the browser, all publicly-accessible configuration
 * strings must be placed in the window.env object. In CDCP, this is done
 * through the <ClientEnv> react component.
 *
 * @see ~/components/client-env.tsx
 */
export function getClientEnv(): ClientEnv {
  const isServer = typeof document === 'undefined';

  if (!isServer) {
    return window.env;
  }

  const result = clientEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid application configuration: ${result.error}`);
  }

  return result.data;
}
