import type { I18nRoute } from '~/routes/routes';

export const routes = [
  {
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
        paths: { en: '/:lang/protected/renew', fr: '/:lang/protected/renew' },
      },
      {
        id: 'protected/renew/$id/terms-and-conditions',
        file: 'routes/protected/renew/$id/terms-and-conditions.tsx',
        paths: { en: '/:lang/protected/renew/:id/terms-and-conditions', fr: '/:lang/protected/renew/:id/terms-and-conditions' },
      },
      {
        id: 'protected/renew/$id/tax-filing',
        file: 'routes/protected/renew/$id/tax-filing.tsx',
        paths: { en: '/:lang/protected/renew/:id/tax-filing', fr: '/:lang/protected/renew/:id/tax-filing' },
      },
      {
        id: 'protected/renew/$id/file-taxes',
        file: 'routes/protected/renew/$id/file-taxes.tsx',
        paths: { en: '/:lang/protected/renew/:id/file-taxes', fr: '/:lang/protected/renew/:id/file-taxes' },
      },
      {
        id: 'protected/renew/$id/dental-insurance',
        file: 'routes/protected/renew/$id/dental-insurance.tsx',
        paths: { en: '/:lang/protected/renew/:id/dental-insurance', fr: '/:lang/protected/renew/:id/dental-insurance' },
      },
      {
        id: 'protected/renew/$id/demographic-survey',
        file: 'routes/protected/renew/$id/demographic-survey.tsx',
        paths: { en: '/:lang/protected/renew/:id/demographic-survey', fr: '/:lang/protected/renew/:id/demographic-survey' },
      },
      {
        id: 'protected/renew/$id/marital-status',
        file: 'routes/protected/renew/$id/marital-status.tsx',
        paths: { en: '/:lang/protected/renew/:id/marital-status', fr: '/:lang/protected/renew/:id/etat-civil' },
      },
      {
        id: 'protected/renew/$id/$childId/parent-or-guardian',
        file: 'routes/protected/renew/$id/$childId/parent-or-guardian.tsx',
        paths: { en: '/:lang/protected/renew/:id/:childId/parent-or-guardian', fr: '/:lang/protected/renew/:id/:childId/parent-or-guardian' },
      },
      {
        id: 'protected/renew/$id/$childId/dental-insurance',
        file: 'routes/protected/renew/$id/$childId/dental-insurance.tsx',
        paths: { en: '/:lang/protected/renew/:id/:childId/dental-insurance', fr: '/:lang/protected/renew/:id/:childId/dental-insurance' },
      },
      {
        id: 'protected/renew/$id/confirm-phone',
        file: 'routes/protected/renew/$id/confirm-phone.tsx',
        paths: { en: '/:lang/protected/renew/:id/confirm-phone', fr: '/:lang/protected/renew/:id/confirmer-telephone' },
      },
    ],
  },
] as const satisfies I18nRoute[];
