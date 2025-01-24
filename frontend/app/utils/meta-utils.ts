import type { MetaDescriptor } from 'react-router';
import type { CreateMetaArgs, MetaDescriptors } from 'react-router/route-module';

/**
 * Merging helper that works
 *
 * If you can't avoid the merge problem with global meta or index routes, we've created
 * a helper that you can put in your app that can override and append to parent meta easily.
 *
 * @example
 * ```typescript
 * import type { Route } from './+types/leaf';
 *
 * import { mergeMeta } from '~/utils/meta-utils';
 *
 * export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
 *   return [
 *     { title: "My Leaf Route" },
 *   ];
 * });
 *
 * // In a parent route:
 * import type { Route } from './+types/root';
 *
 * export const meta: Route.MetaFunction = ({ data }) => {
 *   return [
 *     { title: "My Parent Route" },
 *     { name: 'description', content: "This is the parent route" },
 *   ];
 * }
 * ```
 * The resulting meta will contain both `title: 'My Leaf Route'` and `description: 'This is the parent route'`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeMeta<TMetaArgs extends CreateMetaArgs<any>>(leafMetaFn: (args: TMetaArgs) => MetaDescriptors): (args: TMetaArgs) => MetaDescriptors {
  return (args) => {
    const leafMeta = leafMetaFn(args);

    return args.matches.reduceRight((acc, match) => {
      for (const parentMeta of match?.meta ?? []) {
        addUniqueMeta(acc, parentMeta);
      }

      return acc;
    }, leafMeta);
  };
}

function addUniqueMeta(acc: MetaDescriptor[] | undefined, parentMeta: MetaDescriptor) {
  if (acc?.findIndex((meta) => isMetaEqual(meta, parentMeta)) === -1) {
    acc.push(parentMeta);
  }
}

function isMetaEqual(meta1: MetaDescriptor, meta2: MetaDescriptor): boolean {
  // prettier-ignore
  return ('name' in meta1 && 'name' in meta2 && meta1.name === meta2.name) ||
    ('property' in meta1 && 'property' in meta2 && meta1.property === meta2.property) ||
    ('title' in meta1 && 'title' in meta2);
}
