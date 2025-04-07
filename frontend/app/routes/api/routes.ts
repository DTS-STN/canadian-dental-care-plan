import type { RouteConfig } from '@react-router/dev/routes';

export const routes = [
  {
    id: 'api/jwks',
    file: 'routes/api/jwks.ts',
    path: '/.well-known/jwks.json',
  },
  {
    id: 'api/apply-state',
    file: 'routes/api/apply-state.ts',
    path: '/api/apply-state',
  },
  {
    id: 'api/buildinfo',
    file: 'routes/api/buildinfo.ts',
    path: '/api/buildinfo',
  },
  {
    id: 'api/health',
    file: 'routes/api/health.ts',
    path: '/api/health',
  },
  {
    id: 'api/protected-apply-state',
    file: 'routes/api/protected-apply-state.ts',
    path: '/api/protected-apply-state',
  },
  {
    id: 'api/protected-renew-state',
    file: 'routes/api/protected-renew-state.ts',
    path: '/api/protected-renew-state',
  },
  {
    id: 'api/readyz',
    file: 'routes/api/readyz.ts',
    path: '/api/readyz',
  },
  {
    id: 'api/renew-state',
    file: 'routes/api/renew-state.ts',
    path: '/api/renew-state',
  },
  {
    id: 'api/session',
    file: 'routes/api/session.ts',
    path: '/api/session',
  },
] as const satisfies RouteConfig;
