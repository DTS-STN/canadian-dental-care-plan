import { HttpResponse, http } from 'msw';

import openidConfiguration from '~/mocks/raoidc/responses/[.]well-known.openid-configuration.json';
import jwk from '~/mocks/raoidc/responses/jwk.json';

/**
 * MSW mocks for the RAOIDC authentication service.
 */
export const raoidc = [
  //
  // RAOIDC /.well-known/openid-configuration
  //
  http.get('https://auth.example.com/oauth/.well-known/openid-configuration', () => {
    return HttpResponse.json(openidConfiguration);
  }),

  //
  // RAOIDC /oauth/jwk
  //
  http.get('https://auth.example.com/oauth/jwk', () => {
    return HttpResponse.json(jwk);
  }),

  //
  // RAOIDC catchall (404 Not found)
  //
  http.all('https://auth.example.com/**', () => {
    return new HttpResponse(null, { status: 404 });
  }),
];
