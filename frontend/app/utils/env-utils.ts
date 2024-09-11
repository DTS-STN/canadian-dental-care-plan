import { z } from 'zod';

const validFeatureNames = [
  'doc-upload',
  'email-alerts',
  'hcaptcha',
  'view-personal-info',
  'view-applications',
  'view-letters',
  'view-messages',
  'edit-personal-info',
  'status',
  'show-prototype-banner',
  'authenticated-status-check',
  'update-governmental-benefit',
  'dependent-status-checker',
  'view-payload',
  'status-checker-redirects',
] as const;
export type FeatureName = (typeof validFeatureNames)[number];

// refiners
const areValidFeatureNames = (arr: Array<string>) => arr.every((featureName) => validFeatureNames.includes(featureName as FeatureName));

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
  SCCH_BASE_URI: z.string().url().default('https://service.canada.ca'),

  SESSION_TIMEOUT_SECONDS: z.coerce.number().min(0).default(19 * 60),
  SESSION_TIMEOUT_PROMPT_SECONDS: z.coerce.number().min(0).default(5 * 60),
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
