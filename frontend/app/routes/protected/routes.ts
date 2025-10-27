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
        id: 'protected/documents/index',
        file: 'routes/protected/documents/index.tsx',
        paths: { en: '/:lang/protected/documents', fr: '/:lang/protege/documents' },
      },
      {
        id: 'protected/documents/upload',
        file: 'routes/protected/documents/upload.tsx',
        paths: { en: '/:lang/protected/documents/upload', fr: '/:lang/protege/documents/televerser' },
      },
      {
        id: 'protected/documents/not-required',
        file: 'routes/protected/documents/not-required.tsx',
        paths: { en: '/:lang/protected/documents/not-required', fr: '/:lang/protege/documents/non-requis' },
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
        id: 'protected/profile/eligibility',
        file: 'routes/protected/profile/eligibility.tsx',
        paths: { en: '/:lang/protected/profile/eligibility', fr: '/:lang/protege/profil/admissibilite' },
      },
      {
        id: 'protected/profile/applicant-information',
        file: 'routes/protected/profile/applicant-information.tsx',
        paths: { en: '/:lang/protected/profile/applicant-information', fr: '/:lang/protege/profil/applicant-information' },
      },
      {
        id: 'protected/profile/dental-benefits',
        file: 'routes/protected/profile/dental-benefits.tsx',
        paths: { en: '/:lang/protected/profile/dental-benefits', fr: '/:lang/protege/profil/prestations-dentaires' },
      },
      {
        id: 'protected/profile/dental-benefits/edit',
        file: 'routes/protected/profile/edit-dental-benefits.tsx',
        paths: { en: '/:lang/protected/profile/dental-benefits/edit', fr: '/:lang/protege/profil/prestations-dentaires/modifier' },
      },
      {
        id: 'protected/profile/dental-benefits/:childId/edit',
        file: 'routes/protected/profile/edit-child-dental-benefits.tsx',
        paths: { en: '/:lang/protected/profile/dental-benefits/:childId/edit', fr: '/:lang/protege/profil/prestations-dentaires/:childId/modifier' },
      },
      {
        id: 'protected/profile/communication-preferences',
        file: 'routes/protected/profile/communication-preferences.tsx',
        paths: { en: '/:lang/protected/profile/communication-preferences', fr: '/:lang/protege/profil/preferences-communication' },
      },
      {
        id: 'protected/profile/communication-preferences/edit',
        file: 'routes/protected/profile/edit-communication-preferences.tsx',
        paths: { en: '/:lang/protected/profile/communication-preferences/edit', fr: '/:lang/protege/profil/preferences-de-communication/modifier' },
      },
      {
        id: 'protected/profile/contact/phone',
        file: 'routes/protected/profile/phone-number.tsx',
        paths: { en: '/:lang/protected/profile/contact/phone', fr: '/:lang/protege/profil/coordonnees/telephone' },
      },
      {
        id: 'protected/profile/contact-information',
        file: 'routes/protected/profile/contact-information.tsx',
        paths: { en: '/:lang/protected/profile/contact-information', fr: '/:lang/protege/profil/coordonnees' },
      },
      {
        id: 'protected/profile/contact/email-address',
        file: 'routes/protected/profile/email.tsx',
        paths: { en: '/:lang/protected/profile/contact/email-address', fr: '/:lang/protege/profil/cordonnees/adresse-courriel' },
      },
      {
        id: 'protected/profile/contact/email-address/verify',
        file: 'routes/protected/profile/verify-email.tsx',
        paths: { en: '/:lang/protected/profile/contact/email-address/verify', fr: '/:lang/protege/profil/cordonnees/adresse-courriel/verifier' },
      },
      {
        id: 'protected/profile/contact/mailing-address',
        file: 'routes/protected/profile/mailing-address.tsx',
        paths: { en: '/:lang/protected/profile/contact/mailing-address', fr: '/:lang/protege/profil/cordonnees/adresse-postale' },
      },
      {
        id: 'protected/profile/contact/home-address',
        file: 'routes/protected/profile/home-address.tsx',
        paths: { en: '/:lang/protected/profile/contact/home-address', fr: '/:lang/protege/profil/cordonnees/adresse-domicile' },
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
          {
            id: 'protected/apply/$id/adult-child/applicant-information',
            file: 'routes/protected/apply/$id/adult-child/applicant-information.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/applicant-information', fr: '/:lang/protege/demander/:id/adulte-enfant/renseignements-demandeur' },
          },
          {
            id: 'protected/apply/$id/adult-child/communication-preference',
            file: 'routes/protected/apply/$id/adult-child/communication-preference.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/communication-preference', fr: '/:lang/protege/demander/:id/adulte-enfant/preference-communication' },
          },
          {
            id: 'protected/apply/$id/adult-child/dental-insurance',
            file: 'routes/protected/apply/$id/adult-child/dental-insurance.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/dental-insurance', fr: '/:lang/protege/demander/:id/adulte-enfant/assurance-dentaire' },
          },
          {
            id: 'protected/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits',
            file: 'routes/protected/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/confirm-federal-provincial-territorial-benefits', fr: '/:lang/protege/demander/:id/adulte-enfant/confirmer-prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'protected/apply/$id/adult-child/federal-provincial-territorial-benefits',
            file: 'routes/protected/apply/$id/adult-child/federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/federal-provincial-territorial-benefits', fr: '/:lang/protege/demander/:id/adulte-enfant/prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'protected/apply/$id/adult-child/parent-or-guardian',
            file: 'routes/protected/apply/$id/adult-child/parent-or-guardian.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/parent-or-guardian', fr: '/:lang/protege/demander/:id/adulte-enfant/parent-ou-tuteur' },
          },
          {
            id: 'protected/apply/$id/adult-child/living-independently',
            file: 'routes/protected/apply/$id/adult-child/living-independently.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/living-independently', fr: '/:lang/protege/demander/:id/adulte-enfant/vivre-maniere-independante' },
          },
          {
            id: 'protected/apply/$id/adult-child/new-or-existing-member',
            file: 'routes/protected/apply/$id/adult-child/new-or-existing-member.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/new-or-existing-member', fr: '/:lang/protege/demander/:id/adulte-enfant/membre-nouveau-ou-actuel' },
          },
          {
            id: 'protected/apply/$id/adult-child/phone-number',
            file: 'routes/protected/apply/$id/adult-child/phone-number.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/phone-number', fr: '/:lang/protege/demander/:id/adulte-enfant/numero-telephone' },
          },
          {
            id: 'protected/apply/$id/adult-child/verify-email',
            file: 'routes/protected/apply/$id/adult-child/verify-email.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/verify-email', fr: '/:lang/protege/demander/:id/adulte-enfant/verifier-courriel' },
          },
          { id: 'protected/apply/$id/adult-child/email', file: 'routes/protected/apply/$id/adult-child/email.tsx', paths: { en: '/:lang/protected/apply/:id/adult-child/email', fr: '/:lang/protege/demander/:id/adulte-enfant/adresse-courriel' } },
          {
            id: 'protected/apply/$id/adult-child/marital-status',
            file: 'routes/protected/apply/$id/adult-child/marital-status.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/marital-status', fr: '/:lang/protege/demander/:id/adulte-enfant/etat-civil' },
          },
          {
            id: 'protected/apply/$id/adult-child/mailing-address',
            file: 'routes/protected/apply/$id/adult-child/mailing-address.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/mailing-address', fr: '/:lang/protege/demander/:id/adulte-enfant/adresse-postale' },
          },
          {
            id: 'protected/apply/$id/adult-child/home-address',
            file: 'routes/protected/apply/$id/adult-child/home-address.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/home-address', fr: '/:lang/protege/demander/:id/adulte-enfant/adresse-domicile' },
          },
          {
            id: 'protected/apply/$id/adult-child/children/index',
            file: 'routes/protected/apply/$id/adult-child/children/index.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/children', fr: '/:lang/protege/demander/:id/adulte-enfant/enfants' },
          },
          {
            file: 'routes/protected/apply/$id/adult-child/children/$childId/layout.tsx',
            children: [
              {
                id: 'protected/apply/$id/adult-child/children/$childId/information',
                file: 'routes/protected/apply/$id/adult-child/children/$childId/information.tsx',
                paths: { en: '/:lang/protected/apply/:id/adult-child/children/:childId/information', fr: '/:lang/protege/demander/:id/adulte-enfant/enfants/:childId/information' },
              },
              {
                id: 'protected/apply/$id/adult-child/children/$childId/dental-insurance',
                file: 'routes/protected/apply/$id/adult-child/children/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/protected/apply/:id/adult-child/children/:childId/dental-insurance', fr: '/:lang/protege/demander/:id/adulte-enfant/enfants/:childId/assurance-dentaire' },
              },
              {
                id: 'protected/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/protected/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: {
                  en: '/:lang/protected/apply/:id/adult-child/children/:childId/confirm-federal-provincial-territorial-benefits',
                  fr: '/:lang/protege/demander/:id/adulte-enfant/enfants/:childId/confirmer-prestations-dentaires-federales-provinciales-territoriales',
                },
              },
              {
                id: 'protected/apply/$id/adult-child/children/$childId/federal-provincial-territorial-benefits',
                file: 'routes/protected/apply/$id/adult-child/children/$childId/federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/protected/apply/:id/adult-child/children/:childId/federal-provincial-territorial-benefits', fr: '/:lang/protege/demander/:id/adulte-enfant/enfants/:childId/prestations-dentaires-federales-provinciales-territoriales' },
              },
              {
                id: 'protected/apply/$id/adult-child/children/$childId/parent-or-guardian',
                file: 'routes/protected/apply/$id/adult-child/children/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/protected/apply/:id/adult-child/children/:childId/parent-or-guardian', fr: '/:lang/protege/demander/:id/adulte-enfant/enfants/:childId/parent-ou-tuteur' },
              },
              {
                id: 'protected/apply/$id/adult-child/children/$childId/cannot-apply-child',
                file: 'routes/protected/apply/$id/adult-child/children/$childId/cannot-apply-child.tsx',
                paths: { en: '/:lang/protected/apply/:id/adult-child/children/:childId/cannot-apply-child', fr: '/:lang/protege/demander/:id/adulte-enfant/enfants/:childId/pas-demande-enfant' },
              },
            ],
          },
          {
            id: 'protected/apply/$id/adult-child/review-adult-information',
            file: 'routes/protected/apply/$id/adult-child/review-adult-information.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/review-adult-information', fr: '/:lang/protege/demander/:id/adulte-enfant/revue-renseignements-adulte' },
          },
          {
            id: 'protected/apply/$id/adult-child/review-child-information',
            file: 'routes/protected/apply/$id/adult-child/review-child-information.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/review-child-information', fr: '/:lang/protege/demander/:id/adulte-enfant/revue-renseignements-enfant' },
          },
          {
            id: 'protected/apply/$id/adult-child/exit-application',
            file: 'routes/protected/apply/$id/adult-child/exit-application.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/exit-application', fr: '/:lang/protege/demander/:id/adulte-enfant/quitter-demande' },
          },
          {
            id: 'protected/apply/$id/adult-child/confirmation',
            file: 'routes/protected/apply/$id/adult-child/confirmation.tsx',
            paths: { en: '/:lang/protected/apply/:id/adult-child/confirmation', fr: '/:lang/protege/demander/:id/adulte-enfant/confirmation' },
          },
          { id: 'protected/apply/$id/child/children/index', file: 'routes/protected/apply/$id/child/children/index.tsx', paths: { en: '/:lang/protected/apply/:id/child/children', fr: '/:lang/protege/demander/:id/enfant/enfants' } },
          {
            file: 'routes/protected/apply/$id/child/children/$childId/layout.tsx',
            children: [
              {
                id: 'protected/apply/$id/child/children/$childId/information',
                file: 'routes/protected/apply/$id/child/children/$childId/information.tsx',
                paths: { en: '/:lang/protected/apply/:id/child/children/:childId/information', fr: '/:lang/protege/demander/:id/enfant/enfants/:childId/information' },
              },
              {
                id: 'protected/apply/$id/child/children/$childId/dental-insurance',
                file: 'routes/protected/apply/$id/child/children/$childId/dental-insurance.tsx',
                paths: { en: '/:lang/protected/apply/:id/child/children/:childId/dental-insurance', fr: '/:lang/protege/demander/:id/enfant/enfants/:childId/assurance-dentaire' },
              },
              {
                id: 'protected/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits',
                file: 'routes/protected/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits.tsx',
                paths: {
                  en: '/:lang/protected/apply/:id/child/children/:childId/confirm-federal-provincial-territorial-benefits',
                  fr: '/:lang/protege/demander/:id/enfant/enfants/:childId/confirmer-prestations-dentaires-federales-provinciales-territoriales',
                },
              },
              {
                id: 'protected/apply/$id/child/children/$childId/federal-provincial-territorial-benefits',
                file: 'routes/protected/apply/$id/child/children/$childId/federal-provincial-territorial-benefits.tsx',
                paths: { en: '/:lang/protected/apply/:id/child/children/:childId/federal-provincial-territorial-benefits', fr: '/:lang/protege/demander/:id/enfant/enfants/:childId/prestations-dentaires-federales-provinciales-territoriales' },
              },
              {
                id: 'protected/apply/$id/child/children/$childId/parent-or-guardian',
                file: 'routes/protected/apply/$id/child/children/$childId/parent-or-guardian.tsx',
                paths: { en: '/:lang/protected/apply/:id/child/children/:childId/parent-or-guardian', fr: '/:lang/protege/demander/:id/enfant/enfants/:childId/parent-ou-tuteur' },
              },
              {
                id: 'protected/apply/$id/child/children/$childId/cannot-apply-child',
                file: 'routes/protected/apply/$id/child/children/$childId/cannot-apply-child.tsx',
                paths: { en: '/:lang/protected/apply/:id/child/children/:childId/cannot-apply-child', fr: '/:lang/protege/demander/:id/enfant/enfants/:childId/pas-demande-enfant' },
              },
            ],
          },
          {
            id: 'protected/apply/$id/child/applicant-information',
            file: 'routes/protected/apply/$id/child/applicant-information.tsx',
            paths: { en: '/:lang/protected/apply/:id/child/applicant-information', fr: '/:lang/protege/demander/:id/enfant/renseignements-demandeur' },
          },
          {
            id: 'protected/apply/$id/child/new-or-existing-member',
            file: 'routes/protected/apply/$id/child/new-or-existing-member.tsx',
            paths: { en: '/:lang/protected/apply/:id/child/new-or-existing-member', fr: '/:lang/protege/demander/:id/enfant/membre-nouveau-ou-actuel' },
          },
          { id: 'protected/apply/$id/child/marital-status', file: 'routes/protected/apply/$id/child/marital-status.tsx', paths: { en: '/:lang/protected/apply/:id/child/marital-status', fr: '/:lang/protege/demander/:id/enfant/etat-civil' } },
          { id: 'protected/apply/$id/child/phone-number', file: 'routes/protected/apply/$id/child/phone-number.tsx', paths: { en: '/:lang/protected/apply/:id/child/phone-number', fr: '/:lang/protege/demander/:id/enfant/numero-telephone' } },
          { id: 'protected/apply/$id/child/verify-email', file: 'routes/protected/apply/$id/child/verify-email.tsx', paths: { en: '/:lang/protected/apply/:id/child/verify-email', fr: '/:lang/protege/demander/:id/enfant/verifier-courriel' } },
          { id: 'protected/apply/$id/child/email', file: 'routes/protected/apply/$id/child/email.tsx', paths: { en: '/:lang/protected/apply/:id/child/email', fr: '/:lang/protege/demander/:id/enfant/adresse-courriel' } },
          {
            id: 'protected/apply/$id/child/communication-preference',
            file: 'routes/protected/apply/$id/child/communication-preference.tsx',
            paths: { en: '/:lang/protected/apply/:id/child/communication-preference', fr: '/:lang/protege/demander/:id/child/preference-communication' },
          },
          { id: 'protected/apply/$id/child/mailing-address', file: 'routes/protected/apply/$id/child/mailing-address.tsx', paths: { en: '/:lang/protected/apply/:id/child/mailing-address', fr: '/:lang/protege/demander/:id/enfant/adresse-postale' } },
          { id: 'protected/apply/$id/child/home-address', file: 'routes/protected/apply/$id/child/home-address.tsx', paths: { en: '/:lang/protected/apply/:id/child/home-address', fr: '/:lang/protege/demander/:id/enfant/adresse-domicile' } },
          { id: 'protected/apply/$id/child/confirmation', file: 'routes/protected/apply/$id/child/confirmation.tsx', paths: { en: '/:lang/protected/apply/:id/child/confirmation', fr: '/:lang/protege/demander/:id/enfant/confirmation' } },
          {
            id: 'protected/apply/$id/child/contact-apply-child',
            file: 'routes/protected/apply/$id/child/contact-apply-child.tsx',
            paths: { en: '/:lang/protected/apply/:id/child/contact-apply-child', fr: '/:lang/protege/demander/:id/enfant/contact-demande-enfant' },
          },
          { id: 'protected/apply/$id/child/exit-application', file: 'routes/protected/apply/$id/child/exit-application.tsx', paths: { en: '/:lang/protected/apply/:id/child/exit-application', fr: '/:lang/protege/demander/:id/enfant/quitter-demande' } },
          {
            id: 'protected/apply/$id/child/review-adult-information',
            file: 'routes/protected/apply/$id/child/review-adult-information.tsx',
            paths: { en: '/:lang/protected/apply/:id/child/review-adult-information', fr: '/:lang/protege/demander/:id/enfant/revue-renseignements-adulte' },
          },
          {
            id: 'protected/apply/$id/child/review-child-information',
            file: 'routes/protected/apply/$id/child/review-child-information.tsx',
            paths: { en: '/:lang/protected/apply/:id/child/review-child-information', fr: '/:lang/protege/demander/:id/enfant/revue-enfant-renseignements' },
          },
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
          {
            id: 'protected/renew/$id/verify-email',
            file: 'routes/protected/renew/$id/verify-email.tsx',
            paths: { en: '/:lang/protected/renew/:id/verify-email', fr: '/:lang/protege/renouveler/:id/verifier-courriel' },
          },
          {
            id: 'protected/renew/$id/communication-preference',
            file: 'routes/protected/renew/$id/communication-preference.tsx',
            paths: { en: '/:lang/protected/renew/:id/communication-preference', fr: '/:lang/protege/renouveler/:id/preference-communication' },
          },
        ],
      },
    ],
  },
] as const satisfies I18nRoute[];
