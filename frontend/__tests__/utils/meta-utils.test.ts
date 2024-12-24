import type { MetaArgs } from 'react-router';

import { describe, expect, it } from 'vitest';

import { mergeMeta } from '~/utils/meta-utils';

describe('mergeMeta', () => {
  it('should merge parent meta with leaf meta', () => {
    // Mock data
    const parentMetaFn = () => [
      { name: 'description', content: 'Parent description' },
      { name: 'keywords', content: 'Parent keywords' },
    ];

    const leafMetaFn = () => [
      { name: 'description', content: 'Leaf description' },
      { name: 'author', content: 'Leaf author' },
    ];

    const args: MetaArgs = {
      data: undefined,
      location: {
        hash: '',
        key: '',
        pathname: '/',
        search: '',
        state: {},
      },
      matches: [
        {
          data: undefined,
          id: 'parent',
          meta: parentMetaFn(),
          params: {},
          pathname: '/',
        },
      ],
      params: {},
    };

    // Call the mergeMeta function
    const mergedMetaFn = mergeMeta(leafMetaFn);
    const mergedMeta = mergedMetaFn(args);

    // Assertions
    expect(mergedMeta).toEqual([
      { name: 'description', content: 'Leaf description' },
      { name: 'author', content: 'Leaf author' },
      { name: 'keywords', content: 'Parent keywords' },
    ]);
  });

  it('should handle merging when parent meta not found', () => {
    // Mock data
    const parentMetaFn = () => [];
    const leafMetaFn = () => [{ name: 'description', content: 'Leaf description' }];

    const args: MetaArgs = {
      data: undefined,
      location: {
        hash: '',
        key: '',
        pathname: '/',
        search: '',
        state: {},
      },
      matches: [
        {
          data: undefined,
          id: 'parent',
          meta: parentMetaFn(),
          params: {},
          pathname: '/',
        },
      ],
      params: {},
    };

    // Call the mergeMeta function
    const mergedMetaFn = mergeMeta(leafMetaFn);
    const mergedMeta = mergedMetaFn(args);

    // Assertions
    expect(mergedMeta).toEqual([{ name: 'description', content: 'Leaf description' }]);
  });

  it('should handle merging when meta properties are different', () => {
    // Mock data
    const parentMetaFn = () => [{ name: 'description', content: 'Parent description' }];
    const leafMetaFn = () => [{ property: 'og:description', content: 'Leaf OG description' }];

    const args: MetaArgs = {
      data: undefined,
      location: {
        hash: '',
        key: '',
        pathname: '/',
        search: '',
        state: {},
      },
      matches: [
        {
          data: undefined,
          id: 'parent',
          meta: parentMetaFn(),
          params: {},
          pathname: '/',
        },
      ],
      params: {},
    };

    // Call the mergeMeta function
    const mergedMetaFn = mergeMeta(leafMetaFn);
    const mergedMeta = mergedMetaFn(args);

    // Assertions
    expect(mergedMeta).toEqual([
      { property: 'og:description', content: 'Leaf OG description' },
      { name: 'description', content: 'Parent description' },
    ]);
  });
});
