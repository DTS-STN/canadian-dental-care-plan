import { randomString } from 'moderndash';

/**
 * @typedef {import('@remix-run/dev').AppConfig} AppConfig
 * @typedef {import('@remix-run/dev/dist/config/routes').DefineRouteFunction} DefineRouteFunction
 * @typedef {import('@remix-run/dev/dist/config/routes').DefineRouteOptions} DefineRouteOptions
 * @typedef {() => void} DefineRouteChildren
 */

/**
 * A (curryable) function that returns another function that can register multiple
 * paths for the same target file by supplying a randomly generated route id.
 *
 * @param {DefineRouteFunction} routeFn
 */
function multiRoute(routeFn) {
  /**
   * @param {Array<string>} paths The path this route uses to match the URL pathname.
   * @param {string} file The path to the file that exports the React component rendered by this route as its default export, relative to the `app` directory.
   * @param {DefineRouteOptions | DefineRouteChildren} optionsOrChildren Options for defining routes, or a function for defining child routes.
   * @param {DefineRouteChildren} childrenFn A function for defining child routes.
   */
  return (paths, file, optionsOrChildren = {}, childrenFn = () => {}) => {
    const children = typeof optionsOrChildren === 'function' ? optionsOrChildren : childrenFn;
    const options = typeof optionsOrChildren !== 'function' ? optionsOrChildren : {};
    paths.forEach((path) => routeFn(path, file, { id: createRouteId(`${path}-${randomString(4)}`), ...options }, children));
  };
}

/**
 * @type {AppConfig}
 */
