import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { Collapsible } from '~/components/collapsible';

describe('Collapsible Details', () => {
  it('renders children and applies additional props', () => {
    const additionalProps = { id: 'joke', summary: 'How do we make the Internet more eco-friendly?' };
    const children = 'Integrate botany.';

    const { getByText } = render(<Collapsible {...additionalProps}>{children}</Collapsible>);

    const collapsibleDetailsElement = getByText(children);

    expect(collapsibleDetailsElement).toBeInTheDocument();
    expect(collapsibleDetailsElement.tagName).toBe('DIV');
    expect(collapsibleDetailsElement.textContent).toBe(children);
    expect(collapsibleDetailsElement.id).toBe(additionalProps.id + '-content');

    const collapsibleDetailsSummaryElement = getByText(additionalProps.summary);
    expect(collapsibleDetailsSummaryElement.tagName).toBe('SPAN');
    expect(collapsibleDetailsSummaryElement.parentElement?.tagName).toBe('SUMMARY');
    expect(collapsibleDetailsSummaryElement.parentElement?.id).toBe(additionalProps.id + '-summary');
  });
});
