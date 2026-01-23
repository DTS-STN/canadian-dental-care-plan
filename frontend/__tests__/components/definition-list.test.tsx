import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { DefinitionList, DefinitionListItem } from '~/components/definition-list';

describe('DefinitionList', () => {
  it.each([
    ['single-column', false], //
    ['single-column', true],
    ['two-column', false],
    ['two-column', true],
  ] as const)('renders layout (%s) and border (%s)', (layout, border) => {
    const { container } = render(
      <DefinitionList border={border} layout={layout}>
        <DefinitionListItem term="Term 1">Description 1</DefinitionListItem>
        <DefinitionListItem term="Term 2">Description 2</DefinitionListItem>
      </DefinitionList>,
    );
    expect(container).toMatchSnapshot();
  });
});
