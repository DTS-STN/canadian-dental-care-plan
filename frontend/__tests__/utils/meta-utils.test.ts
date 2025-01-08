import type { MetaArgs } from 'react-router';
import type { CreateMetaArgs } from 'react-router/route-module';

import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { mergeMeta, mergeRouteModuleMeta } from '~/utils/meta-utils';

describe('mergeMeta', () => {
  it('should merge parent and leaf meta correctly', () => {
    const parentMeta = [
      { title: 'Parent Title' }, //
      { name: 'description', content: 'Parent Description' },
    ];

    const leafMeta = () => [{ title: 'Leaf Title' }];

    const args: MetaArgs = {
      data: undefined,
      location: mock<MetaArgs['location']>({ pathname: '/leaf' }),
      matches: [
        {
          data: undefined,
          id: 'parent',
          meta: parentMeta,
          params: {},
          pathname: '/',
        },
      ],
      params: {},
    };

    const mergedMeta = mergeMeta(leafMeta)(args);

    expect(mergedMeta).toEqual([
      { title: 'Leaf Title' }, //
      { name: 'description', content: 'Parent Description' },
    ]);
  });
});

describe('mergeRouteModuleMeta', () => {
  it('should merge parent and leaf meta correctly', () => {
    const parentMeta = [
      { title: 'Parent Title' }, //
      { name: 'description', content: 'Parent Description' },
    ];

    const leafMeta = () => [{ title: 'Leaf Title' }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type MetaArgs = CreateMetaArgs<any>;

    const args: MetaArgs = {
      data: undefined,
      location: mock<MetaArgs['location']>({ pathname: '/leaf' }),
      matches: [
        {
          data: undefined,
          id: 'parent',
          meta: parentMeta,
          params: {},
          pathname: '/',
        },
      ],
      params: {},
    };

    const mergedMeta = mergeRouteModuleMeta(leafMeta)(args);

    expect(mergedMeta).toEqual([
      { title: 'Leaf Title' }, //
      { name: 'description', content: 'Parent Description' },
    ]);
  });
});
