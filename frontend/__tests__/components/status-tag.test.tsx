import { render } from '@testing-library/react';

import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { describe, expect, it, vi } from 'vitest';

import { StatusTag } from '~/components/status-tag';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common:status.complete': 'Complete',
        'common:status.new': 'New',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: IconProp }) => (
    <span data-testid="font-awesome-icon" data-icon={typeof icon === 'string' ? icon : 'icon'}>
      Icon
    </span>
  ),
}));

describe('StatusTag', () => {
  it('should render complete status', () => {
    const { container } = render(<StatusTag status="complete" />);
    expect(container).toMatchSnapshot();
  });

  it('should render new status', () => {
    const { container } = render(<StatusTag status="new" />);
    expect(container).toMatchSnapshot();
  });
});
