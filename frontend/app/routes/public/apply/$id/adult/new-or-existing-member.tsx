import { useState } from 'react';
import type { ChangeEventHandler } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/new-or-existing-member';

import { TYPES } from '~/.server/constants';
import { getAgeCategoryFromDateString, loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import type { InputRadiosProps } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { isValidClientNumberRenewal, renewalCodeInputPatternFormat } from '~/utils/application-code-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { extractDigits } from '~/utils/string-utils';

const NEW_OR_EXISTING_MEMBER_OPTION = { no: 'no', yes: 'yes' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.newOrExistingMember,
  pageTitleI18nKey: 'apply-adult:new-or-existing-member.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:new-or-existing-member.page-title') }) };
  invariant(state.applicantInformation?.dateOfBirth, 'Expected applicantInformation.dateOfBirth to be defined');
  const ageCategory = getAgeCategoryFromDateString(state.applicantInformation.dateOfBirth);

  return { id: state.id, meta, defaultState: state.newOrExistingMember, userAgeCategory: ageCategory, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const state = loadApplyState({ params, session });

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const newOrExistingMemberSchema = z
    .object({
      newOrExistingMember: z.nativeEnum(NEW_OR_EXISTING_MEMBER_OPTION, {
        errorMap: () => ({ message: t('apply-adult:new-or-existing-member.error-message.is-new-or-existing-member-required') }),
      }),
      clientNumber: z
        .string()
        .trim()
        .optional()
        .transform((code) => (code ? extractDigits(code) : undefined)),
    })
    .superRefine((val, ctx) => {
      if (val.newOrExistingMember === NEW_OR_EXISTING_MEMBER_OPTION.yes) {
        if (!val.clientNumber) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('apply-adult:new-or-existing-member.error-message.client-number-required'),
            path: ['clientNumber'],
          });
        } else if (!isValidClientNumberRenewal(val.clientNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('apply-adult:new-or-existing-member.error-message.client-number-valid'),
            path: ['clientNumber'],
          });
        }
      }
    });

  const parsedDataResult = newOrExistingMemberSchema.safeParse({
    newOrExistingMember: formData.get('newOrExistingMember'),
    clientNumber: formData.get('clientNumber') ? String(formData.get('clientNumber') ?? '') : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveApplyState({
    params,
    session,
    state: {
      newOrExistingMember: {
        isNewOrExistingMember: parsedDataResult.data.newOrExistingMember === NEW_OR_EXISTING_MEMBER_OPTION.yes,
        clientNumber: parsedDataResult.data.clientNumber,
      },
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult/review-information', params));
  }

  return redirect(getPathById('public/apply/$id/adult/marital-status', params));
}

export default function ApplyFlowNewOrExistingMember({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, userAgeCategory, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { newOrExistingMember: 'input-radio-new-or-existing-member-option-0', clientNumber: 'client-number' });
  const [isNewOrExistingMember, setIsNewOrExistingMember] = useState(defaultState?.isNewOrExistingMember);

  const handleNewOrExistingMemberSelection: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIsNewOrExistingMember(e.target.value === NEW_OR_EXISTING_MEMBER_OPTION.yes);
  };

  const options: InputRadiosProps['options'] = [
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:new-or-existing-member.yes" components={{ bold: <strong /> }} />,
      value: NEW_OR_EXISTING_MEMBER_OPTION.yes,
      defaultChecked: defaultState?.isNewOrExistingMember === true,
      onChange: handleNewOrExistingMemberSelection,
    },
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:new-or-existing-member.no" components={{ bold: <strong /> }} />,
      value: NEW_OR_EXISTING_MEMBER_OPTION.no,
      defaultChecked: defaultState?.isNewOrExistingMember === false,
      onChange: handleNewOrExistingMemberSelection,
    },
  ];

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={36} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios id="new-or-existing-member" name="newOrExistingMember" legend={t('apply-adult:new-or-existing-member.previously-enrolled')} options={options} errorMessage={errors?.newOrExistingMember} required />
          {isNewOrExistingMember && (
            <div className="my-8">
              <InputPatternField
                id="client-number"
                name="clientNumber"
                format={renewalCodeInputPatternFormat}
                label={t('apply-adult:new-or-existing-member.client-number-label')}
                inputMode="numeric"
                defaultValue={defaultState?.clientNumber ?? ''}
                errorMessage={errors?.clientNumber}
                helpMessagePrimary={t('apply-adult:new-or-existing-member.client-number-description')}
                disableScreenReaderErrors
                required={isNewOrExistingMember}
              />
            </div>
          )}
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - New or existing member click">
                {t('apply-adult:new-or-existing-member.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="public/apply/$id/adult/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - New or existing member click">
                {t('apply-adult:new-or-existing-member.back-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - New or existing member click">
                {t('apply-adult:new-or-existing-member.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={userAgeCategory === 'youth' ? 'public/apply/$id/adult/living-independently' : 'public/apply/$id/adult/applicant-information'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - New or existing member click"
              >
                {t('apply-adult:new-or-existing-member.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
