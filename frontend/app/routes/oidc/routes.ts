import type { I18nRoute } from '~/routes/routes';

export const routes = [
  {
    id: 'oidc/$',
    file: 'routes/oidc/$.tsx',
    paths: { en: '/oidc/*', fr: '/oidc/*' },
  },
] as const satisfies I18nRoute[];
