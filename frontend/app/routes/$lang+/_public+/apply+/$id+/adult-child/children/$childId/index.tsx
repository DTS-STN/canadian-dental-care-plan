import { LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

import { DebugPayload } from '~/components/debug-payload';
import { InlineLink } from '~/components/inline-link';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { getChild, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, session, request });
  const child = getChild(state, String(params.childId));

  if (!child) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/children', params));
  }

  // TODO: redirect to child information page
  saveApplyState({ params, session, state: {} });
  return json({ child });
}

export default function ApplyAdultChildrenIndex() {
  const { child } = useLoaderData<typeof loader>();
  const params = useParams();

  return (
    <>
      <div className="mb-4">
        <InlineLink routeId="$lang+/_public+/apply+/$id+/adult-child/children/index" params={params}>
          Go to Children HUB!
        </InlineLink>
      </div>
      <div className="mb-4">Child JSON</div>
      <DebugPayload data={child} />
    </>
  );
}
