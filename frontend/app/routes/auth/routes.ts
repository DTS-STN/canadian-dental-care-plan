import type { RouteConfig } from '@react-router/dev/routes';

export const routes = [
  {
    id: 'auth/$',
    file: 'routes/auth/$.tsx',
    path: '/auth/*',
  },
] as const satisfies RouteConfig;
