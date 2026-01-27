import type { I18nRoute } from '~/routes/routes';

export const routes = [
  {
    file: 'routes/public/layout.tsx',
    children: [
      {
        file: 'routes/public/application/layout.tsx',
        children: [
          {
            id: 'public/application/index',
            file: 'routes/public/application/index.tsx',
            paths: { en: '/:lang/application', fr: '/:lang/demande' },
          },
          {
            id: 'public/application/$id/eligibility-requirements',
            file: 'routes/public/application/entry/eligibility-requirements.tsx',
            paths: { en: '/:lang/application/:id/eligibility-requirements', fr: '/:lang/demande/:id/criteres-admissibilite' },
          },
          {
            id: 'public/application/$id/type-of-application',
            file: 'routes/public/application/entry/type-application.tsx',
            paths: { en: '/:lang/application/:id/type-of-application', fr: '/:lang/demande/:id/type-of-application' },
          },
          {
            id: 'public/application/$id/full-adult/marital-status',
            file: 'routes/public/application/full-adult/marital-status.tsx',
            paths: { en: '/:lang/application/:id/full/adult/marital-status', fr: '/:lang/demande/:id/complete/adulte/etat-civil' },
          },
          {
            id: 'public/application/$id/full-adult/dental-insurance',
            file: 'routes/public/application/full-adult/dental-insurance.tsx',
            paths: { en: '/:lang/application/:id/full/adult/dental-insurance', fr: '/:lang/demande/:id/complete/adulte/assurance-dentaire' },
          },
          {
            id: 'public/application/$id/full-adult/contact-information',
            file: 'routes/public/application/full-adult/contact-information.tsx',
            paths: { en: '/:lang/application/:id/full/adult/contact-information', fr: '/:lang/demande/:id/complete/adulte/coordonnees' },
          },
          {
            id: 'public/application/$id/full-adult/submit',
            file: 'routes/public/application/full-adult/submit.tsx',
            paths: { en: '/:lang/application/:id/full/adult/submit', fr: '/:lang/demande/:id/complete/adulte/submit' },
          },
          {
            id: 'public/application/$id/full-adult/exit-application',
            file: 'routes/public/application/full-adult/exit-application.tsx',
            paths: { en: '/:lang/application/:id/full/adult/exit-application', fr: '/:lang/demande/:id/complete/adulte/quitter-demande' },
          },
          {
            id: 'public/application/$id/full-adult/confirmation',
            file: 'routes/public/application/full-adult/confirmation.tsx',
            paths: { en: '/:lang/application/:id/full/adult/confirmation', fr: '/:lang/demande/:id/complete/adulte/confirmation' },
          },

          {
            id: 'public/application/$id/full-children/parent-or-guardian',
            file: 'routes/public/application/full-children/parent-or-guardian.tsx',
            paths: { en: '/:lang/application/:id/full/children/parent-or-guardian', fr: '/:lang/demande/:id/complete/enfants/parent-ou-tuteur' },
          },
          {
            id: 'public/application/$id/full-children/submit',
            file: 'routes/public/application/full-children/submit.tsx',
            paths: { en: '/:lang/application/:id/full/children/submit', fr: '/:lang/demande/:id/complete/enfants/submit' },
          },
          {
            id: 'public/application/$id/full-children/exit-application',
            file: 'routes/public/application/full-children/exit-application.tsx',
            paths: { en: '/:lang/application/:id/full/children/exit-application', fr: '/:lang/demande/:id/complete/enfants/quitter-demande' },
          },
          {
            id: 'public/application/$id/full-children/confirmation',
            file: 'routes/public/application/full-children/confirmation.tsx',
            paths: { en: '/:lang/application/:id/full/children/confirmation', fr: '/:lang/demande/:id/complete/enfants/confirmation' },
          },
          {
            id: 'public/application/$id/full-children/childrens-application',
            file: 'routes/public/application/full-children/childrens-application.tsx',
            paths: { en: '/:lang/application/:id/full/children/childrens-application', fr: '/:lang/demande/:id/complete/enfants/application-enfants' },
          },
          {
            id: 'public/application/$id/full-family/marital-status',
            file: 'routes/public/application/full-family/marital-status.tsx',
            paths: { en: '/:lang/application/:id/full/family/marital-status', fr: '/:lang/demande/:id/complete/famille/etat-civil' },
          },
          {
            id: 'public/application/$id/full-family/contact-information',
            file: 'routes/public/application/full-family/contact-information.tsx',
            paths: { en: '/:lang/application/:id/full/family/contact-information', fr: '/:lang/demande/:id/complete/famille/coordonnees' },
          },
          {
            id: 'public/application/$id/full-family/dental-insurance',
            file: 'routes/public/application/full-family/dental-insurance.tsx',
            paths: { en: '/:lang/application/:id/full/family/dental-insurance', fr: '/:lang/demande/:id/complete/famille/assurance-dentaire' },
          },
          {
            id: 'public/application/$id/full-family/childrens-application',
            file: 'routes/public/application/full-family/childrens-application.tsx',
            paths: { en: '/:lang/application/:id/full/family/childrens-application', fr: '/:lang/demande/:id/complete/famille/application-enfants' },
          },
          {
            id: 'public/application/$id/full-family/confirmation',
            file: 'routes/public/application/full-family/confirmation.tsx',
            paths: { en: '/:lang/application/:id/full/family/confirmation', fr: '/:lang/demande/:id/complete/famille/confirmation' },
          },
          {
            id: 'public/application/$id/full-family/submit',
            file: 'routes/public/application/full-family/submit.tsx',
            paths: { en: '/:lang/application/:id/full/family/submit', fr: '/:lang/demande/:id/complete/famille/submit' },
          },
          {
            id: 'public/application/$id/full-family/exit-application',
            file: 'routes/public/application/full-family/exit-application.tsx',
            paths: { en: '/:lang/application/:id/full/family/exit-application', fr: '/:lang/demande/:id/complete/famille/quitter-demande' },
          },
          {
            id: 'public/application/$id/simplified-adult/contact-information',
            file: 'routes/public/application/simplified-adult/contact-information.tsx',
            paths: { en: '/:lang/application/:id/simplified/adult/contact-information', fr: '/:lang/demande/:id/simplifie/adulte/coordonnees' },
          },
          {
            id: 'public/application/$id/simplified-adult/dental-insurance',
            file: 'routes/public/application/simplified-adult/dental-insurance.tsx',
            paths: { en: '/:lang/application/:id/simplified/adult/dental-insurance', fr: '/:lang/demande/:id/simplifie/adulte/assurance-dentaire' },
          },
          {
            id: 'public/application/$id/simplified-adult/submit',
            file: 'routes/public/application/simplified-adult/submit.tsx',
            paths: { en: '/:lang/application/:id/simplified/adult/submit', fr: '/:lang/demande/:id/simplifie/adulte/submit' },
          },
          {
            id: 'public/application/$id/simplified-adult/confirmation',
            file: 'routes/public/application/simplified-adult/confirmation.tsx',
            paths: { en: '/:lang/application/:id/simplified/adult/confirmation', fr: '/:lang/demande/:id/simplifie/adulte/confirmation' },
          },
          {
            id: 'public/application/$id/simplified-adult/exit-application',
            file: 'routes/public/application/simplified-adult/exit-application.tsx',
            paths: { en: '/:lang/application/:id/simplified/adult/exit-application', fr: '/:lang/demande/:id/simplifie/adulte/quitter-demande' },
          },
          {
            id: 'public/application/$id/simplified-children/parent-or-guardian',
            file: 'routes/public/application/simplified-children/parent-or-guardian.tsx',
            paths: { en: '/:lang/application/:id/simplified/children/parent-or-guardian', fr: '/:lang/demande/:id/simplifie/enfants/parent-ou-tuteur' },
          },
          {
            id: 'public/application/$id/simplified-children/submit',
            file: 'routes/public/application/simplified-children/submit.tsx',
            paths: { en: '/:lang/application/:id/simplified/children/submit', fr: '/:lang/demande/:id/simplifie/enfants/submit' },
          },
          {
            id: 'public/application/$id/simplified-children/exit-application',
            file: 'routes/public/application/simplified-children/exit-application.tsx',
            paths: { en: '/:lang/application/:id/simplified/children/exit-application', fr: '/:lang/demande/:id/simplifie/enfants/quitter-demande' },
          },
          {
            id: 'public/application/$id/simplified-children/childrens-application',
            file: 'routes/public/application/simplified-children/childrens-application.tsx',
            paths: { en: '/:lang/application/:id/simplified/children/childrens-application', fr: '/:lang/demande/:id/simplifie/enfants/application-enfants' },
          },
          {
            id: 'public/application/$id/simplified-children/confirmation',
            file: 'routes/public/application/simplified-children/confirmation.tsx',
            paths: { en: '/:lang/application/:id/simplified/children/confirmation', fr: '/:lang/demande/:id/simplifie/enfants/confirmation' },
          },
          {
            id: 'public/application/$id/simplified-family/contact-information',
            file: 'routes/public/application/simplified-family/contact-information.tsx',
            paths: { en: '/:lang/application/:id/simplified/family/contact-information', fr: '/:lang/demande/:id/simplifie/famille/coordonnees' },
          },
          {
            id: 'public/application/$id/simplified-family/dental-insurance',
            file: 'routes/public/application/simplified-family/dental-insurance.tsx',
            paths: { en: '/:lang/application/:id/simplified/family/dental-insurance', fr: '/:lang/demande/:id/simplifie/famille/assurance-dentaire' },
          },
          {
            id: 'public/application/$id/simplified-family/childrens-application',
            file: 'routes/public/application/simplified-family/childrens-application.tsx',
            paths: { en: '/:lang/application/:id/simplified/family/childrens-application', fr: '/:lang/demande/:id/simplifie/famille/application-enfants' },
          },
          {
            id: 'public/application/$id/simplified-family/submit',
            file: 'routes/public/application/simplified-family/submit.tsx',
            paths: { en: '/:lang/application/:id/simplified/family/submit', fr: '/:lang/demande/:id/simplifie/famille/submit' },
          },
          {
            id: 'public/application/$id/simplified-family/confirmation',
            file: 'routes/public/application/simplified-family/confirmation.tsx',
            paths: { en: '/:lang/application/:id/simplified/family/confirmation', fr: '/:lang/demande/:id/simplifie/famille/confirmation' },
          },
          {
            id: 'public/application/$id/simplified-family/exit-application',
            file: 'routes/public/application/simplified-family/exit-application.tsx',
            paths: { en: '/:lang/application/:id/simplified/family/exit-application', fr: '/:lang/demande/:id/simplifie/famille/quitter-demande' },
          },

          // spokes
          { id: 'public/application/$id/application-delegate', file: 'routes/public/application/spokes/application-delegate.tsx', paths: { en: '/:lang/application/:id/application-delegate', fr: '/:lang/demander/:id/delegue-demande' } },
          { id: 'public/application/$id/file-taxes', file: 'routes/public/application/spokes/file-taxes.tsx', paths: { en: '/:lang/application/:id/file-taxes', fr: '/:lang/demande/:id/produire-declaration-revenus' } },
          { id: 'public/application/$id/marital-status', file: 'routes/public/application/spokes/marital-status.tsx', paths: { en: '/:lang/application/:id/marital-status', fr: '/:lang/demander/:id/etat-civil' } },
          { id: 'public/application/$id/dental-insurance', file: 'routes/public/application/spokes/dental-insurance.tsx', paths: { en: '/:lang/application/:id/dental-insurance', fr: '/:lang/demander/:id/assurance-dentaire' } },
          {
            id: 'public/application/$id/dental-insurance-exit-application',
            file: 'routes/public/application/spokes/dental-insurance-exit-application.tsx',
            paths: { en: '/:lang/application/:id/dental-insurance-exit-application', fr: '/:lang/demander/:id/quitter-demande-assurance-dentaire' },
          },
          { id: 'public/application/$id/tax-filing', file: 'routes/public/application/spokes/tax-filing.tsx', paths: { en: '/:lang/application/:id/tax-filing', fr: '/:lang/demande/:id/declaration-impot' } },
          { id: 'public/application/$id/terms-conditions', file: 'routes/public/application/spokes/terms-conditions.tsx', paths: { en: '/:lang/application/:id/terms-conditions', fr: '/:lang/demander/:id/conditions-utilisation' } },
          { id: 'public/application/$id/type-application', file: 'routes/public/application/spokes/type-application.tsx', paths: { en: '/:lang/application/:id/type-application', fr: '/:lang/demander/:id/type-demande' } },
          { id: 'public/application/$id/personal-information', file: 'routes/public/application/spokes/personal-information.tsx', paths: { en: '/:lang/application/:id/personal-information', fr: '/:lang/demander/:id/renseignements-personnels' } },
          {
            id: 'public/application/$id/federal-provincial-territorial-benefits',
            file: 'routes/public/application/spokes/federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/application/:id/federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/prestations-dentaires-federales-provinciales-territoriales' },
          },
          { id: 'public/application/$id/living-independently', file: 'routes/public/application/spokes/living-independently.tsx', paths: { en: '/:lang/application/:id/living-independently', fr: '/:lang/demander/:id/vivre-maniere-independante' } },
          { id: 'public/application/$id/parent-or-guardian', file: 'routes/public/application/spokes/parent-or-guardian.tsx', paths: { en: '/:lang/application/:id/parent-or-guardian', fr: '/:lang/demander/:id/parent-ou-tuteur' } },
          { id: 'public/application/$id/phone-number', file: 'routes/public/application/spokes/phone-number.tsx', paths: { en: '/:lang/application/:id/phone-number', fr: '/:lang/demander/:id/numero-telephone' } },
          { id: 'public/application/$id/mailing-address', file: 'routes/public/application/spokes/mailing-address.tsx', paths: { en: '/:lang/application/:id/mailing-address', fr: '/:lang/demander/:id/adresse-postale' } },
          { id: 'public/application/$id/home-address', file: 'routes/public/application/spokes/home-address.tsx', paths: { en: '/:lang/application/:id/home-address', fr: '/:lang/demander/:id/adresse-domicile' } },
          {
            id: 'public/application/$id/communication-preferences',
            file: 'routes/public/application/spokes/communication-preferences.tsx',
            paths: { en: '/:lang/application/:id/communication-preferences', fr: '/:lang/demander/:id/preference-communication' },
          },
          { id: 'public/application/$id/email', file: 'routes/public/application/spokes/email.tsx', paths: { en: '/:lang/application/:id/email', fr: '/:lang/demander/:id/adresse-courriel' } },
          { id: 'public/application/$id/verify-email', file: 'routes/public/application/spokes/verify-email.tsx', paths: { en: '/:lang/application/:id/verify-email', fr: '/:lang/demander/:id/verifier-courriel' } },
          {
            id: 'public/application/$id/children/$childId/information',
            file: 'routes/public/application/spokes/child-information.tsx',
            paths: { en: '/:lang/application/:id/children/:childId/information', fr: '/:lang/demander/:id/enfant/:childId/information' },
          },
          {
            id: 'public/application/$id/children/$childId/parent-or-guardian',
            file: 'routes/public/application/spokes/child-parent-guardian.tsx',
            paths: { en: '/:lang/application/:id/children/:childId/parent-or-guardian', fr: '/:lang/demander/:id/enfant/:childId/parent-ou-tuteur' },
          },
          {
            id: 'public/application/$id/children/$childId/cannot-apply-child',
            file: 'routes/public/application/spokes/cannot-apply-child.tsx',
            paths: { en: '/:lang/application/:id/children/:childId/cannot-apply-child', fr: '/:lang/demander/:id/enfant/:childId/pas-demande-enfant' },
          },
          {
            id: 'public/application/$id/children/$childId/federal-provincial-territorial-benefits',
            file: 'routes/public/application/spokes/child-federal-provincial-territorial-benefits.tsx',
            paths: { en: '/:lang/application/:id/children/:childId/federal-provincial-territorial-benefits', fr: '/:lang/demander/:id/enfant/:childId/prestations-dentaires-federales-provinciales-territoriales' },
          },
          {
            id: 'public/application/$id/children/$childId/dental-insurance',
            file: 'routes/public/application/spokes/child-dental-insurance.tsx',
            paths: { en: '/:lang/application/:id/children/:childId/dental-insurance', fr: '/:lang/demander/:id/enfant/:childId/assurance-dentaire' },
          },
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
        id: 'public/unable-to-process-request',
        file: 'routes/public/unable-to-process-request.tsx',
        paths: { en: '/:lang/unable-to-process-request', fr: '/:lang/impossible-de-traiter-la-demande' },
      },
    ],
  },
] as const satisfies I18nRoute[];
