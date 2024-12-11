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
        id: 'protected/unable-to-process-request',
        file: 'routes/protected/unable-to-process-request.tsx',
        paths: { en: '/:lang/protected/unable-to-process-request', fr: '/:lang/protected/impossible-de-traiter-la-demande' },
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
        file: 'routes/protected/letters/$id.download.ts',
        paths: { en: '/:lang/letters/:id/download', fr: '/:lang/lettres/:id/telecharger' },
      },
      {
        id: 'protected/stub-login',
        file: 'routes/protected/stub-login.tsx',
        paths: { en: '/:lang/stub-login', fr: '/:lang/stub-login' },
      },
      {
        file: 'routes/protected/renew/layout.tsx',
        children: [
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
            id: 'protected/renew/$id/member-selection',
            file: 'routes/protected/renew/$id/member-selection.tsx',
            paths: { en: '/:lang/protected/renew/:id/member-selection', fr: '/:lang/protected/renew/:id/member-selection' },
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
            id: 'protected/renew/$id/confirm-marital-status',
            file: 'routes/protected/renew/$id/confirm-marital-status.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-marital-status', fr: '/:lang/protected/renew/:id/confirm-marital-status' },
          },
          {
            file: 'routes/protected/renew/$id/$childId/layout.tsx',
            children: [
              {
                id: 'protected/renew/$id/$childId/parent-or-guardian',
                file: 'routes/protected/renew/$id/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/protected/renew/:id/:childId/parent-or-guardian', fr: '/:lang/protected/renew/:id/:childId/parent-or-guardian' },
              },
              {
                id: 'protected/renew/$id/$childId/parent-or-guardian-required',
                file: 'routes/protected/renew/$id/$childId/parent-or-guardian-required.tsx',
                paths: { en: '/:lang/protected/renew/:id/:childId/parent-or-guardian-required', fr: '/:lang/protected/renew/:id/:childId/parent-or-guardian-required' },
              },
              {
                id: 'protected/renew/$id/$childId/dental-insurance',
                file: 'routes/protected/renew/$id/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/protected/renew/:id/:childId/dental-insurance', fr: '/:lang/protected/renew/:id/:childId/dental-insurance' },
              },
              {
                id: 'protected/renew/$id/$childId/demographic-survey',
                file: 'routes/protected/renew/$id/$childId/demographic-survey.tsx',
                paths: { en: '/:lang/protected/renew/:id/:childId/demographic-survey', fr: '/:lang/protected/renew/:id/:childId/demographic-survey' },
              },
              {
                id: 'protected/renew/$id/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/protected/renew/$id/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/protected/renew/:id/:childId/confirm-federal-provincial-territorial-benefits', fr: '/:lang/protected/renew/:id/:childId/confirm-federal-provincial-territorial-benefits' },
              },
            ],
          },
          {
            id: 'protected/renew/$id/confirm-phone',
            file: 'routes/protected/renew/$id/confirm-phone.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-phone', fr: '/:lang/protected/renew/:id/confirmer-telephone' },
          },
          {
            id: 'protected/renew/$id/confirm-email',
            file: 'routes/protected/renew/$id/confirm-email.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-email', fr: '/:lang/protected/renew/:id/confirmer-courriel' },
          },
          {
            id: 'protected/renew/$id/confirm-communication-preference',
            file: 'routes/protected/renew/$id/confirm-communication-preference.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-communication-preference', fr: '/:lang/protected/renew/:id/confirm-communication-preference' },
          },
          {
            id: 'protected/renew/$id/confirm-home-address',
            file: 'routes/protected/renew/$id/confirm-home-address.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-home-address', fr: '/:lang/protected/renew/:id/confirm-home-address' },
          },
          {
            id: 'protected/renew/$id/confirm-mailing-address',
            file: 'routes/protected/renew/$id/confirm-mailing-address.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-mailing-address', fr: '/:lang/protected/renew/:id/confirm-mailing-address' },
          },
          {
            id: 'protected/renew/$id/confirm-federal-provincial-territorial-benefits',
            file: 'routes/protected/renew/$id/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-federal-provincial-territorial-benefits', fr: '/:lang/protected/renew/:id/confirm-federal-provincial-territorial-benefits' },
          },
          {
            id: 'protected/renew/$id/review-adult-information',
            file: 'routes/protected/renew/$id/review-adult-information.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-adult-information', fr: '/:lang/protected/renew/:id/revue-renseignements-adulte' },
          },
          {
            id: 'protected/renew/$id/review-child-information',
            file: 'routes/protected/renew/$id/review-child-information.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-child-information', fr: '/:lang/protected/renew/:id/review-child-information' },
          },
          {
            id: 'protected/renew/$id/confirmation',
            file: 'routes/protected/renew/$id/confirmation.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirmation', fr: '/:lang/protected/renew/:id/confirmation' },
          },
          {
            id: 'protected/renew/$id/review-and-submit',
            file: 'routes/protected/renew/$id/review-and-submit.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-and-submit', fr: '/:lang/protected/renew/:id/review-and-submit' },
          },
        ],
      },
    ],
  },
] as const satisfies I18nRoute[];
