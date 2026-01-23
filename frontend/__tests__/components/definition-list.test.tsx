import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { DefinitionList, DefinitionListDescription, DefinitionListGroup, DefinitionListTerm } from '~/components/definition-list';

describe('DefinitionList', () => {
  it.each([[undefined], ['single-column'], ['two-column']] as const)('renders layout (%s)', (layout) => {
    const { container } = render(
      <DefinitionList className="divide-y border-y" layout={layout}>
        <DefinitionListGroup>
          <DefinitionListTerm>Term 1</DefinitionListTerm>
          <DefinitionListDescription>Description 1</DefinitionListDescription>
        </DefinitionListGroup>
        <DefinitionListGroup>
          <DefinitionListTerm>Term 2</DefinitionListTerm>
          <DefinitionListDescription>Description 2</DefinitionListDescription>
        </DefinitionListGroup>
      </DefinitionList>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
