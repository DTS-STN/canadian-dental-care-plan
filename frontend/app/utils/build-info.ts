import { useMatches } from '@remix-run/react';

import { existsSync, readFileSync } from 'node:fs';

export type BuildInfo = {
  buildDate?: string;
  buildId?: string;
  buildRevision?: string;
  buildVersion?: string;
};

export function useBuildInfo() {
  return useMatches()
    .map((match) => match.data as { buildInfo?: BuildInfo })
    .map((data) => data?.buildInfo)
    .reduce((last, curr) => curr ?? last);
}

export function readBuildInfo(filename: string) {
  return existsSync(filename) ? (JSON.parse(readFileSync(filename, 'utf8')) as BuildInfo) : undefined;
}
