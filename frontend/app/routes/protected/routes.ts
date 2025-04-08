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
        file: 'routes/protected/apply/layout.tsx',
        children: [
          { id: 'protected/apply/index', file: 'routes/protected/apply/index.tsx', paths: { en: '/:lang/protected/apply', fr: '/:lang/protege/demander' } },
          { id: 'protected/apply/$id/index', file: 'routes/protected/apply/$id/index.tsx', paths: { en: '/:lang/protected/apply/:id', fr: '/:lang/protege/demander/:id' } },
          { id: 'protected/apply/$id/terms-and-conditions', file: 'routes/protected/apply/$id/terms-and-conditions.tsx', paths: { en: '/:lang/protected/apply/:id/terms-and-conditions', fr: '/:lang/protege/demander/:id/conditions-utilisation' } },
          { id: 'protected/apply/$id/tax-filing', file: 'routes/protected/apply/$id/tax-filing.tsx', paths: { en: '/:lang/protected/apply/:id/tax-filing', fr: '/:lang/protege/demander/:id/declaration-impot' } },
          { id: 'protected/apply/$id/file-taxes', file: 'routes/protected/apply/$id/file-taxes.tsx', paths: { en: '/:lang/protected/apply/:id/file-taxes', fr: '/:lang/protege/demander/:id/produire-declaration-revenus' } },
          { id: 'protected/apply/$id/type-application', file: 'routes/protected/apply/$id/type-application.tsx', paths: { en: '/:lang/protected/apply/:id/type-application', fr: '/:lang/protege/demander/:id/type-demande' } },
          { id: 'protected/apply/$id/application-delegate', file: 'routes/protected/apply/$id/application-delegate.tsx', paths: { en: '/:lang/protected/apply/:id/application-delegate', fr: '/:lang/protege/demander/:id/delegue-demande' } },
          {
            id: 'protected/apply/$id/adult/applicant-information',
            file: 'routes/protected/apply/$id/adult/applicant-information.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult/applicant-information', fr: '/:lang/protege/demander/:id/adulte/renseignements-demandeur' },
          },
          {
            id: 'protected/apply/$id/adult/communication-preference',
            file: 'routes/protected/apply/$id/adult/communication-preference.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult/communication-preference', fr: '/:lang/protege/demander/:id/adult/preference-communication' },
          },
          { id: 'protected/apply/$id/adult/confirmation', file: 'routes/protected/apply/$id/adult/confirmation.tsx', paths: { en: '/:lang/protected/apply/:id/adult/confirmation', fr: '/:lang/protege/demander/:id/adulte/confirmation' } },
          { id: 'protected/apply/$id/adult/dental-insurance', file: 'routes/protected/apply/$id/adult/dental-insurance.tsx', paths: { en: '/:lang/protected/apply/:id/adult/dental-insurance', fr: '/:lang/protege/demander/:id/adulte/assurance-dentaire' } },
          { id: 'protected/apply/$id/adult/exit-application', file: 'routes/protected/apply/$id/adult/exit-application.tsx', paths: { en: '/:lang/protected/apply/:id/adult/exit-application', fr: '/:lang/protege/demander/:id/adulte/quitter-demande' } },
          {
            id: 'protected/apply/$id/adult/confirm-federal-provincial-territorial-benefits',
            file: 'routes/protected/apply/$id/adult/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult/confirm-federal-provincial-territorial-benefits', fr: '/:lang/protege/demander/:id/adulte/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'protected/apply/$id/adult/federal-provincial-territorial-benefits',
            file: 'routes/protected/apply/$id/adult/federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult/federal-provincial-territorial-benefits', fr: '/:lang/protege/demander/:id/adulte/prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'protected/apply/$id/adult/review-information',
            file: 'routes/protected/apply/$id/adult/review-information.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult/review-information', fr: '/:lang/protege/demander/:id/adulte/revue-renseignements' },
          },
          {
            id: 'protected/apply/$id/adult/parent-or-guardian',
            file: 'routes/protected/apply/$id/adult/parent-or-guardian.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult/parent-or-guardian', fr: '/:lang/protege/demander/:id/adulte/parent-ou-tuteur' },
          },
          {
            id: 'protected/apply/$id/adult/living-independently',
            file: 'routes/protected/apply/$id/adult/living-independently.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult/living-independently', fr: '/:lang/protege/demander/:id/adulte/vivre-maniere-independante' },
          },
          {
            id: 'protected/apply/$id/adult/new-or-existing-member',
            file: 'routes/protected/apply/$id/adult/new-or-existing-member.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult/new-or-existing-member', fr: '/:lang/protege/demander/:id/adulte/membre-nouveau-ou-actuel' },
          },
          { id: 'protected/apply/$id/adult/phone-number', file: 'routes/protected/apply/$id/adult/phone-number.tsx', paths: { en: '/:lang/protected/apply/:id/adult/phone-number', fr: '/:lang/protege/demander/:id/adulte/numero-telephone' } },
          { id: 'protected/apply/$id/adult/verify-email', file: 'routes/protected/apply/$id/adult/verify-email.tsx', paths: { en: '/:lang/protected/apply/:id/adult/verify-email', fr: '/:lang/protege/demander/:id/adulte/verifier-courriel' } },
          { id: 'protected/apply/$id/adult/email', file: 'routes/protected/apply/$id/adult/email.tsx', paths: { en: '/:lang/protected/apply/:id/adult/email', fr: '/:lang/protege/demander/:id/adulte/adresse-courriel' } },
          { id: 'protected/apply/$id/adult/marital-status', file: 'routes/protected/apply/$id/adult/marital-status.tsx', paths: { en: '/:lang/protected/apply/:id/adult/marital-status', fr: '/:lang/protege/demander/:id/adulte/etat-civil' } },
          { id: 'protected/apply/$id/adult/mailing-address', file: 'routes/protected/apply/$id/adult/mailing-address.tsx', paths: { en: '/:lang/protected/apply/:id/adult/mailing-address', fr: '/:lang/protege/demander/:id/adulte/adresse-postale' } },
          { id: 'protected/apply/$id/adult/home-address', file: 'routes/protected/apply/$id/adult/home-address.tsx', paths: { en: '/:lang/protected/apply/:id/adult/home-address', fr: '/:lang/protege/demander/:id/adulte/adresse-domicile' } },
        ],
      },
      {
        file: 'routes/protected/renew/layout.tsx',
        children: [
          {
            id: 'protected/renew/index',
            file: 'routes/protected/renew/index.tsx',
            paths: { en: '/:lang/protected/renew', fr: '/:lang/protege/renouveler' },
          },
          {
            id: 'protected/renew/$id/terms-and-conditions',
            file: 'routes/protected/renew/$id/terms-and-conditions.tsx',
            paths: { en: '/:lang/protected/renew/:id/terms-and-conditions', fr: '/:lang/protege/renouveler/:id/conditions-utilisation' },
          },
          {
            id: 'protected/renew/$id/tax-filing',
            file: 'routes/protected/renew/$id/tax-filing.tsx',
            paths: { en: '/:lang/protected/renew/:id/tax-filing', fr: '/:lang/protege/renouveler/:id/declaration-impot' },
          },
          {
            id: 'protected/renew/$id/file-taxes',
            file: 'routes/protected/renew/$id/file-taxes.tsx',
            paths: { en: '/:lang/protected/renew/:id/file-taxes', fr: '/:lang/protege/renouveler/:id/produire-declaration-revenus' },
          },
          {
            id: 'protected/renew/$id/member-selection',
            file: 'routes/protected/renew/$id/member-selection.tsx',
            paths: { en: '/:lang/protected/renew/:id/member-selection', fr: '/:lang/protege/renouveler/:id/selection-membre' },
          },
          {
            id: 'protected/renew/$id/dental-insurance',
            file: 'routes/protected/renew/$id/dental-insurance.tsx',
            paths: { en: '/:lang/protected/renew/:id/dental-insurance', fr: '/:lang/protege/renouveler/:id/assurance-dentaire' },
          },
          {
            id: 'protected/renew/$id/demographic-survey',
            file: 'routes/protected/renew/$id/demographic-survey.tsx',
            paths: { en: '/:lang/protected/renew/:id/demographic-survey', fr: '/:lang/protege/renouveler/:id/questionnaire-demographique' },
          },
          {
            id: 'protected/renew/$id/confirm-marital-status',
            file: 'routes/protected/renew/$id/confirm-marital-status.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-marital-status', fr: '/:lang/protege/renouveler/:id/confirmer-etat-civil' },
          },
          {
            file: 'routes/protected/renew/$id/$childId/layout.tsx',
            children: [
              {
                id: 'protected/renew/$id/$childId/parent-or-guardian',
                file: 'routes/protected/renew/$id/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/parent-or-guardian', fr: '/:lang/protege/renouveler/:id/enfants/:childId/parent-ou-tuteur' },
              },
              {
                id: 'protected/renew/$id/$childId/parent-or-guardian-required',
                file: 'routes/protected/renew/$id/$childId/parent-or-guardian-required.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/parent-or-guardian-required', fr: '/:lang/protege/renouveler/:id/enfants/:childId/parent-ou-tuteur-requis' },
              },
              {
                id: 'protected/renew/$id/$childId/dental-insurance',
                file: 'routes/protected/renew/$id/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/dental-insurance', fr: '/:lang/protege/renouveler/:id/enfants/:childId/assurance-dentaire' },
              },
              {
                id: 'protected/renew/$id/$childId/demographic-survey',
                file: 'routes/protected/renew/$id/$childId/demographic-survey.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/demographic-survey', fr: '/:lang/protege/renouveler/:id/enfants/:childId/questionnaire-demographique' },
              },
              {
                id: 'protected/renew/$id/children/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/protected/renew/$id/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/protected/renew/:id/children/:childId/confirm-federal-provincial-territorial-benefits', fr: '/:lang/protege/renouveler/:id/enfants/:childId/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
              },
            ],
          },
          {
            id: 'protected/renew/$id/confirm-phone',
            file: 'routes/protected/renew/$id/confirm-phone.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-phone', fr: '/:lang/protege/renouveler/:id/confirmer-telephone' },
          },
          {
            id: 'protected/renew/$id/confirm-email',
            file: 'routes/protected/renew/$id/confirm-email.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-email', fr: '/:lang/protege/renouveler/:id/confirmer-courriel' },
          },
          {
            id: 'protected/renew/$id/ita/confirm-email',
            file: 'routes/protected/renew/$id/ita/confirm-email.tsx',
            paths: { en: '/:lang/protected/renew/:id/ita/confirm-email', fr: '/:lang/protege/renouveler/:id/ita/confirmer-courriel' },
          },
          {
            id: 'protected/renew/$id/confirm-communication-preference',
            file: 'routes/protected/renew/$id/confirm-communication-preference.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-communication-preference', fr: '/:lang/protege/renouveler/:id/confirmer-preference-communication' },
          },
          {
            id: 'protected/renew/$id/confirm-home-address',
            file: 'routes/protected/renew/$id/confirm-home-address.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-home-address', fr: '/:lang/protege/renouveler/:id/confirmer-adresse-domicile' },
          },
          {
            id: 'protected/renew/$id/confirm-mailing-address',
            file: 'routes/protected/renew/$id/confirm-mailing-address.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-mailing-address', fr: '/:lang/protege/renouveler/:id/confirmer-adresse-postale' },
          },
          {
            id: 'protected/renew/$id/confirm-federal-provincial-territorial-benefits',
            file: 'routes/protected/renew/$id/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-federal-provincial-territorial-benefits', fr: '/:lang/protege/renouveler/:id/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'protected/renew/$id/review-adult-information',
            file: 'routes/protected/renew/$id/review-adult-information.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-adult-information', fr: '/:lang/protege/renouveler/:id/revue-renseignements-adulte' },
          },
          {
            id: 'protected/renew/$id/review-child-information',
            file: 'routes/protected/renew/$id/review-child-information.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-child-information', fr: '/:lang/protege/renouveler/:id/revue-renseignements-enfant' },
          },
          {
            id: 'protected/renew/$id/confirmation',
            file: 'routes/protected/renew/$id/confirmation.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirmation', fr: '/:lang/protege/renouveler/:id/confirmation' },
          },
          {
            id: 'protected/renew/$id/review-and-submit',
            file: 'routes/protected/renew/$id/review-and-submit.tsx',
            paths: { en: '/:lang/protected/renew/:id/review-and-submit', fr: '/:lang/protege/renouveler/:id/revue-et-soumettre' },
          },
          {
            id: 'protected/renew/$id/confirm-address',
            file: 'routes/protected/renew/$id/confirm-address.tsx',
            paths: { en: '/:lang/protected/renew/:id/confirm-address', fr: '/:lang/protege/renouveler/:id/confirmer-adresse' },
          },
        ],
      },
    ],
  },
] as const satisfies I18nRoute[];
