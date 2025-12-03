import { useState } from 'react';
import type { ChangeEventHandler } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/new-or-returning-member';

import { TYPES } from '~/.server/constants';
import { getAgeCategoryFromDateString, getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import type { InputRadiosProps } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
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
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.newOrReturningMember,
  pageTitleI18nKey: 'application-spokes:new-or-returning-member.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:new-or-returning-member.page-title') }) };

  invariant(state.applicantInformation?.dateOfBirth, 'Expected applicantInformation.dateOfBirth to be defined');
  const ageCategory = getAgeCategoryFromDateString(state.applicantInformation.dateOfBirth);

  return { meta, defaultState: state.newOrExistingMember, userAgeCategory: ageCategory, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const newOrExistingMemberSchema = z
    .object({
      newOrExistingMember: z.enum(NEW_OR_EXISTING_MEMBER_OPTION, {
        error: t('application-spokes:new-or-returning-member.error-message.is-new-or-existing-member-required'),
      }),
      memberId: z
        .string()
        .trim()
        .optional()
        .transform((code) => (code ? extractDigits(code) : undefined)),
    })

    .superRefine((val, ctx) => {
      if (val.newOrExistingMember === NEW_OR_EXISTING_MEMBER_OPTION.yes) {
        if (!val.memberId) {
          ctx.addIssue({
            code: 'custom',
            message: t('application-spokes:new-or-returning-member.error-message.member-id-required'),
            path: ['memberId'],
          });
        } else if (!isValidClientNumberRenewal(val.memberId)) {
          ctx.addIssue({
            code: 'custom',
            message: t('application-spokes:new-or-returning-member.error-message.member-id-valid'),
            path: ['memberId'],
          });
        }
      }
    });

  const parsedDataResult = newOrExistingMemberSchema.safeParse({
    newOrExistingMember: formData.get('newOrExistingMember'),
    memberId: formData.get('memberId') ? String(formData.get('memberId') ?? '') : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({
    params,
    session,
    state: {
      newOrExistingMember: {
        isNewOrExistingMember: parsedDataResult.data.newOrExistingMember === NEW_OR_EXISTING_MEMBER_OPTION.yes,
        memberId: parsedDataResult.data.memberId,
      },
    },
  });

  return redirect(getPathById('public/application/$id/type-of-application', params));
}

export default function ApplyFlowNewOrExistingMember({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, userAgeCategory } = loaderData;

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
      children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:new-or-returning-member.yes" components={{ bold: <strong /> }} />,
      value: NEW_OR_EXISTING_MEMBER_OPTION.yes,
      defaultChecked: defaultState?.isNewOrExistingMember === true,
      onChange: handleNewOrExistingMemberSelection,
    },
    {
      children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:new-or-returning-member.no" components={{ bold: <strong /> }} />,
      value: NEW_OR_EXISTING_MEMBER_OPTION.no,
      defaultChecked: defaultState?.isNewOrExistingMember === false,
      onChange: handleNewOrExistingMemberSelection,
    },
  ];

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('application:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios id="new-or-existing-member" name="newOrExistingMember" legend={t('application-spokes:new-or-returning-member.previously-enrolled')} options={options} errorMessage={errors?.newOrExistingMember} required />
          {isNewOrExistingMember && (
            <div className="my-8">
              <InputPatternField
                id="member-id"
                name="memberId"
                format={renewalCodeInputPatternFormat}
                label={t('application-spokes:new-or-returning-member.member-id')}
                inputMode="numeric"
                defaultValue={defaultState?.memberId ?? ''}
                errorMessage={errors?.memberId}
                helpMessagePrimary={t('application-spokes:new-or-returning-member.member-id-description')}
                required={isNewOrExistingMember}
              />
            </div>
          )}
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - New or existing member click">
              {t('application-spokes:new-or-returning-member.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={userAgeCategory === 'youth' ? 'public/application/$id/living-independently' : 'public/application/$id/type-of-application'} // TODO: update route
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - New or existing member click"
            >
              {t('application-spokes:new-or-returning-member.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
