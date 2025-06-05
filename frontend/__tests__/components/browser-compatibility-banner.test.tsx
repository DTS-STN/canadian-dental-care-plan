import { render } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import { BrowserCompatibilityBanner } from '~/components/browser-compatibility-banner';

describe('BrowserCompatibilityBanner', () => {
  it('should render the BrowserCompatibilityBanner', () => {
    const { container } = render(<BrowserCompatibilityBanner />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should call onDismiss when the dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    const { getByRole } = render(<BrowserCompatibilityBanner onDismiss={onDismiss} />);

    const dismissButton = getByRole('button', { name: 'gcweb:browser-compatibility-banner.dismiss' });
    dismissButton.click();

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
