import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { CollapsableDetails } from '~/components/collapsible';

describe('Collapsible Details', () => {
  it('renders children and applies additional props', () => {
    const additionalProps = { id: 'joke', summary: 'How do we make the Internet more eco-friendly?' };
    const children = 'Integrate botany.';

    const { getByText } = render(<CollapsableDetails {...additionalProps}>{children}</CollapsableDetails>);

    const collapsableDetailsElement = getByText(children);

    expect(collapsableDetailsElement).toBeInTheDocument();
    expect(collapsableDetailsElement.tagName).toBe('DIV');
    expect(collapsableDetailsElement.textContent).toBe(children);
    expect(collapsableDetailsElement.id).toBe(additionalProps.id + '-content');

    const collapsableDetailsSummaryElement = getByText(additionalProps.summary);
    expect(collapsableDetailsSummaryElement.tagName).toBe('SPAN');
    expect(collapsableDetailsSummaryElement.id).toBe(additionalProps.id + '-summary-header');
  });
});
