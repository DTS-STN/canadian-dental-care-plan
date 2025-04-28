import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ContextualAlert } from '~/components/contextual-alert';

describe('ContextualAlert', () => {
  it('renders ContextualAlert Component with correct Icon', () => {
    const mockChildren = 'Text test';
    render(<ContextualAlert type="success">{mockChildren}</ContextualAlert>);

    expect(screen.getByText('Text test')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
