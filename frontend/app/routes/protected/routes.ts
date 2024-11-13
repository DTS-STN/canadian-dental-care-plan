import type { I18nRoute } from 'vite.config';

export const routes = [
  {
    id: 'protected/_route',
    file: 'routes/protected/_route.tsx',
    children: [
      {
        id: 'protected/data-unavailable',
        file: 'routes/protected/data-unavailable.tsx',
        paths: { en: '/:lang/data-unavailable', fr: '/:lang/donnees-indisponibles' },
      },
      {
        id: 'protected/home',
        file: 'routes/protected/home.tsx',
        paths: { en: '/:lang/home', fr: '/:lang/accueil' },
      },
      {
        id: 'protected/letters/index',
        file: 'routes/protected/letters/index.tsx',
        index: true,
        paths: { en: '/:lang/letters', fr: '/:lang/lettres' },
      },
      {
        id: 'protected/letters/$id.download',
        file: 'routes/protected/letters/$id.download.tsx',
        paths: { en: '/:lang/letters/:id/download', fr: '/:lang/lettres/:id/telecharger' },
      },
      {
        id: 'protected/stub-login',
        file: 'routes/protected/stub-login.tsx',
        paths: { en: '/:lang/stub-login', fr: '/:lang/stub-login' },
      },
      {
        id: 'protected/renew/file-taxes',
        file: 'routes/protected/renew/file-taxes.tsx',
        paths: { en: '/:lang/protected/renew/file-taxes', fr: '/:lang/protected/renew/file-taxes' },
      },
    ],
  },
] as const satisfies I18nRoute[];
