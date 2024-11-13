import type { I18nRoute } from '~/routes/routes';

export const routes = [
  {
    id: 'auth/$',
    file: 'routes/auth/$.tsx',
    paths: { en: '/auth/*', fr: '/auth/*' },
  },
] as const satisfies I18nRoute[];
