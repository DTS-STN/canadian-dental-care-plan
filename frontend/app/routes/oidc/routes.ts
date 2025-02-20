import type { RouteConfig } from '@react-router/dev/routes';

export const routes = [
  {
    id: 'oidc/$',
    file: 'routes/oidc/$.tsx',
    path: '/oidc/*',
  },
] as const satisfies RouteConfig;
