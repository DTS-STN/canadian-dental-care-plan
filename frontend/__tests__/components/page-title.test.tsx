import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { PageTitle } from '~/components/page-title';

describe('PageTitle', () => {
  it('renders children and applies additional props', () => {
    const mockChildren = 'Hello, World!';
    const mockAdditionalProps = { className: 'custom-class' };

    const { getByText } = render(<PageTitle {...mockAdditionalProps}>{mockChildren}</PageTitle>);

    const pageTitleElement = getByText(mockChildren);

    expect(pageTitleElement).toBeInTheDocument();
    expect(pageTitleElement.tagName).toBe('H1');
    expect(pageTitleElement.textContent).toBe(mockChildren);
    expect(pageTitleElement).toHaveClass(mockAdditionalProps.className);
    expect(pageTitleElement).toHaveAttribute('id', 'wb-cont');
    expect(pageTitleElement).toHaveAttribute('property', 'name');
  });
});
