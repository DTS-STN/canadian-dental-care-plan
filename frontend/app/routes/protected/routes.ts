import type { I18nRoute } from '~/routes/routes';

export const routes = [
  {
    file: 'routes/protected/layout.tsx',
    children: [
      {
        file: 'routes/protected/application/layout.tsx',
        children: [
          {
            id: 'protected/application/index',
            file: 'routes/protected/application/index.tsx',
            paths: { en: '/:lang/protected/application', fr: '/:lang/protected/demande' },
          },
          {
            id: 'protected/application/$id/eligibility-requirements',
            file: 'routes/protected/application/entry/eligibility-requirements.tsx',
            paths: { en: '/:lang/protected/application/:id/eligibility-requirements', fr: '/:lang/protected/demande/:id/criteres-admissibilite' },
          },
          {
            id: 'protected/application/$id/type-of-application',
            file: 'routes/protected/application/entry/type-application.tsx',
            paths: { en: '/:lang/protected/application/:id/type-of-application', fr: '/:lang/protected/demande/:id/type-de-demande' },
          },
          // spokes
          {
            id: 'protected/application/$id/application-delegate',
            file: 'routes/protected/application/spokes/application-delegate.tsx',
            paths: { en: '/:lang/protected/application/:id/application-delegate', fr: '/:lang/protected/demande/:id/delegue-demande' },
          },
          { id: 'protected/application/$id/file-taxes', file: 'routes/protected/application/spokes/file-taxes.tsx', paths: { en: '/:lang/protected/application/:id/file-taxes', fr: '/:lang/protected/demande/:id/produire-declaration-revenus' } },
          { id: 'protected/application/$id/marital-status', file: 'routes/protected/application/spokes/marital-status.tsx', paths: { en: '/:lang/protected/application/:id/marital-status', fr: '/:lang/protected/demande/:id/etat-civil' } },
          { id: 'protected/application/$id/dental-insurance', file: 'routes/protected/application/spokes/dental-insurance.tsx', paths: { en: '/:lang/protected/application/:id/dental-insurance', fr: '/:lang/protected/demande/:id/assurance-dentaire' } },
          {
            id: 'protected/application/$id/dental-insurance-exit-application',
            file: 'routes/protected/application/spokes/dental-insurance-exit-application.tsx',
            paths: { en: '/:lang/protected/application/:id/dental-insurance-exit-application', fr: '/:lang/protected/demande/:id/quitter-demande-assurance-dentaire' },
          },
          { id: 'protected/application/$id/tax-filing', file: 'routes/protected/application/spokes/tax-filing.tsx', paths: { en: '/:lang/protected/application/:id/tax-filing', fr: '/:lang/protected/demande/:id/declaration-impot' } },
          { id: 'protected/application/$id/renewal-selection', file: 'routes/protected/application/spokes/renewal-selection.tsx', paths: { en: '/:lang/protected/application/:id/renewal-selection', fr: '/:lang/protected/demande/:id/renewal-selection' } },
          { id: 'protected/application/$id/terms-conditions', file: 'routes/protected/application/spokes/terms-conditions.tsx', paths: { en: '/:lang/protected/application/:id/terms-conditions', fr: '/:lang/protected/demande/:id/conditions-utilisation' } },
          { id: 'protected/application/$id/type-application', file: 'routes/protected/application/spokes/type-application.tsx', paths: { en: '/:lang/protected/application/:id/type-application', fr: '/:lang/protected/demande/:id/type-demande' } },
          {
            id: 'protected/application/$id/personal-information',
            file: 'routes/protected/application/spokes/personal-information.tsx',
            paths: { en: '/:lang/protected/application/:id/personal-information', fr: '/:lang/protected/demande/:id/renseignements-personnels' },
          },
          {
            id: 'protected/application/$id/federal-provincial-territorial-benefits',
            file: 'routes/protected/application/spokes/federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/application/:id/federal-provincial-territorial-benefits', fr: '/:lang/protected/demande/:id/prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'protected/application/$id/living-independently',
            file: 'routes/protected/application/spokes/living-independently.tsx',
            paths: { en: '/:lang/protected/application/:id/living-independently', fr: '/:lang/protected/demande/:id/vivre-maniere-independante' },
          },
          { id: 'protected/application/$id/parent-or-guardian', file: 'routes/protected/application/spokes/parent-or-guardian.tsx', paths: { en: '/:lang/protected/application/:id/parent-or-guardian', fr: '/:lang/protected/demande/:id/parent-ou-tuteur' } },
          { id: 'protected/application/$id/phone-number', file: 'routes/protected/application/spokes/phone-number.tsx', paths: { en: '/:lang/protected/application/:id/phone-number', fr: '/:lang/protected/demande/:id/numero-telephone' } },
          { id: 'protected/application/$id/mailing-address', file: 'routes/protected/application/spokes/mailing-address.tsx', paths: { en: '/:lang/protected/application/:id/mailing-address', fr: '/:lang/protected/demande/:id/adresse-postale' } },
          { id: 'protected/application/$id/home-address', file: 'routes/protected/application/spokes/home-address.tsx', paths: { en: '/:lang/protected/application/:id/home-address', fr: '/:lang/protected/demande/:id/adresse-domicile' } },
          {
            id: 'protected/application/$id/communication-preferences',
            file: 'routes/protected/application/spokes/communication-preferences.tsx',
            paths: { en: '/:lang/protected/application/:id/communication-preferences', fr: '/:lang/protected/demande/:id/preference-communication' },
          },
          { id: 'protected/application/$id/email', file: 'routes/protected/application/spokes/email.tsx', paths: { en: '/:lang/protected/application/:id/email', fr: '/:lang/protected/demande/:id/adresse-courriel' } },
          { id: 'protected/application/$id/verify-email', file: 'routes/protected/application/spokes/verify-email.tsx', paths: { en: '/:lang/protected/application/:id/verify-email', fr: '/:lang/protected/demande/:id/verifier-courriel' } },
          {
            id: 'protected/application/$id/children/$childId/information',
            file: 'routes/protected/application/spokes/child-information.tsx',
            paths: { en: '/:lang/protected/application/:id/children/:childId/information', fr: '/:lang/protected/demande/:id/enfant/:childId/information' },
          },
          {
            id: 'protected/application/$id/children/$childId/parent-or-guardian',
            file: 'routes/protected/application/spokes/child-parent-guardian.tsx',
            paths: { en: '/:lang/protected/application/:id/children/:childId/parent-or-guardian', fr: '/:lang/protected/demande/:id/enfant/:childId/parent-ou-tuteur' },
          },
          {
            id: 'protected/application/$id/children/$childId/cannot-apply-child',
            file: 'routes/protected/application/spokes/cannot-apply-child.tsx',
            paths: { en: '/:lang/protected/application/:id/children/:childId/cannot-apply-child', fr: '/:lang/protected/demande/:id/enfant/:childId/pas-demande-enfant' },
          },
          {
            id: 'protected/application/$id/children/$childId/federal-provincial-territorial-benefits',
            file: 'routes/protected/application/spokes/child-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/protected/application/:id/children/:childId/federal-provincial-territorial-benefits', fr: '/:lang/protected/demande/:id/enfant/:childId/prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'protected/application/$id/children/$childId/dental-insurance',
            file: 'routes/protected/application/spokes/child-dental-insurance.tsx',
            paths: { en: '/:lang/protected/application/:id/children/:childId/dental-insurance', fr: '/:lang/protected/demande/:id/enfant/:childId/assurance-dentaire' },
          },
        ],
      },

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
        paths: { en: '/:lang/protected/profile/applicant', fr: '/:lang/protege/profil/demandeur' },
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
        paths: { en: '/:lang/protected/profile/communication-preferences/edit', fr: '/:lang/protege/profil/preferences-communication/modifier' },
      },
      {
        id: 'protected/profile/contact/phone',
        file: 'routes/protected/profile/phone-number.tsx',
        paths: { en: '/:lang/protected/profile/contact/phone', fr: '/:lang/protege/profil/coordonnees/telephone' },
      },
      {
        id: 'protected/profile/contact-information',
        file: 'routes/protected/profile/contact-information.tsx',
        paths: { en: '/:lang/protected/profile/contact', fr: '/:lang/protege/profil/coordonnees' },
      },
      {
        id: 'protected/profile/contact/email-address',
        file: 'routes/protected/profile/email.tsx',
        paths: { en: '/:lang/protected/profile/contact/email-address', fr: '/:lang/protege/profil/coordonnees/adresse-courriel' },
      },
      {
        id: 'protected/profile/contact/email-address/verify',
        file: 'routes/protected/profile/verify-email.tsx',
        paths: { en: '/:lang/protected/profile/contact/email-address/verify', fr: '/:lang/protege/profil/coordonnees/adresse-courriel/verifier' },
      },
      {
        id: 'protected/profile/contact/mailing-address',
        file: 'routes/protected/profile/mailing-address.tsx',
        paths: { en: '/:lang/protected/profile/contact/mailing-address', fr: '/:lang/protege/profil/coordonnees/adresse-postale' },
      },
      {
        id: 'protected/profile/contact/home-address',
        file: 'routes/protected/profile/home-address.tsx',
        paths: { en: '/:lang/protected/profile/contact/home-address', fr: '/:lang/protege/profil/coordonnees/adresse-domicile' },
      },
      {
        file: 'routes/protected/apply/layout.tsx',
        children: [
          { id: 'protected/apply/index', file: 'routes/protected/apply/index.tsx', paths: { en: '/:lang/protected/apply', fr: '/:lang/protege/demander' } },
          { id: 'protected/apply/$id/index', file: 'routes/protected/apply/$id/index.tsx', paths: { en: '/:lang/protected/apply/:id', fr: '/:lang/protege/demander/:id' } },
          { id: 'protected/apply/$id/terms-and-conditions', file: 'routes/protected/apply/$id/terms-and-conditions.tsx', paths: { en: '/:lang/protected/apply/:id/terms-and-conditions', fr: '/:lang/protege/demander/:id/conditions-utilisation' } },
          { id: 'protected/apply/$id/new-or-returning', file: 'routes/protected/apply/$id/new-or-returning.tsx', paths: { en: '/:lang/protected/apply/:id/new-or-returning', fr: '/:lang/protege/demander/:id/nouveau-ou-existant' } },
          { id: 'protected/apply/$id/renewal-soon', file: 'routes/protected/apply/$id/renewal-soon.tsx', paths: { en: '/:lang/protected/apply/:id/renewal-soon', fr: '/:lang/protege/demander/:id/renouvellement-sous-peu' } },
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
