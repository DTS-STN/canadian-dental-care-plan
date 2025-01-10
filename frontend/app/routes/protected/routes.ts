import type { I18nRoute } from '~/routes/routes';

export const routes = [
  {
    file: 'routes/protected/layout.tsx',
    children: [
      {
        id: 'protected/data-unavailable',
        file: 'routes/protected/data-unavailable.tsx',
        paths: { en: '/:lang/protected/data-unavailable', fr: '/:lang/protege/donnees-indisponibles' },
      },
      {
        id: 'protected/unable-to-process-request',
        file: 'routes/protected/unable-to-process-request.tsx',
        paths: { en: '/:lang/protected/unable-to-process-request', fr: '/:lang/protege/impossible-de-traiter-la-demande' },
      },
      {
        id: 'protected/home',
        file: 'routes/protected/home.tsx',
        paths: { en: '/:lang/protected/home', fr: '/:lang/protege/accueil' },
      },
      {
        id: 'protected/letters/index',
        file: 'routes/protected/letters/index.tsx',
        paths: { en: '/:lang/protected/letters', fr: '/:lang/protege/lettres' },
      },
      {
        id: 'protected/letters/$id.download',
        file: 'routes/protected/letters/$id.download.ts',
        paths: { en: '/:lang/protected/letters/:id/download', fr: '/:lang/protege/lettres/:id/telecharger' },
      },
      {
        id: 'protected/stub-login',
        file: 'routes/protected/stub-login.tsx',
        paths: { en: '/:lang/protected/stub-login', fr: '/:lang/protege/stub-login' },
      },
      {
        file: 'routes/protected/renew/layout.tsx',
        children: [
          {
            id: 'protected/renew/index',
            file: 'routes/protected/renew/index.tsx',
            paths: { en: '/:lang/protected/renew', fr: '/:lang/protege/renouveller' },
          },
          {
            id: 'protected/renew/$id/terms-and-conditions',
            file: 'routes/protected/renew/$id/terms-and-conditions.tsx',
            paths: { en: '/:lang/protected/renew/:id/terms-and-conditions', fr: '/:lang/protege/renouveller/:id/conditions-utilisation' },
          },
          {
            id: 'protected/renew/$id/tax-filing',
            file: 'routes/protected/renew/$id/tax-filing.tsx',
            paths: { en: '/:lang/protected/renew/:id/tax-filing', fr: '/:lang/protege/renouveller/:id/declaration-impot' },
          },
          {
            id: 'protected/renew/$id/file-taxes',
            file: 'routes/protected/renew/$id/file-taxes.tsx',
            paths: { en: '/:lang/protected/renew/:id/file-taxes', fr: '/:lang/protege/renouveller/:id/produire-declaration-revenus' },
          },
          {
            id: 'protected/renew/$id/member-selection',
            file: 'routes/protected/renew/$id/member-selection.tsx',
            paths: { en: '/:lang/protected/renew/:id/member-selection', fr: '/:lang/protege/renouveller/:id/selection-membre' },
          },
          {
            id: 'protected/renew/$id/dental-insurance',
            file: 'routes/protected/renew/$id/dental-insurance.tsx',
            paths: { en: '/:lang/protected/renew/:id/dental-insurance', fr: '/:lang/protege/renouveller/:id/assurance-dentaire' },
          },
          {
            id: 'protected/renew/$id/demographic-survey',
            file: 'routes/protected/renew/$id/demographic-survey.tsx',
            paths: { en: '/:lang/protected/renew/:id/demographic-survey', fr: '/:lang/protege/renouveller/:id/questionnaire-demographique' },
          },
          {
            id: 'protected/renew/$id/confirm-marital-status',
            file: 'routes/protected/renew/$id/confirm-marital-status.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-marital-status', fr: '/:lang/protege/renouveller/:id/confirmer-etat-civil' },
          },
          {
            file: 'routes/protected/renew/$id/$childId/layout.tsx',
            children: [
              {
                id: 'protected/renew/$id/$childId/parent-or-guardian',
                file: 'routes/protected/renew/$id/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/parent-or-guardian', fr: '/:lang/protege/renouveller/:id/enfants/:childId/parent-ou-tuteur' },
              },
              {
                id: 'protected/renew/$id/$childId/parent-or-guardian-required',
                file: 'routes/protected/renew/$id/$childId/parent-or-guardian-required.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/parent-or-guardian-required', fr: '/:lang/protege/renouveller/:id/enfants/:childId/parent-ou-tuteur-requis' },
              },
              {
                id: 'protected/renew/$id/$childId/dental-insurance',
                file: 'routes/protected/renew/$id/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/dental-insurance', fr: '/:lang/protege/renouveller/:id/enfants/:childId/assurance-dentaire' },
              },
              {
                id: 'protected/renew/$id/$childId/demographic-survey',
                file: 'routes/protected/renew/$id/$childId/demographic-survey.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/demographic-survey', fr: '/:lang/protege/renouveller/:id/enfants/:childId/questionnaire-demographique' },
              },
              {
                id: 'protected/renew/$id/children/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/protected/renew/$id/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/confirm-federal-provincial-territorial-benefits', fr: '/:lang/protege/renouveller/:id/enfants/:childId/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
              },
            ],
          },
          {
            id: 'protected/renew/$id/confirm-phone',
            file: 'routes/protected/renew/$id/confirm-phone.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-phone', fr: '/:lang/protege/renouveller/:id/confirmer-telephone' },
          },
          {
            id: 'protected/renew/$id/confirm-email',
            file: 'routes/protected/renew/$id/confirm-email.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-email', fr: '/:lang/protege/renouveller/:id/confirmer-courriel' },
          },
          {
            id: 'protected/renew/$id/confirm-communication-preference',
            file: 'routes/protected/renew/$id/confirm-communication-preference.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-communication-preference', fr: '/:lang/protege/renouveller/:id/confirmer-preference-communication' },
          },
          {
            id: 'protected/renew/$id/confirm-home-address',
            file: 'routes/protected/renew/$id/confirm-home-address.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-home-address', fr: '/:lang/protege/renouveller/:id/confirmer-adresse-domicile' },
          },
          {
            id: 'protected/renew/$id/confirm-mailing-address',
            file: 'routes/protected/renew/$id/confirm-mailing-address.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-mailing-address', fr: '/:lang/protege/renouveller/:id/confirmer-adresse-postale' },
          },
          {
            id: 'protected/renew/$id/confirm-federal-provincial-territorial-benefits',
            file: 'routes/protected/renew/$id/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-federal-provincial-territorial-benefits', fr: '/:lang/protege/renouveller/:id/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'protected/renew/$id/review-adult-information',
            file: 'routes/protected/renew/$id/review-adult-information.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-adult-information', fr: '/:lang/protege/renouveller/:id/revue-renseignements-adulte' },
          },
          {
            id: 'protected/renew/$id/review-child-information',
            file: 'routes/protected/renew/$id/review-child-information.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-child-information', fr: '/:lang/protege/renouveller/:id/revue-renseignements-enfant' },
          },
          {
            id: 'protected/renew/$id/confirmation',
            file: 'routes/protected/renew/$id/confirmation.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirmation', fr: '/:lang/protege/renouveller/:id/confirmation' },
          },
          {
            id: 'protected/renew/$id/review-and-submit',
            file: 'routes/protected/renew/$id/review-and-submit.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-and-submit', fr: '/:lang/protege/renouveller/:id/revue-et-soumettre' },
          },
        ],
      },
    ],
  },
] as const satisfies I18nRoute[];
