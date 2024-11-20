import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ClientEnv as ClientEnvComponent } from '~/components/client-env';
import type { ClientEnv } from '~/utils/env-utils';

describe('<ClientEnv>', () => {
  it('should render the script tag with the correct innerHTML', () => {
    const nonce = 'https://open.spotify.com/artist/3BNDjSD67jJE4fhxX1b2OV?si=T1lAx_1fQe6axdydq43XEA';

    const env: ClientEnv = {
      ADOBE_ANALYTICS_JQUERY_SRC: 'https://example.com/jquery.min.js',
      ECAS_BASE_URI: 'https://srv136.services.gc.ca/ecas-seca/rascl/SCL',
      ENABLED_FEATURES: ['feature1', 'feature2'],
      HCAPTCHA_SITE_KEY: 'hcaptcha-site-key',
      HEADER_LOGO_URL_EN: 'https://canada.ca/en',
      HEADER_LOGO_URL_FR: 'https://canada.ca/fr',
      I18NEXT_DEBUG: true,
      SCCH_BASE_URI: 'https://service.canada.ca',
      SESSION_TIMEOUT_PROMPT_SECONDS: 30,
      SESSION_TIMEOUT_SECONDS: 120,
    };

    const { container } = render(<ClientEnvComponent env={env} nonce={nonce} />);

    expect(container.innerHTML).toEqual(`<script nonce="${nonce}">window.env = ${JSON.stringify(env)}</script>`);
  });
});
