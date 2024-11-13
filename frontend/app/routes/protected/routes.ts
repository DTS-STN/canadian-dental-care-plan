import type { I18nRoute } from 'vite.config';

export const routes = [
  {
    id: 'protected/layout',
    file: 'routes/protected/layout.tsx',
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
        id: 'protected/renew/index',
        file: 'routes/protected/renew/index.tsx',
        index: true,
        paths: { en: '/:lang/protected/renew', fr: '/:lang/protected/renew' },
      },
      {
        id: 'protected/renew/$id/terms-and-conditions',
        file: 'routes/protected/renew/terms-and-conditions.tsx',
        paths: { en: '/:lang/protected/renew/:id/terms-and-conditions', fr: '/:lang/protected/renew/:id/terms-and-conditions' },
      },
      {
        id: 'protected/renew/$id/tax-filing',
        file: 'routes/protected/renew/tax-filing.tsx',
        paths: { en: '/:lang/protected/renew/:id/tax-filing', fr: '/:lang/protected/renew/:id/tax-filing' },
      },
      {
        id: 'protected/renew/$id/file-taxes',
        file: 'routes/protected/renew/file-taxes.tsx',
        paths: { en: '/:lang/protected/renew/:id/file-taxes', fr: '/:lang/protected/renew/:id/file-taxes' },
      },
    ],
  },
] as const satisfies I18nRoute[];
