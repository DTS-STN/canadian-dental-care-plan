import type { LoaderFunction, MetaFunction } from 'react-router';

/**
 * Merging helper {@link https://remix.run/docs/en/main/route/meta#meta-merging-helper}
 *
 * If you can't avoid the merge problem with global meta or index routes, we've created
 * a helper that you can put in your app that can override and append to parent meta easily.
 */
export const mergeMeta = <Loader extends LoaderFunction | unknown = unknown, ParentsLoaders extends Record<string, LoaderFunction | unknown> = Record<string, unknown>>(
  leafMetaFn: MetaFunction<Loader, ParentsLoaders>,
): MetaFunction<Loader, ParentsLoaders> => {
  return (args) => {
    const leafMeta = leafMetaFn(args);

    return args.matches.reduceRight((acc, match) => {
      for (const parentMeta of match.meta) {
        const index =
          acc?.findIndex((meta) => {
            // prettier-ignore
            return ('name' in meta && 'name' in parentMeta && meta.name === parentMeta.name)
            || ('property' in meta && 'property' in parentMeta && meta.property === parentMeta.property)
            || ('title' in meta && 'title' in parentMeta);
          }) ?? -1;
        if (index === -1) {
          // Parent meta not found in acc, so add it
          acc?.push(parentMeta);
        }
      }
      return acc;
    }, leafMeta);
  };
};
