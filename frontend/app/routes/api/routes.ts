import type { I18nRoute } from '~/routes/routes';

export const routes = [
  {
    id: 'api/jwks',
    file: 'routes/api/jwks.ts',
    paths: { en: '/.well-known/jwks.json', fr: '/.well-known/jwks.json' },
  },
  {
    id: 'api/apply-state',
    file: 'routes/api/apply-state.ts',
    paths: { en: '/api/apply-state', fr: '/api/apply-state' },
  },
  {
    id: 'api/buildinfo',
    file: 'routes/api/buildinfo.ts',
    paths: { en: '/api/buildinfo', fr: '/api/buildinfo' },
  },
  {
    id: 'api/health',
    file: 'routes/api/health.ts',
    paths: { en: '/api/health', fr: '/api/health' },
  },
  {
    id: 'api/protected-renew-state',
    file: 'routes/api/protected-renew-state.ts',
    paths: { en: '/api/protected-renew-state', fr: '/api/protected-renew-state' },
  },
  {
    id: 'api/readyz',
    file: 'routes/api/readyz.ts',
    paths: { en: '/api/readyz', fr: '/api/readyz' },
  },
  {
    id: 'api/renew-state',
    file: 'routes/api/renew-state.ts',
    paths: { en: '/api/renew-state', fr: '/api/renew-state' },
  },
  {
    id: 'api/session',
    file: 'routes/api/session.ts',
    paths: { en: '/api/session', fr: '/api/session' },
  },
] as const satisfies I18nRoute[];
