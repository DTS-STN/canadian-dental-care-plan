import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ClientEnv as ClientEnvComponent } from '~/components/client-env';
import type { ClientEnv, FeatureName } from '~/utils/env-utils';

describe('<ClientEnv>', () => {
  it('should render the script tag with the correct innerHTML', () => {
    const nonce = 'https://open.spotify.com/artist/3BNDjSD67jJE4fhxX1b2OV?si=T1lAx_1fQe6axdydq43XEA';

    const env: ClientEnv = {
      ADOBE_ANALYTICS_JQUERY_SRC: 'https://example.com/jquery.min.js',
      ANOTHER_ETHNIC_GROUP_OPTION: 100_000_002,
      INDIGENOUS_STATUS_PREFER_NOT_TO_ANSWER: 100_000_002,
      DISABILITY_STATUS_PREFER_NOT_TO_ANSWER: 100_000_002,
      ETHNIC_GROUP_PREFER_NOT_TO_ANSWER: 100_000_002,
      LOCATION_BORN_STATUS_PREFER_NOT_TO_ANSWER: 100_000_002,
      GENDER_STATUS_PREFER_NOT_TO_ANSWER: 100_000_002,
      CANADA_COUNTRY_ID: 'CAN',
      CLIENT_STATUS_SUCCESS_ID: 'CLIENT_STATUS_SUCCESS',
      COMMUNICATION_METHOD_EMAIL_ID: 'EMAIL',
      COMMUNICATION_METHOD_MAIL_ID: 'MAIL',
      COMMUNICATION_METHOD_GC_DIGITAL_ID: 'DIGITAL',
      COMMUNICATION_METHOD_GC_MAIL_ID: 'MAIL',
      ECAS_BASE_URI: 'https://srv136.services.gc.ca/ecas-seca/rascl/SCL',
      ENABLED_FEATURES: ['feature1', 'feature2'] as unknown as FeatureName[],
      HCAPTCHA_SITE_KEY: 'hcaptcha-site-key',
      HEADER_LOGO_URL_EN: 'https://canada.ca/en',
      HEADER_LOGO_URL_FR: 'https://canada.ca/fr',
      I18NEXT_DEBUG: true,
      INVALID_CLIENT_FRIENDLY_STATUS: 'INVALID_CLIENT_FRIENDLY_STATUS',
      IS_APPLICANT_FIRST_NATIONS_YES_OPTION: 100_000_001,
      SCCH_BASE_URI: 'https://service.canada.ca',
      SESSION_TIMEOUT_PROMPT_SECONDS: 30,
      SESSION_TIMEOUT_SECONDS: 120,
      USA_COUNTRY_ID: 'USA',
      INVALID_LETTER_TYPE_IDS: ['101010'],
      CDCP_SURVEY_LINK_EN: 'https://canada-preview.adobecqms.net/en/services/benefits/dental/dental-care-plan/questionnaire-after-application.html',
      CDCP_SURVEY_LINK_FR: 'https://canada-preview.adobecqms.net/fr/services/prestations/dentaire/regime-soins-dentaires/questionnaire-apres-processus-demande.html',
    };

    const { container } = render(<ClientEnvComponent env={env} nonce={nonce} />);

    expect(container.innerHTML).toEqual(`<script nonce="${nonce}">window.env = ${JSON.stringify(env)}</script>`);
  });
});
