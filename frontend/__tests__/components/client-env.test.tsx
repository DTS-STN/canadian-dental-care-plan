import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ClientEnv } from '~/components/client-env';

describe('<ClientEnv>', () => {
  it('should render the script tag with the correct innerHTML', () => {
    const nonce = 'https://open.spotify.com/artist/3BNDjSD67jJE4fhxX1b2OV?si=T1lAx_1fQe6axdydq43XEA';

    const env = {
      I18NEXT_DEBUG: true,
      LANG_QUERY_PARAM: 'locale',
      SCCH_BASE_URI: 'http://www.example.com',
    };

    const { container } = render(<ClientEnv env={env} nonce={nonce} />);

    expect(container.innerHTML).toEqual(`<script nonce="${nonce}">window.env = ${JSON.stringify(env)}</script>`);
  });
});
