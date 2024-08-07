import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ClientEnv } from '~/components/client-env';
import type { PublicEnv } from '~/utils/env-utils.server';

describe('<ClientEnv>', () => {
  it('should render the script tag with the correct innerHTML', () => {
    const nonce = 'https://open.spotify.com/artist/3BNDjSD67jJE4fhxX1b2OV?si=T1lAx_1fQe6axdydq43XEA';

    const env: PublicEnv = {
      CDCP_WEBSITE_APPLY_URL_EN: 'https://www.example.com/apply.html',
      CDCP_WEBSITE_APPLY_URL_FR: 'https://www.example.com/demande.html',
      CDCP_WEBSITE_STATUS_URL_EN: 'https://www.example.com/apply.html#status',
      CDCP_WEBSITE_STATUS_URL_FR: 'https://www.example.com/demande.html#etat',
      CDCP_WEBSITE_URL_EN: 'https://www.example.com/dental-care-plan.html',
      CDCP_WEBSITE_URL_FR: 'https://www.example.com/regime-soins-dentaires.html',
      ENABLED_FEATURES: ['feature1', 'feature2'],
      I18NEXT_DEBUG: true,
      SCCH_BASE_URI: 'https://service.canada.ca',
      MSCA_BASE_URI: 'https://srv136.services.gc.ca',
      SESSION_TIMEOUT_SECONDS: 120,
      SESSION_TIMEOUT_PROMPT_SECONDS: 30,
      ADOBE_ANALYTICS_JQUERY_SRC: 'https://example.com/jquery.min.js',
    };

    const { container } = render(<ClientEnv env={env} nonce={nonce} />);

    expect(container.innerHTML).toEqual(`<script nonce="${nonce}">window.env = ${JSON.stringify(env)}</script>`);
  });
});
