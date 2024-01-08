import { render, screen, waitFor } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { LanguageSwitcher } from '~/routes/_gcweb-app/language-switcher';

// Create a stub because the component needs a Router context which is facilitated like so (otherwise it will error):
const RemixStub = createRemixStub([{ path: '', Component: LanguageSwitcher }]);

describe('Unit tests AppLink.tsx', () => {
  test('loads the language switcher', async () => {
    render(<RemixStub />);
    await waitFor(() => screen.findByTestId('language-switcher'));
  });
});
