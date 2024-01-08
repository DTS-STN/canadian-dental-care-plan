import { useMatches } from '@remix-run/react';

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
