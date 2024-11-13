import type { I18nRoute } from 'vite.config';

// note: to ensure compatibility with vite.config.ts, we cannot use aliased (~/) imports here
//       aliased imports will not be a problem after migrating to React Router 7
import { routes as apiRoutes } from './routes/api/routes';
import { routes as authRoutes } from './routes/auth/routes';
import { routes as protectedRoutes } from './routes/protected/routes';
import { routes as publicRoutes } from './routes/public/routes';

export const routes = [
  {
    id: 'language-chooser',
    file: 'routes/language-chooser.tsx',
    paths: { en: '/', fr: '/' },
  },
  {
    id: '$lang-layout',
    file: 'routes/$lang-layout.tsx',
    paths: { en: '/:lang', fr: '/:lang' },
    children: [
      {
        id: '$lang-index',
        file: 'routes/$lang-index.tsx',
        index: true,
        paths: { en: '/:lang/', fr: '/:lang/' },
      },
      {
        id: '$lang-$',
        file: 'routes/$lang-$.tsx',
        paths: { en: '/:lang/*', fr: '/:lang/*' },
      },
      ...publicRoutes,
      ...protectedRoutes,
    ],
  },
  ...apiRoutes,
  ...authRoutes,
] as const satisfies I18nRoute[];
