import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';

import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { Button } from '~/components/buttons';
import { InputField } from '~/components/input-field';
import { PublicLayout } from '~/components/layouts/public-layout';
import { getApplicationStatusService } from '~/services/application-status-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status,
  pageTitleI18nKey: 'status:page-title',
} as const satisfies RouteHandleData;

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const formDataSchema = z.object({
    sin: z.string().trim().min(1, { message: 'Please enter your SIN' }),
    code: z.string().trim().min(1, { message: 'Please enter your application code' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);

  const response: {
    errors?: z.ZodFormattedError<{ sin: string; code: string }, string>;
    formData?: Partial<z.infer<typeof formDataSchema>>;
    status?: string;
  } = {};

  if (!parsedDataResult.success) {
    response.errors = parsedDataResult.error.format();
    response.formData = formData as Partial<z.infer<typeof formDataSchema>>;
    return json(response);
  }

  const applicationStatusService = getApplicationStatusService();
  const { sin, code } = parsedDataResult.data;
  const status = await applicationStatusService.getStatusId(sin, code);

  response.status = status ?? undefined;
  return json(response);
}

export default function StatusChecker() {
  const actionData = useActionData<typeof action>();

  // TODO use <PublicLayout> for now
  return (
    <PublicLayout>
      <Form method="post" noValidate>
        <div className="space-y-6">
          <InputField id="sin" name="sin" label="Please enter your SIN" required />
          <InputField id="code" name="code" label="Please enter your application code" required />
        </div>
        <Button className="mt-8" id="submit" variant="primary">
          Check status
        </Button>
      </Form>

      {actionData && (
        <dd className="mt-8">
          <dt className="font-semibold">Status:</dt>
          <dd>{actionData.status ?? 'No application'}</dd>
        </dd>
      )}
    </PublicLayout>
  );
}
