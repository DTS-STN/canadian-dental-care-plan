import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ClientEnv as ClientEnvComponent } from '~/components/client-env';
import type { ClientEnv } from '~/utils/env-utils';

describe('<ClientEnv>', () => {
  it('should render the script tag with the correct innerHTML', () => {
    const nonce = 'https://open.spotify.com/artist/3BNDjSD67jJE4fhxX1b2OV?si=T1lAx_1fQe6axdydq43XEA';

    const env: ClientEnv = {
      ENABLED_FEATURES: ['feature1', 'feature2'],
      I18NEXT_DEBUG: true,
      ECAS_BASE_URI: 'https://srv136.services.gc.ca/ecas-seca',
      SCCH_BASE_URI: 'https://service.canada.ca',
      SESSION_TIMEOUT_SECONDS: 120,
      SESSION_TIMEOUT_PROMPT_SECONDS: 30,
      ADOBE_ANALYTICS_JQUERY_SRC: 'https://example.com/jquery.min.js',
    };

    const { container } = render(<ClientEnvComponent env={env} nonce={nonce} />);

    expect(container.innerHTML).toEqual(`<script nonce="${nonce}">window.env = ${JSON.stringify(env)}</script>`);
  });
});
