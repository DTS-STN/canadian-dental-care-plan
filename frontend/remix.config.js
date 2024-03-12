/**
 * @type {import('@remix-run/dev').AppConfig['routes']}
 * @see https://remix.run/docs/en/main/discussion/routes#manual-route-configuration
 */
const routesFn = (defineRoutes) => {
  return defineRoutes((route) => {
    //
    // API routes
    //
    route('/api/readyz', 'routes/api+/readyz.ts');
    route('/api/refresh-session', 'routes/_protected+/api+/refresh-session.ts');
    route('/api/switch-language', 'routes/api+/switch-language.ts');

    //
    // Auth routes
    //
    route('/.well-known/jwks.json', 'routes/[.]well-known.jwks[.]json.tsx');
    route('/auth/*', 'routes/_protected+/auth+/$.tsx');

    //
    // Unprotected routes
    //
    route('/', 'routes/_index.tsx', { index: true });
    route('/apply', 'routes/_public+/apply+/_layout.tsx', () => {
      route('', 'routes/_public+/apply+/_index.tsx', { index: true });
      route(':id', 'routes/_public+/apply+/$id+/_route.tsx', () => {
        route('applicant-information', 'routes/_public+/apply+/$id+/applicant-information.tsx');
        route('application-delegate', 'routes/_public+/apply+/$id+/application-delegate.tsx');
        route('communication-preference', 'routes/_public+/apply+/$id+/communication-preference.tsx');
        route('confirm', 'routes/_public+/apply+/$id+/confirm.tsx');
        route('date-of-birth', 'routes/_public+/apply+/$id+/date-of-birth.tsx');
        route('demographics-part1', 'routes/_public+/apply+/$id+/demographics-part1.tsx');
        route('demographics-part2', 'routes/_public+/apply+/$id+/demographics-part2.tsx');
        route('demographics', 'routes/_public+/apply+/$id+/demographics.tsx');
        route('dental-insurance', 'routes/_public+/apply+/$id+/dental-insurance.tsx');
        route('dob-eligibility', 'routes/_public+/apply+/$id+/dob-eligibility.tsx');
        route('federal-provincial-territorial-benefits', 'routes/_public+/apply+/$id+/federal-provincial-territorial-benefits.tsx');
        route('file-your-taxes', 'routes/_public+/apply+/$id+/file-your-taxes.tsx');
        route('partner-information', 'routes/_public+/apply+/$id+/partner-information.tsx');
        route('personal-information', 'routes/_public+/apply+/$id+/personal-information.tsx');
        route('review-information', 'routes/_public+/apply+/$id+/review-information.tsx');
        route('tax-filing', 'routes/_public+/apply+/$id+/tax-filing.tsx');
        route('terms-and-conditions', 'routes/_public+/apply+/$id+/terms-and-conditions.tsx');
        route('type-of-application', 'routes/_public+/apply+/$id+/type-of-application.tsx');
      });
    });

    //
    // Protected routes
    //
    route('', 'routes/_protected+/_layout.tsx', () => {
      route('/data-unavailable', 'routes/_protected+/data-unavailable.tsx');
      route('/error', 'routes/_protected+/error.tsx');
      route('/home', 'routes/_protected+/home.tsx');
      route('/letters/', 'routes/_protected+/letters+/_index.tsx', { index: true });
      route('/letters/:referenceId/download', 'routes/_protected+/letters+/$referenceId.download.tsx');
      route('/personal-information/', 'routes/_protected+/personal-information+/_index.tsx', { index: true });
      route('/personal-information/home-address/address-accuracy', 'routes/_protected+/personal-information+/home-address+/address-accuracy.tsx');
      route('/personal-information/home-address/confirm', 'routes/_protected+/personal-information+/home-address+/confirm.tsx');
      route('/personal-information/home-address/edit', 'routes/_protected+/personal-information+/home-address+/edit.tsx');
      route('/personal-information/home-address/suggested', 'routes/_protected+/personal-information+/home-address+/suggested.tsx');
      route('/personal-information/mailing-address/address-accuracy', 'routes/_protected+/personal-information+/mailing-address+/address-accuracy.tsx');
      route('/personal-information/mailing-address/confirm', 'routes/_protected+/personal-information+/mailing-address+/confirm.tsx');
      route('/personal-information/mailing-address/edit', 'routes/_protected+/personal-information+/mailing-address+/edit.tsx');
      route('/personal-information/phone-number/confirm', 'routes/_protected+/personal-information+/phone-number+/confirm.tsx');
      route('/personal-information/phone-number/edit', 'routes/_protected+/personal-information+/phone-number+/edit.tsx');
      route('/personal-information/preferred-language/confirm', 'routes/_protected+/personal-information+/preferred-language+/confirm.tsx');
      route('/personal-information/preferred-language/edit', 'routes/_protected+/personal-information+/preferred-language+/edit.tsx');
    });

    //
    // Catch-all 404 page
    //
    route('*', 'routes/$.tsx');
  });
};

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
  cacheDirectory: './node_modules/.cache/remix',
  routes: routesFn,
  serverDependenciesToBundle: ['react-idle-timer'],
};
