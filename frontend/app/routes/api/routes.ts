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
    id: 'api/readyz',
    file: 'routes/api/readyz.ts',
    paths: { en: '/api/readyz', fr: '/api/readyz' },
  },
  {
    id: 'api/session',
    file: 'routes/api/session.ts',
    paths: { en: '/api/session', fr: '/api/session' },
  },
] as const satisfies I18nRoute[];
