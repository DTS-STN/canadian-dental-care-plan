import type { I18nRoute } from '~/routes/routes';

export const routes = [
  {
    file: 'routes/public/layout.tsx',
    children: [
      { id: 'public/address-validation/index', file: 'routes/public/address-validation/index.tsx', paths: { en: '/:lang/address-validation', fr: '/:lang/validation-adresse' } },
      { id: 'public/address-validation/review', file: 'routes/public/address-validation/review.tsx', paths: { en: '/:lang/address-validation/review', fr: '/:lang/validation-adresse/revue' } },
      {
        file: 'routes/public/apply/layout.tsx',
        children: [
          { id: 'public/apply/index', file: 'routes/public/apply/index.tsx', paths: { en: '/:lang/apply', fr: '/:lang/demander' } },
          { id: 'public/apply/$id/adult/applicant-information', file: 'routes/public/apply/$id/adult/applicant-information.tsx', paths: { en: '/:lang/apply/:id/adult/applicant-information', fr: '/:lang/demander/:id/adulte/renseignements-demandeur' } },
          {
            id: 'public/apply/$id/adult/communication-preference',
            file: 'routes/public/apply/$id/adult/communication-preference.tsx',
            paths: { en: '/:lang/apply/:id/adult/communication-preference', fr: '/:lang/demander/:id/adult/preference-communication' },
          },
          { id: 'public/apply/$id/adult/confirmation', file: 'routes/public/apply/$id/adult/confirmation.tsx', paths: { en: '/:lang/apply/:id/adult/confirmation', fr: '/:lang/demander/:id/adulte/confirmation' } },
          { id: 'public/apply/$id/adult/dental-insurance', file: 'routes/public/apply/$id/adult/dental-insurance.tsx', paths: { en: '/:lang/apply/:id/adult/dental-insurance', fr: '/:lang/demander/:id/adulte/assurance-dentaire' } },
          { id: 'public/apply/$id/adult/exit-application', file: 'routes/public/apply/$id/adult/exit-application.tsx', paths: { en: '/:lang/apply/:id/adult/exit-application', fr: '/:lang/demander/:id/adulte/quitter-demande' } },
          {
            id: 'public/apply/$id/adult/confirm-federal-provincial-territorial-benefits',
            file: 'routes/public/apply/$id/adult/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/apply/:id/adult/confirm-federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/adulte/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'public/apply/$id/adult/federal-provincial-territorial-benefits',
            file: 'routes/public/apply/$id/adult/federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/apply/:id/adult/federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/adulte/prestations-dentaires-federales-provinciales-territoriales' },
          },
          { id: 'public/apply/$id/adult/partner-information', file: 'routes/public/apply/$id/adult/partner-information.tsx', paths: { en: '/:lang/apply/:id/adult/partner-information', fr: '/:lang/demander/:id/adulte/renseignements-partenaire' } },
          { id: 'public/apply/$id/adult/review-information', file: 'routes/public/apply/$id/adult/review-information.tsx', paths: { en: '/:lang/apply/:id/adult/review-information', fr: '/:lang/demander/:id/adulte/revue-renseignements' } },
          {
            id: 'public/apply/$id/adult/disability-tax-credit',
            file: 'routes/public/apply/$id/adult/disability-tax-credit.tsx',
            paths: { en: '/:lang/apply/:id/adult/disability-tax-credit', fr: '/:lang/demander/:id/adulte/credit-impot-personnes-handicapees' },
          },
          { id: 'public/apply/$id/adult/parent-or-guardian', file: 'routes/public/apply/$id/adult/parent-or-guardian.tsx', paths: { en: '/:lang/apply/:id/adult/parent-or-guardian', fr: '/:lang/demander/:id/adulte/parent-ou-tuteur' } },
          { id: 'public/apply/$id/adult/living-independently', file: 'routes/public/apply/$id/adult/living-independently.tsx', paths: { en: '/:lang/apply/:id/adult/living-independently', fr: '/:lang/demander/:id/adulte/vivre-maniere-independante' } },
          { id: 'public/apply/$id/adult/new-or-existing-member', file: 'routes/public/apply/$id/adult/new-or-existing-member.tsx', paths: { en: '/:lang/apply/:id/adult/new-or-existing-member', fr: '/:lang/demander/:id/adulte/new-or-existing-member' } }, // TODO: Update French route
          { id: 'public/apply/$id/adult/phone-number', file: 'routes/public/apply/$id/adult/phone-number.tsx', paths: { en: '/:lang/apply/:id/adult/phone-number', fr: '/:lang/demander/:id/adulte/phone-number' } }, // TODO: Update French route
          { id: 'public/apply/$id/adult/email', file: 'routes/public/apply/$id/adult/email.tsx', paths: { en: '/:lang/apply/:id/adult/email', fr: '/:lang/demander/:id/adulte/adresse-courriel' } },
          { id: 'public/apply/$id/adult-child/children/index', file: 'routes/public/apply/$id/adult-child/children/index.tsx', paths: { en: '/:lang/apply/:id/adult-child/children', fr: '/:lang/demander/:id/adulte-enfant/enfants' } },
          { id: 'public/apply/$id/adult/marital-status', file: 'routes/public/apply/$id/adult/marital-status.tsx', paths: { en: '/:lang/apply/:id/adult/marital-status', fr: '/:lang/demander/:id/adulte/etat-civil' } },
          { id: 'public/apply/$id/adult/mailing-address', file: 'routes/public/apply/$id/adult/mailing-address.tsx', paths: { en: '/:lang/apply/:id/adult/mailing-address', fr: '/:lang/demander/:id/adulte/adresse-postale' } },
          { id: 'public/apply/$id/adult/home-address', file: 'routes/public/apply/$id/adult/home-address.tsx', paths: { en: '/:lang/apply/:id/adult/home-address', fr: '/:lang/demander/:id/adulte/adresse-domicile' } },
          {
            file: 'routes/public/apply/$id/adult-child/children/$childId/layout.tsx',
            children: [
              {
                id: 'public/apply/$id/adult-child/children/$childId/information',
                file: 'routes/public/apply/$id/adult-child/children/$childId/information.tsx',
                paths: { en: '/:lang/apply/:id/adult-child/children/:childId/information', fr: '/:lang/demander/:id/adulte-enfant/enfants/:childId/information' },
              },
              {
                id: 'public/apply/$id/adult-child/children/$childId/dental-insurance',
                file: 'routes/public/apply/$id/adult-child/children/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/apply/:id/adult-child/children/:childId/dental-insurance', fr: '/:lang/demander/:id/adulte-enfant/enfants/:childId/assurance-dentaire' },
              },
              {
                id: 'public/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/public/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/apply/:id/adult-child/children/:childId/confirm-federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/adulte-enfant/enfants/:childId/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
              },
              {
                id: 'public/apply/$id/adult-child/children/$childId/federal-provincial-territorial-benefits',
                file: 'routes/public/apply/$id/adult-child/children/$childId/federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/apply/:id/adult-child/children/:childId/federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/adulte-enfant/enfants/:childId/prestations-dentaires-federales-provinciales-territoriales' },
              },
              {
                id: 'public/apply/$id/adult-child/children/$childId/parent-or-guardian',
                file: 'routes/public/apply/$id/adult-child/children/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/apply/:id/adult-child/children/:childId/parent-or-guardian', fr: '/:lang/demander/:id/adulte-enfant/enfants/:childId/parent-ou-tuteur' },
              },
              {
                id: 'public/apply/$id/adult-child/children/$childId/cannot-apply-child',
                file: 'routes/public/apply/$id/adult-child/children/$childId/cannot-apply-child.tsx',
                paths: { en: '/:lang/apply/:id/adult-child/children/:childId/cannot-apply-child', fr: '/:lang/demander/:id/adulte-enfant/enfants/:childId/pas-demande-enfant' },
              },
            ],
          },
          { id: 'public/apply/$id/adult-child/apply-children', file: 'routes/public/apply/$id/adult-child/apply-children.tsx', paths: { en: '/:lang/apply/:id/adult-child/apply-children', fr: '/:lang/demander/:id/adult-child/demande-enfant' } },
          { id: 'public/apply/$id/adult-child/confirmation', file: 'routes/public/apply/$id/adult-child/confirmation.tsx', paths: { en: '/:lang/apply/:id/adult-child/confirmation', fr: '/:lang/demander/:id/adulte-enfant/confirmation' } },
          {
            id: 'public/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits',
            file: 'routes/public/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/confirm-federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/adulte-enfant/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'public/apply/$id/adult-child/federal-provincial-territorial-benefits',
            file: 'routes/public/apply/$id/adult-child/federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/adulte-enfant/prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'public/apply/$id/adult-child/review-adult-information',
            file: 'routes/public/apply/$id/adult-child/review-adult-information.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/review-adult-information', fr: '/:lang/demander/:id/adulte-enfant/revue-renseignements-adulte' },
          },
          {
            id: 'public/apply/$id/adult-child/review-child-information',
            file: 'routes/public/apply/$id/adult-child/review-child-information.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/review-child-information', fr: '/:lang/demander/:id/adulte-enfant/revue-renseignements-enfant' },
          },
          {
            id: 'public/apply/$id/adult-child/communication-preference',
            file: 'routes/public/apply/$id/adult-child/communication-preference.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/communication-preference', fr: '/:lang/demander/:id/adulte-enfant/preference-communication' },
          },
          { id: 'public/apply/$id/adult-child/apply-yourself', file: 'routes/public/apply/$id/adult-child/apply-yourself.tsx', paths: { en: '/:lang/apply/:id/adult-child/apply-yourself', fr: '/:lang/demander/:id/adulte-enfant/postulez-vous-meme' } },
          { id: 'public/apply/$id/adult-child/dental-insurance', file: 'routes/public/apply/$id/adult-child/dental-insurance.tsx', paths: { en: '/:lang/apply/:id/adult-child/dental-insurance', fr: '/:lang/demander/:id/adulte-enfant/assurance-dentaire' } },
          {
            id: 'public/apply/$id/adult-child/disability-tax-credit',
            file: 'routes/public/apply/$id/adult-child/disability-tax-credit.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/disability-tax-credit', fr: '/:lang/demander/:id/adulte-enfant/credit-impot-personnes-handicapees' },
          },
          {
            id: 'public/apply/$id/adult-child/parent-or-guardian',
            file: 'routes/public/apply/$id/adult-child/parent-or-guardian.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/parent-or-guardian', fr: '/:lang/demander/:id/adulte-enfant/parent-ou-tuteur' },
          },
          { id: 'public/apply/$id/adult-child/mailing-address', file: 'routes/public/apply/$id/adult-child/mailing-address.tsx', paths: { en: '/:lang/apply/:id/adult-child/mailing-address', fr: '/:lang/demander/:id/adulte-enfant/adresse-postale' } },
          { id: 'public/apply/$id/adult-child/home-address', file: 'routes/public/apply/$id/adult-child/home-address.tsx', paths: { en: '/:lang/apply/:id/adult-child/home-address', fr: '/:lang/demander/:id/adulte-enfant/adresse-domicile' } },
          {
            id: 'public/apply/$id/adult-child/living-independently',
            file: 'routes/public/apply/$id/adult-child/living-independently.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/living-independently', fr: '/:lang/demander/:id/adulte-enfant/vivre-maniere-independante' },
          },
          { id: 'public/apply/$id/adult-child/marital-status', file: 'routes/public/apply/$id/adult-child/marital-status.tsx', paths: { en: '/:lang/apply/:id/adult-child/marital-status', fr: '/:lang/demander/:id/adulte-enfant/etat-civil' } },
          {
            id: 'public/apply/$id/adult-child/new-or-existing-member',
            file: 'routes/public/apply/$id/adult-child/new-or-existing-member.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/new-or-existing-member', fr: '/:lang/demander/:id/adulte-enfant/new-or-existing-member' },
          }, // TODO: Update French route
          { id: 'public/apply/$id/adult-child/phone-number', file: 'routes/public/apply/$id/adult-child/phone-number.tsx', paths: { en: '/:lang/apply/:id/adult-child/phone-number', fr: '/:lang/demander/:id/adulte-enfant/phone-number' } }, // TODO: Update French route
          { id: 'public/apply/$id/adult-child/email', file: 'routes/public/apply/$id/adult-child/email.tsx', paths: { en: '/:lang/apply/:id/adult-child/email', fr: '/:lang/demander/:id/adulte-enfant/adresse-courriel' } },
          {
            id: 'public/apply/$id/adult-child/partner-information',
            file: 'routes/public/apply/$id/adult-child/partner-information.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/partner-information', fr: '/:lang/demander/:id/adulte-enfant/renseignements-partenaire' },
          },
          {
            id: 'public/apply/$id/adult-child/applicant-information',
            file: 'routes/public/apply/$id/adult-child/applicant-information.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/applicant-information', fr: '/:lang/demander/:id/adulte-enfant/renseignements-demandeur' },
          },
          {
            id: 'public/apply/$id/adult-child/contact-apply-child',
            file: 'routes/public/apply/$id/adult-child/contact-apply-child.tsx',
            paths: { en: '/:lang/apply/:id/adult-child/contact-apply-child', fr: '/:lang/demander/:id/adulte-enfant/contact-demande-enfant' },
          },
          { id: 'public/apply/$id/adult-child/exit-application', file: 'routes/public/apply/$id/adult-child/exit-application.tsx', paths: { en: '/:lang/apply/:id/adult-child/exit-application', fr: '/:lang/demander/:id/adulte-enfant/quitter-demande' } },
          { id: 'public/apply/$id/child/children/index', file: 'routes/public/apply/$id/child/children/index.tsx', paths: { en: '/:lang/apply/:id/child/children', fr: '/:lang/demander/:id/enfant/enfants' } },
          {
            file: 'routes/public/apply/$id/child/children/$childId/layout.tsx',
            children: [
              {
                id: 'public/apply/$id/child/children/$childId/information',
                file: 'routes/public/apply/$id/child/children/$childId/information.tsx',
                paths: { en: '/:lang/apply/:id/child/children/:childId/information', fr: '/:lang/demander/:id/enfant/enfants/:childId/information' },
              },
              {
                id: 'public/apply/$id/child/children/$childId/dental-insurance',
                file: 'routes/public/apply/$id/child/children/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/apply/:id/child/children/:childId/dental-insurance', fr: '/:lang/demander/:id/enfant/enfants/:childId/assurance-dentaire' },
              },
              {
                id: 'public/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/public/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/apply/:id/child/children/:childId/confirm-federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/enfant/enfants/:childId/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
              },
              {
                id: 'public/apply/$id/child/children/$childId/federal-provincial-territorial-benefits',
                file: 'routes/public/apply/$id/child/children/$childId/federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/apply/:id/child/children/:childId/federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/enfant/enfants/:childId/prestations-dentaires-federales-provinciales-territoriales' },
              },
              {
                id: 'public/apply/$id/child/children/$childId/parent-or-guardian',
                file: 'routes/public/apply/$id/child/children/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/apply/:id/child/children/:childId/parent-or-guardian', fr: '/:lang/demander/:id/enfant/enfants/:childId/parent-ou-tuteur' },
              },
              {
                id: 'public/apply/$id/child/children/$childId/cannot-apply-child',
                file: 'routes/public/apply/$id/child/children/$childId/cannot-apply-child.tsx',
                paths: { en: '/:lang/apply/:id/child/children/:childId/cannot-apply-child', fr: '/:lang/demander/:id/enfant/enfants/:childId/pas-demande-enfant' },
              },
            ],
          },
          { id: 'public/apply/$id/child/applicant-information', file: 'routes/public/apply/$id/child/applicant-information.tsx', paths: { en: '/:lang/apply/:id/child/applicant-information', fr: '/:lang/demander/:id/enfant/renseignements-demandeur' } },
          { id: 'public/apply/$id/child/new-or-existing-member', file: 'routes/public/apply/$id/child/new-or-existing-member.tsx', paths: { en: '/:lang/apply/:id/child/new-or-existing-member', fr: '/:lang/demander/:id/enfant/new-or-existing-member' } }, // TODO: Update French route
          { id: 'public/apply/$id/child/marital-status', file: 'routes/public/apply/$id/child/marital-status.tsx', paths: { en: '/:lang/apply/:id/child/marital-status', fr: '/:lang/demander/:id/enfant/etat-civil' } },
          { id: 'public/apply/$id/child/phone-number', file: 'routes/public/apply/$id/child/phone-number.tsx', paths: { en: '/:lang/apply/:id/child/phone-number', fr: '/:lang/demander/:id/enfant/phone-number' } }, // TODO: Update French route
          { id: 'public/apply/$id/child/email', file: 'routes/public/apply/$id/child/email.tsx', paths: { en: '/:lang/apply/:id/child/email', fr: '/:lang/demander/:id/enfant/adresse-courriel' } },
          {
            id: 'public/apply/$id/child/communication-preference',
            file: 'routes/public/apply/$id/child/communication-preference.tsx',
            paths: { en: '/:lang/apply/:id/child/communication-preference', fr: '/:lang/demander/:id/child/preference-communication' },
          },
          { id: 'public/apply/$id/child/mailing-address', file: 'routes/public/apply/$id/child/mailing-address.tsx', paths: { en: '/:lang/apply/:id/child/mailing-address', fr: '/:lang/demander/:id/enfant/adresse-postale' } },
          { id: 'public/apply/$id/child/home-address', file: 'routes/public/apply/$id/child/home-address.tsx', paths: { en: '/:lang/apply/:id/child/home-address', fr: '/:lang/demander/:id/enfant/adresse-domicile' } },
          { id: 'public/apply/$id/child/confirmation', file: 'routes/public/apply/$id/child/confirmation.tsx', paths: { en: '/:lang/apply/:id/child/confirmation', fr: '/:lang/demander/:id/enfant/confirmation' } },
          { id: 'public/apply/$id/child/contact-apply-child', file: 'routes/public/apply/$id/child/contact-apply-child.tsx', paths: { en: '/:lang/apply/:id/child/contact-apply-child', fr: '/:lang/demander/:id/enfant/contact-demande-enfant' } },
          { id: 'public/apply/$id/child/exit-application', file: 'routes/public/apply/$id/child/exit-application.tsx', paths: { en: '/:lang/apply/:id/child/exit-application', fr: '/:lang/demander/:id/enfant/quitter-demande' } },
          { id: 'public/apply/$id/child/partner-information', file: 'routes/public/apply/$id/child/partner-information.tsx', paths: { en: '/:lang/apply/:id/child/partner-information', fr: '/:lang/demander/:id/enfant/renseignements-partenaire' } },
          {
            id: 'public/apply/$id/child/review-adult-information',
            file: 'routes/public/apply/$id/child/review-adult-information.tsx',
            paths: { en: '/:lang/apply/:id/child/review-adult-information', fr: '/:lang/demander/:id/enfant/revue-renseignements-adulte' },
          },
          {
            id: 'public/apply/$id/child/review-child-information',
            file: 'routes/public/apply/$id/child/review-child-information.tsx',
            paths: { en: '/:lang/apply/:id/child/review-child-information', fr: '/:lang/demander/:id/enfant/revue-enfant-renseignements' },
          },
          { id: 'public/apply/$id/index', file: 'routes/public/apply/$id/index.tsx', paths: { en: '/:lang/apply/:id', fr: '/:lang/demander/:id' } },
          { id: 'public/apply/$id/terms-and-conditions', file: 'routes/public/apply/$id/terms-and-conditions.tsx', paths: { en: '/:lang/apply/:id/terms-and-conditions', fr: '/:lang/demander/:id/conditions-utilisation' } },
          { id: 'public/apply/$id/tax-filing', file: 'routes/public/apply/$id/tax-filing.tsx', paths: { en: '/:lang/apply/:id/tax-filing', fr: '/:lang/demander/:id/declaration-impot' } },
          { id: 'public/apply/$id/file-taxes', file: 'routes/public/apply/$id/file-taxes.tsx', paths: { en: '/:lang/apply/:id/file-taxes', fr: '/:lang/demander/:id/produire-declaration-revenus' } },
          { id: 'public/apply/$id/type-application', file: 'routes/public/apply/$id/type-application.tsx', paths: { en: '/:lang/apply/:id/type-application', fr: '/:lang/demander/:id/type-demande' } },
          { id: 'public/apply/$id/application-delegate', file: 'routes/public/apply/$id/application-delegate.tsx', paths: { en: '/:lang/apply/:id/application-delegate', fr: '/:lang/demander/:id/delegue-demande' } },
        ],
      },
      {
        file: 'routes/public/status/layout.tsx',
        children: [
          { id: 'public/status/index', file: 'routes/public/status/index.tsx', paths: { en: '/:lang/status', fr: '/:lang/etat' } },
          { id: 'public/status/myself', file: 'routes/public/status/myself.tsx', paths: { en: '/:lang/status/myself', fr: '/:lang/etat/moi-meme' } },
          { id: 'public/status/child', file: 'routes/public/status/child.tsx', paths: { en: '/:lang/status/child', fr: '/:lang/etat/enfant' } },
          { id: 'public/status/result', file: 'routes/public/status/result.tsx', paths: { en: '/:lang/status/result', fr: '/:lang/etat/resultat' } },
        ],
      },
      {
        file: 'routes/public/renew/layout.tsx',
        children: [
          { id: 'public/renew/index', file: 'routes/public/renew/index.tsx', paths: { en: '/:lang/renew', fr: '/:lang/renouveler' } },
          { id: 'public/renew/$id/terms-and-conditions', file: 'routes/public/renew/$id/terms-and-conditions.tsx', paths: { en: '/:lang/renew/:id/terms-and-conditions', fr: '/:lang/renouveler/:id/conditions-utilisation' } },
          { id: 'public/renew/$id/applicant-information', file: 'routes/public/renew/$id/applicant-information.tsx', paths: { en: '/:lang/renew/:id/applicant-information', fr: '/:lang/renouveler/:id/renseignements-demandeur' } },
          { id: 'public/renew/$id/type-renewal', file: 'routes/public/renew/$id/type-renewal.tsx', paths: { en: '/:lang/renew/:id/type-renewal', fr: '/:lang/renouveler/:id/type-renouvellement' } },
          { id: 'public/renew/$id/renewal-delegate', file: 'routes/public/renew/$id/renewal-delegate.tsx', paths: { en: '/:lang/renew/:id/renewal-delegate', fr: '/:lang/renouveler/:id/renouvellement-delegue' } },
          { id: 'public/renew/$id/tax-filing', file: 'routes/public/renew/$id/tax-filing.tsx', paths: { en: '/:lang/renew/:id/tax-filing', fr: '/:lang/renouveler/:id/declaration-impot' } },
          { id: 'public/renew/$id/file-taxes', file: 'routes/public/renew/$id/file-taxes.tsx', paths: { en: '/:lang/renew/:id/file-taxes', fr: '/:lang/renouveler/:id/produire-declaration-revenus' } },
          { id: 'public/renew/$id/ita/marital-status', file: 'routes/public/renew/$id/ita/marital-status.tsx', paths: { en: '/:lang/renew/:id/ita/marital-status', fr: '/:lang/renouveler/:id/ita/etat-civil' } },
          { id: 'public/renew/$id/ita/confirm-phone', file: 'routes/public/renew/$id/ita/confirm-phone.tsx', paths: { en: '/:lang/renew/:id/ita/confirm-phone', fr: '/:lang/renouveler/:id/ita/confirmer-telephone' } },
          { id: 'public/renew/$id/ita/confirm-email', file: 'routes/public/renew/$id/ita/confirm-email.tsx', paths: { en: '/:lang/renew/:id/ita/confirm-email', fr: '/:lang/renouveler/:id/ita/confirmer-courriel' } },
          { id: 'public/renew/$id/ita/confirm-address', file: 'routes/public/renew/$id/ita/confirm-address.tsx', paths: { en: '/:lang/renew/:id/ita/confirm-address', fr: '/:lang/renouveler/:id/ita/confirmer-adresse' } },
          { id: 'public/renew/$id/ita/update-mailing-address', file: 'routes/public/renew/$id/ita/update-mailing-address.tsx', paths: { en: '/:lang/renew/:id/ita/update-mailing-address', fr: '/:lang/renouveler/:id/ita/mise-a-jour-adresse-postale' } },
          { id: 'public/renew/$id/ita/update-home-address', file: 'routes/public/renew/$id/ita/update-home-address.tsx', paths: { en: '/:lang/renew/:id/ita/update-home-address', fr: '/:lang/renouveler/:id/ita/mise-a-jour-adresse-domicile' } },
          { id: 'public/renew/$id/ita/dental-insurance', file: 'routes/public/renew/$id/ita/dental-insurance.tsx', paths: { en: '/:lang/renew/:id/ita/dental-insurance', fr: '/:lang/renouveler/:id/ita/assurance-dentaire' } },
          {
            id: 'public/renew/$id/ita/federal-provincial-territorial-benefits',
            file: 'routes/public/renew/$id/ita/federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/renew/:id/ita/federal-provincial-territorial-benefits', fr: '/:lang/renouveler/:id/ita/prestations-dentaires-federales-provinciales-territoriales' },
          },
          { id: 'public/renew/$id/ita/review-information', file: 'routes/public/renew/$id/ita/review-information.tsx', paths: { en: '/:lang/renew/:id/ita/review-information', fr: '/:lang/renouveler/:id/ita/revue-renseignements' } },
          { id: 'public/renew/$id/ita/confirmation', file: 'routes/public/renew/$id/ita/confirmation.tsx', paths: { en: '/:lang/renew/:id/ita/confirmation', fr: '/:lang/renouveler/:id/ita/confirmation' } },
          { id: 'public/renew/$id/ita/exit-application', file: 'routes/public/renew/$id/ita/exit-application.tsx', paths: { en: '/:lang/renew/:id/ita/exit-application', fr: '/:lang/renouveler/:id/ita/quitter-demande' } },
          { id: 'public/renew/$id/ita/demographic-survey', file: 'routes/public/renew/$id/ita/demographic-survey.tsx', paths: { en: '/:lang/renew/:id/ita/demographic-survey', fr: '/:lang/renouveler/:id/ita/questionnaire-demographique' } },
          {
            id: 'public/renew/$id/adult-child/confirm-marital-status',
            file: 'routes/public/renew/$id/adult-child/confirm-marital-status.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/confirm-marital-status', fr: '/:lang/renouveler/:id/adulte-enfant/confirmer-etat-civil' },
          },
          { id: 'public/renew/$id/adult-child/marital-status', file: 'routes/public/renew/$id/adult-child/marital-status.tsx', paths: { en: '/:lang/renew/:id/adult-child/marital-status', fr: '/:lang/renouveler/:id/adulte-enfant/etat-civil' } },
          { id: 'public/renew/$id/adult-child/confirmation', file: 'routes/public/renew/$id/adult-child/confirmation.tsx', paths: { en: '/:lang/renew/:id/adult-child/confirmation', fr: '/:lang/renouveler/:id/adulte-enfant/confirmation' } },
          { id: 'public/renew/$id/adult-child/confirm-phone', file: 'routes/public/renew/$id/adult-child/confirm-phone.tsx', paths: { en: '/:lang/renew/:id/adult-child/confirm-phone', fr: '/:lang/renouveler/:id/adulte-enfant/confirmer-telephone' } },
          { id: 'public/renew/$id/adult-child/confirm-email', file: 'routes/public/renew/$id/adult-child/confirm-email.tsx', paths: { en: '/:lang/renew/:id/adult-child/confirm-email', fr: '/:lang/renouveler/:id/adulte-enfant/confirmer-courriel' } },
          { id: 'public/renew/$id/adult-child/confirm-address', file: 'routes/public/renew/$id/adult-child/confirm-address.tsx', paths: { en: '/:lang/renew/:id/adult-child/confirm-address', fr: '/:lang/renouveler/:id/adulte-enfant/confirmer-adresse' } },
          {
            id: 'public/renew/$id/adult-child/update-mailing-address',
            file: 'routes/public/renew/$id/adult-child/update-mailing-address.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/update-mailing-address', fr: '/:lang/renouveler/:id/adulte-enfant/mise-a-jour-adresse-postale' },
          },
          {
            id: 'public/renew/$id/adult-child/update-home-address',
            file: 'routes/public/renew/$id/adult-child/update-home-address.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/update-home-address', fr: '/:lang/renouveler/:id/adulte-enfant/mise-a-jour-adresse-domicile' },
          },
          {
            id: 'public/renew/$id/adult-child/dental-insurance',
            file: 'routes/public/renew/$id/adult-child/dental-insurance.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/dental-insurance', fr: '/:lang/renouveler/:id/adulte-enfant/assurance-dentaire' },
          },
          {
            id: 'public/renew/$id/adult-child/confirm-federal-provincial-territorial-benefits',
            file: 'routes/public/renew/$id/adult-child/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/confirm-federal-provincial-territorial-benefits', fr: '/:lang/renouveler/:id/adulte-enfant/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'public/renew/$id/adult-child/update-federal-provincial-territorial-benefits',
            file: 'routes/public/renew/$id/adult-child/update-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/update-federal-provincial-territorial-benefits', fr: '/:lang/renouveler/:id/adulte-enfant/mise-a-jour-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'public/renew/$id/adult-child/demographic-survey',
            file: 'routes/public/renew/$id/adult-child/demographic-survey.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/demographic-survey', fr: '/:lang/renouveler/:id/adulte-enfant/questionnaire-demographique' },
          },
          { id: 'public/renew/$id/adult-child/children/index', file: 'routes/public/renew/$id/adult-child/children/index.tsx', paths: { en: '/:lang/renew/:id/adult-child/children', fr: '/:lang/renouveler/:id/adulte-enfant/enfant' } },
          {
            file: 'routes/public/renew/$id/adult-child/children/$childId/layout.tsx',
            children: [
              {
                id: 'public/renew/$id/adult-child/children/$childId/information',
                file: 'routes/public/renew/$id/adult-child/children/$childId/information.tsx',
                paths: { en: '/:lang/renew/:id/adult-child/children/:childId/information', fr: '/:lang/renouveler/:id/adulte-enfant/enfant/:childId/information' },
              },
              {
                id: 'public/renew/$id/adult-child/children/$childId/parent-or-guardian',
                file: 'routes/public/renew/$id/adult-child/children/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/renew/:id/adult-child/children/:childId/parent-or-guardian', fr: '/:lang/renouveler/:id/adulte-enfant/enfant/:childId/parent-ou-tuteur' },
              },
              {
                id: 'public/renew/$id/adult-child/children/$childId/dental-insurance',
                file: 'routes/public/renew/$id/adult-child/children/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/renew/:id/adult-child/children/:childId/dental-insurance', fr: '/:lang/renouveler/:id/adulte-enfant/enfant/:childId/assurance-dentaire' },
              },
              {
                id: 'public/renew/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/public/renew/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: {
                  en: '/:lang/renew/:id/adult-child/children/:childId/confirm-federal-provincial-territorial-benefits',
                  fr: '/:lang/renouveler/:id/adulte-enfant/enfant/:childId/confirmer-prestations-dentaires-federales-provinciales-territoriales',
                },
              },
              {
                id: 'public/renew/$id/adult-child/children/$childId/update-federal-provincial-territorial-benefits',
                file: 'routes/public/renew/$id/adult-child/children/$childId/update-federal-provincial-territorial-benefits.tsx',
                paths: {
                  en: '/:lang/renew/:id/adult-child/children/:childId/update-federal-provincial-territorial-benefits',
                  fr: '/:lang/renouveler/:id/adulte-enfant/enfant/:childId/mise-a-jour-prestations-dentaires-federales-provinciales-territoriales',
                },
              },
              {
                id: 'public/renew/$id/adult-child/children/$childId/demographic-survey',
                file: 'routes/public/renew/$id/adult-child/children/$childId/demographic-survey.tsx',
                paths: { en: '/:lang/renew/:id/adult-child/children/:childId/demographic-survey', fr: '/:lang/renouveler/:id/adulte-enfant/enfant/:childId/questionnaire-demographique' },
              },
            ],
          },
          {
            id: 'public/renew/$id/adult-child/review-adult-information',
            file: 'routes/public/renew/$id/adult-child/review-adult-information.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/review-adult-information', fr: '/:lang/renouveler/:id/adulte-enfant/revue-renseignements-adulte' },
          },
          {
            id: 'public/renew/$id/adult-child/review-child-information',
            file: 'routes/public/renew/$id/adult-child/review-child-information.tsx',
            paths: { en: '/:lang/renew/:id/adult-child/review-child-information', fr: '/:lang/renouveler/:id/adulte-enfant/revue-renseignements-enfant' },
          },
          { id: 'public/renew/$id/adult-child/exit-application', file: 'routes/public/renew/$id/adult-child/exit-application.tsx', paths: { en: '/:lang/renew/:id/adult-child/exit-application', fr: '/:lang/renouveler/:id/adulte-enfant/quitter-demande' } },
          { id: 'public/renew/$id/child/children/index', file: 'routes/public/renew/$id/child/children/index.tsx', paths: { en: '/:lang/renew/:id/child/children', fr: '/:lang/renouveler/:id/enfant/enfant' } },
          {
            file: 'routes/public/renew/$id/child/children/$childId/layout.tsx',
            children: [
              {
                id: 'public/renew/$id/child/children/$childId/information',
                file: 'routes/public/renew/$id/child/children/$childId/information.tsx',
                paths: { en: '/:lang/renew/:id/child/children/:childId/information', fr: '/:lang/renouveler/:id/enfant/enfants/:childId/information' },
              },
              {
                id: 'public/renew/$id/child/children/$childId/parent-or-guardian',
                file: 'routes/public/renew/$id/child/children/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/renew/:id/child/children/:childId/parent-or-guardian', fr: '/:lang/renouveler/:id/enfant/enfants/:childId/parent-ou-tuteur' },
              },
              {
                id: 'public/renew/$id/child/children/$childId/dental-insurance',
                file: 'routes/public/renew/$id/child/children/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/renew/:id/child/children/:childId/dental-insurance', fr: '/:lang/renouveler/:id/enfant/enfants/:childId/assurance-dentaire' },
              },
              {
                id: 'public/renew/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/public/renew/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/renew/:id/child/children/:childId/confirm-federal-provincial-territorial-benefits', fr: '/:lang/renouveler/:id/enfant/enfants/:childId/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
              },
              {
                id: 'public/renew/$id/child/children/$childId/update-federal-provincial-territorial-benefits',
                file: 'routes/public/renew/$id/child/children/$childId/update-federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/renew/:id/child/children/:childId/update-federal-provincial-territorial-benefits', fr: '/:lang/renouveler/:id/enfant/enfants/:childId/mise-a-jour-prestations-dentaires-federales-provinciales-territoriales' },
              },
              {
                id: 'public/renew/$id/child/children/$childId/demographic-survey',
                file: 'routes/public/renew/$id/child/children/$childId/demographic-survey.tsx',
                paths: { en: '/:lang/renew/:id/child/children/:childId/demographic-survey', fr: '/:lang/renouveler/:id/enfant/enfants/:childId/questionnaire-demographique' },
              },
            ],
          },
          {
            id: 'public/renew/$id/child/review-child-information',
            file: 'routes/public/renew/$id/child/review-child-information.tsx',
            paths: { en: '/:lang/renew/:id/child/review-child-information', fr: '/:lang/renouveler/:id/enfant/revue-renseignements-enfant' },
          },
          {
            id: 'public/renew/$id/child/review-adult-information',
            file: 'routes/public/renew/$id/child/review-adult-information.tsx',
            paths: { en: '/:lang/renew/:id/child/review-adult-information', fr: '/:lang/renouveler/:id/enfant/revue-renseignements-adulte' },
          },
          { id: 'public/renew/$id/child/confirmation', file: 'routes/public/renew/$id/child/confirmation.tsx', paths: { en: '/:lang/renew/:id/child/confirmation', fr: '/:lang/renouveler/:id/enfant/confirmation' } },
          { id: 'public/renew/$id/child/exit-application', file: 'routes/public/renew/$id/child/exit-application.tsx', paths: { en: '/:lang/renew/:id/child/exit-application', fr: '/:lang/renouveler/:id/enfant/quitter-demande' } },

          { id: 'public/renew/$id/child/parent-intro', file: 'routes/public/renew/$id/child/parent-intro.tsx', paths: { en: '/:lang/renew/:id/child/parent-intro', fr: '/:lang/renouveler/:id/enfant/parent-intro' } },
          { id: 'public/renew/$id/child/confirm-marital-status', file: 'routes/public/renew/$id/child/confirm-marital-status.tsx', paths: { en: '/:lang/renew/:id/child/confirm-marital-status', fr: '/:lang/renouveler/:id/enfant/confirmer-etat-civil' } },
          { id: 'public/renew/$id/child/marital-status', file: 'routes/public/renew/$id/child/marital-status.tsx', paths: { en: '/:lang/renew/:id/child/marital-status', fr: '/:lang/renouveler/:id/enfant/etat-civil' } },
          { id: 'public/renew/$id/child/confirm-address', file: 'routes/public/renew/$id/child/confirm-address.tsx', paths: { en: '/:lang/renew/:id/child/confirm-address', fr: '/:lang/renouveler/:id/enfant/confirmer-adresse' } },
          {
            id: 'public/renew/$id/child/update-mailing-address',
            file: 'routes/public/renew/$id/child/update-mailing-address.tsx',
            paths: { en: '/:lang/renew/:id/child/update-mailing-address', fr: '/:lang/renouveler/:id/enfant/mise-a-jour-adresse-postale' },
          },
          { id: 'public/renew/$id/child/update-home-address', file: 'routes/public/renew/$id/child/update-home-address.tsx', paths: { en: '/:lang/renew/:id/child/update-home-address', fr: '/:lang/renouveler/:id/enfant/mise-a-jour-adresse-domicile' } },

          { id: 'public/renew/$id/child/confirm-phone', file: 'routes/public/renew/$id/child/confirm-phone.tsx', paths: { en: '/:lang/renew/:id/child/confirm-phone', fr: '/:lang/renouveler/:id/enfant/confirmer-telephone' } },
          { id: 'public/renew/$id/child/confirm-email', file: 'routes/public/renew/$id/child/confirm-email.tsx', paths: { en: '/:lang/renew/:id/child/confirm-email', fr: '/:lang/renouveler/:id/enfant/confirmer-courriel' } },

          { id: 'public/renew/$id/adult/confirmation', file: 'routes/public/renew/$id/adult/confirmation.tsx', paths: { en: '/:lang/renew/:id/adult/confirmation', fr: '/:lang/renouveler/:id/adulte/confirmation' } },
          { id: 'public/renew/$id/adult/confirm-marital-status', file: 'routes/public/renew/$id/adult/confirm-marital-status.tsx', paths: { en: '/:lang/renew/:id/adult/confirm-marital-status', fr: '/:lang/renouveler/:id/adulte/confirmer-etat-civil' } },
          { id: 'public/renew/$id/adult/marital-status', file: 'routes/public/renew/$id/adult/marital-status.tsx', paths: { en: '/:lang/renew/:id/adult/marital-status', fr: '/:lang/renouveler/:id/adulte/etat-civil' } },
          { id: 'public/renew/$id/adult/confirm-phone', file: 'routes/public/renew/$id/adult/confirm-phone.tsx', paths: { en: '/:lang/renew/:id/adult/confirm-phone', fr: '/:lang/renouveler/:id/adulte/confirmer-telephone' } },
          { id: 'public/renew/$id/adult/confirm-email', file: 'routes/public/renew/$id/adult/confirm-email.tsx', paths: { en: '/:lang/renew/:id/adult/confirm-email', fr: '/:lang/renouveler/:id/adulte/confirmer-courriel' } },
          { id: 'public/renew/$id/adult/confirm-address', file: 'routes/public/renew/$id/adult/confirm-address.tsx', paths: { en: '/:lang/renew/:id/adult/confirm-address', fr: '/:lang/renouveler/:id/adulte/confirmer-adresse' } },
          {
            id: 'public/renew/$id/adult/update-mailing-address',
            file: 'routes/public/renew/$id/adult/update-mailing-address.tsx',
            paths: { en: '/:lang/renew/:id/adult/update-mailing-address', fr: '/:lang/renouveler/:id/adulte/mise-a-jour-adresse-postale' },
          },
          { id: 'public/renew/$id/adult/update-home-address', file: 'routes/public/renew/$id/adult/update-home-address.tsx', paths: { en: '/:lang/renew/:id/adult/update-home-address', fr: '/:lang/renouveler/:id/adulte/mise-a-jour-adresse-domicile' } },
          { id: 'public/renew/$id/adult/dental-insurance', file: 'routes/public/renew/$id/adult/dental-insurance.tsx', paths: { en: '/:lang/renew/:id/adult/dental-insurance', fr: '/:lang/renouveler/:id/adulte/assurance-dentaire' } },
          {
            id: 'public/renew/$id/adult/confirm-federal-provincial-territorial-benefits',
            file: 'routes/public/renew/$id/adult/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/renew/:id/adult/confirm-federal-provincial-territorial-benefits', fr: '/:lang/renouveler/:id/adulte/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'public/renew/$id/adult/update-federal-provincial-territorial-benefits',
            file: 'routes/public/renew/$id/adult/update-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/renew/:id/adult/update-federal-provincial-territorial-benefits', fr: '/:lang/renouveler/:id/adulte/mise-a-jour-prestations-dentaires-federales-provinciales-territoriales' },
          },
          { id: 'public/renew/$id/adult/demographic-survey', file: 'routes/public/renew/$id/adult/demographic-survey.tsx', paths: { en: '/:lang/renew/:id/adult/demographic-survey', fr: '/:lang/renouveler/:id/adulte/questionnaire-demographique' } },
          {
            id: 'public/renew/$id/adult/review-adult-information',
            file: 'routes/public/renew/$id/adult/review-adult-information.tsx',
            paths: { en: '/:lang/renew/:id/adult/review-adult-information', fr: '/:lang/renouveler/:id/adulte/revue-renseignements-adulte' },
          },
          { id: 'public/renew/$id/adult/exit-application', file: 'routes/public/renew/$id/adult/exit-application.tsx', paths: { en: '/:lang/renew/:id/adult/exit-application', fr: '/:lang/renouveler/:id/adulte/quitter-demande' } },
        ],
      },
      { id: 'public/unable-to-process-request', file: 'routes/public/unable-to-process-request.tsx', paths: { en: '/:lang/unable-to-process-request', fr: '/:lang/impossible-de-traiter-la-demande' } },
    ],
  },
] as const satisfies I18nRoute[];
