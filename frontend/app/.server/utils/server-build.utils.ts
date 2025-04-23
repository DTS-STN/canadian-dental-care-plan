import type { ServerBuild } from 'react-router';

type ServerRouteManifest = ServerBuild['routes'];
type ServerRouteManifestEntry = NonNullable<ServerRouteManifest[string]>;
type ServerRoute = ServerRouteManifestEntry & {
  children: ServerRoute[];
};

/**
 * Creates a hierarchical array of server routes (ServerRoute[]) from a flat manifest (ServerRouteManifest).
 * It first groups the routes by their `parentId` for efficient tree construction,
 * then recursively builds the tree structure starting from the specified root.
 *
 * @param serverRouteManifest The flat route manifest object from the server build.
 * @returns An array of root ServerRoute objects, each potentially containing nested children,
 *          representing the route hierarchy.
 */
export function createServerRoutes(serverRouteManifest: ServerRouteManifest): ServerRoute[] {
  const routesByParentId = groupServerRoutesByParentId(serverRouteManifest);
  return buildRouteTreeRecursive('', routesByParentId);
}

/**
 * Recursively builds the hierarchical route tree.
 * This function assumes `routesByParentId` has already been computed.
 * It finds all children for a given `parentId`, constructs their `ServerRoute` objects,
 * and recursively calls itself to build the children for each of those routes.
 *
 * @param parentId The ID of the parent route whose children are being sought.
 * @param routesByParentId A pre-computed map where keys are parent IDs and values are arrays
 *                         of corresponding child route manifest entries.
 * @returns An array of `ServerRoute` objects representing the children of the given `parentId`.
 */
function buildRouteTreeRecursive(parentId: string, routesByParentId: Record<string, ServerRouteManifestEntry[]>): ServerRoute[] {
  const childEntries = routesByParentId[parentId] ?? [];
  return childEntries.map((routeEntry) => ({
    ...routeEntry,
    children: buildRouteTreeRecursive(routeEntry.id, routesByParentId),
  }));
}

/**
 * Groups route manifest entries by their `parentId`.
 * Filters out any null or undefined entries in the manifest.
 * Routes without a `parentId` are grouped under the key `''`.
 *
 * @param serverRouteManifest The flat route manifest object.
 * @returns A record where keys are parent IDs and values are arrays of route manifest entries
 *          belonging to that parent.
 */
function groupServerRoutesByParentId(serverRouteManifest: ServerRouteManifest): Record<string, ServerRouteManifestEntry[]> {
  const routesByParent: Record<string, ServerRouteManifestEntry[]> = {};

  Object.values(serverRouteManifest)
    .filter((routeEntry) => routeEntry !== undefined)
    .forEach((routeEntry) => {
      const parentId = routeEntry.parentId ?? '';
      routesByParent[parentId] ??= [];
      routesByParent[parentId].push(routeEntry);
    });

  return routesByParent;
}