export default {
  cacheDirectory: './node_modules/.cache/remix',
  ignoredRouteFiles: ['**/*'], // we will manually configure routes (see below)
  serverDependenciesToBundle: ['react-idle-timer'],

  routes: function (defineRoutes) {
    return defineRoutes((route) => {
      const biRoute = multiRoute(route);

      // the index route; accessible via a request to /
      route('/', 'routes/index.tsx', { index: true });

      // API routes; accessible via requests to /api/**
      route('api/readyz', 'routes/api+/readyz.ts');
      route('api/refresh-session', 'routes/api+/refresh-session.ts');

      // miscellaneous routes
      route('auth/*', 'routes/auth+/$.tsx');
      route('.well-known/jwks.json', 'routes/[.]well-known.jwks[.]json.tsx');

      // language-aware routes; accessible via requests to /en/** or /fr/**
      route(':lang', 'routes/$lang+/_route.tsx', () => {
        // 404 error route; accessible via requests to /en/foo or /fr/foo
        route('*', 'routes/$lang+/$.tsx');

        // public routes
        route('', 'routes/$lang+/_public+/_route.tsx', () => {
          // public application form; accessible via requests to /en/public/apply/** or /fr/public/apply/**
          biRoute(['apply', 'appliquer'], 'routes/$lang+/_public+/apply+/_route.tsx', () => {
            biRoute([''], 'routes/$lang+/_public+/apply+/index.tsx', { index: true });
            biRoute([':id'], 'routes/$lang+/_public+/apply+/$id+/_route.tsx', () => {
              biRoute(['applicant-information', 'renseignements-demandeur'], 'routes/$lang+/_public+/apply+/$id+/applicant-information.tsx');
              biRoute(['application-delegate', 'delegue-demande'], 'routes/$lang+/_public+/apply+/$id+/application-delegate.tsx');
              biRoute(['communication-preference', 'preference-communication'], 'routes/$lang+/_public+/apply+/$id+/communication-preference.tsx');
              biRoute(['confirmation', 'confirmation'], 'routes/$lang+/_public+/apply+/$id+/confirmation.tsx');
              biRoute(['date-of-birth', 'date-de-naissance'], 'routes/$lang+/_public+/apply+/$id+/date-of-birth.tsx');
              biRoute(['dental-insurance', 'assurance-dentaire'], 'routes/$lang+/_public+/apply+/$id+/dental-insurance.tsx');
              biRoute(['dob-eligibility', 'ddn-admissibilite'], 'routes/$lang+/_public+/apply+/$id+/dob-eligibility.tsx');
              biRoute(['exit-application', 'quitter-demande'], 'routes/$lang+/_public+/apply+/$id+/exit-application.tsx');
              biRoute(['federal-provincial-territorial-benefits', 'prestations-dentaires-federales-provinciales-territoriales'], 'routes/$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits.tsx');
              biRoute(['file-taxes', 'produire-declaration-revenus'], 'routes/$lang+/_public+/apply+/$id+/file-taxes.tsx');
              biRoute(['partner-information', 'renseignements-partenaire'], 'routes/$lang+/_public+/apply+/$id+/partner-information.tsx');
              biRoute(['personal-information', 'renseignements-personnels'], 'routes/$lang+/_public+/apply+/$id+/personal-information.tsx');
              biRoute(['review-information', 'revue-renseignements'], 'routes/$lang+/_public+/apply+/$id+/review-information.tsx');
              biRoute(['tax-filing', 'declaration-impot'], 'routes/$lang+/_public+/apply+/$id+/tax-filing.tsx');
              biRoute(['terms-and-conditions', 'conditions-utilisation'], 'routes/$lang+/_public+/apply+/$id+/terms-and-conditions.tsx');
              biRoute(['type-application', 'type-demande'], 'routes/$lang+/_public+/apply+/$id+/type-application.tsx');
            });
          });
          // public status checker; accessible via requests to /en/public/status/** or /fr/public/status/**
          biRoute(['status', 'statut'], 'routes/$lang+/_public+/status+/index.tsx', { index: true });
        });

        // protected routes
        route('', 'routes/$lang+/_protected+/_route.tsx', () => {
          biRoute(['data-unavailable', 'donnees-indisponibles'], 'routes/$lang+/_protected+/data-unavailable.tsx');
          biRoute(['home', 'accueil'], 'routes/$lang+/_protected+/home.tsx');
          biRoute(['letters', 'lettres'], 'routes/$lang+/_protected+/letters+/_route.tsx', () => {
            biRoute([''], 'routes/$lang+/_protected+/letters+/index.tsx', { index: true });
            biRoute([':id/download', ':id/telecharger'], 'routes/$lang+/_protected+/letters+/$id.download.tsx');
          });
          biRoute(['personal-information', 'informations-personnelles'], 'routes/$lang+/_protected+/personal-information+/_route.tsx', () => {
            biRoute([''], 'routes/$lang+/_protected+/personal-information+/index.tsx', { index: true });
            biRoute(['home-address', 'adresse-domicile'], 'routes/$lang+/_protected+/personal-information+/home-address+/_route.tsx', () => {
              biRoute(['address-accuracy', 'precision-adresse'], 'routes/$lang+/_protected+/personal-information+/home-address+/address-accuracy.tsx');
              biRoute(['edit', 'modifier'], 'routes/$lang+/_protected+/personal-information+/home-address+/edit.tsx');
              biRoute(['suggested', 'suggere'], 'routes/$lang+/_protected+/personal-information+/home-address+/suggested.tsx');
            });
            biRoute(['mailing-address', 'adresse-postale'], 'routes/$lang+/_protected+/personal-information+/mailing-address+/_route.tsx', () => {
              biRoute(['address-accuracy', 'precision-adresse'], 'routes/$lang+/_protected+/personal-information+/mailing-address+/address-accuracy.tsx');
              biRoute(['confirm', 'confirmer'], 'routes/$lang+/_protected+/personal-information+/mailing-address+/confirm.tsx');
              biRoute(['edit', 'modifier'], 'routes/$lang+/_protected+/personal-information+/mailing-address+/edit.tsx');
            });
            biRoute(['phone-number', 'numero-telephone'], 'routes/$lang+/_protected+/personal-information+/phone-number+/_route.tsx', () => {
              biRoute(['confirm', 'confirmer'], 'routes/$lang+/_protected+/personal-information+/phone-number+/confirm.tsx');
              biRoute(['edit', 'modifier'], 'routes/$lang+/_protected+/personal-information+/phone-number+/edit.tsx');
            });
            biRoute(['preferred-language', 'langue-preferee'], 'routes/$lang+/_protected+/personal-information+/preferred-language+/_route.tsx', () => {
              biRoute(['confirm', 'confirmer'], 'routes/$lang+/_protected+/personal-information+/preferred-language+/confirm.tsx');
              biRoute(['edit', 'modifier'], 'routes/$lang+/_protected+/personal-information+/preferred-language+/edit.tsx');
            });
          });
          biRoute(['stub-sin-editor'], 'routes/$lang+/_protected+/stub-sin-editor.tsx');
        });
      });
    });
  },
};

/**
 * Replace all instances of :param with $param.
 *
 * @param {string} path
 */
function createRouteId(path) {
  return path.replace(/:(.+)/g, '$$$1');
}
