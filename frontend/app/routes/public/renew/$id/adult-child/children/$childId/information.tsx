import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { AppPageTitle } from '~/components/layouts/public-layout';
import { LoadingButton } from '~/components/loading-button';
import { loadRenewAdultChildState, loadRenewAdultSingleChildState } from '~/route-helpers/renew-adult-child-route-helpers.server';
import { saveRenewState } from '~/route-helpers/renew-route-helpers.server';
import { isValidClientNumberRenewal } from '~/utils/application-code-utils';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum YesNoOption {
  Yes = 'yes',
  No = 'no',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'renew-adult-child', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.childInformation,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewAdultSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('renew-adult-child:children.child-number', { childNumber: state.childNumber });
  const childName = state.isNew ? childNumber : (state.information?.firstName ?? childNumber);

  const csrfToken = String(session.get('csrfToken'));
  const meta = {
    title: t('gcweb:meta.title.template', { title: t('renew-adult-child:children.information.page-title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('renew-adult-child:children.information.page-title', { childName: childNumber }) }),
  };

  return json({ csrfToken, meta, defaultState: state.information, childName, editMode: state.editMode, isNew: state.isNew });
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/adult-child/children/information');

  const state = loadRenewAdultSingleChildState({ params, request, session });
  const renewState = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  // Form action Continue & Save
  // state validation schema
  const childInformationSchema = z
    .object({
      firstName: z.string().trim().min(1, t('renew-adult-child:children.information.error-message.first-name-required')).max(100).refine(isAllValidInputCharacters, t('renew-adult-child:children.information.error-message.characters-valid')),
      lastName: z
        .string()
        .trim()
        .min(1, t('renew-adult-child:children.information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('renew-adult-child:children.information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('renew-adult-child:children.information.error-message.no-digits')),
      dateOfBirthYear: z.number({
        required_error: t('renew-adult-child:children.information.error-message.date-of-birth-year-required'),
        invalid_type_error: t('renew-adult-child:children.information.error-message.date-of-birth-year-number'),
      }),
      dateOfBirthMonth: z.number({
        required_error: t('renew-adult-child:children.information.error-message.date-of-birth-month-required'),
      }),
      dateOfBirthDay: z.number({
        required_error: t('renew-adult-child:children.information.error-message.date-of-birth-day-required'),
        invalid_type_error: t('renew-adult-child:children.information.error-message.date-of-birth-day-number'),
      }),
      dateOfBirth: z.string(),
      clientNumber: z.string().trim().min(1, t('renew-adult-child:children.information.error-message.client-number-required')).refine(isValidClientNumberRenewal, t('renew-adult-child:children.information.error-message.client-number-valid')),
      isParent: z.boolean({ errorMap: () => ({ message: t('renew-adult-child:children.information.error-message.is-parent') }) }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('renew-adult-child:children.information.error-message.date-of-birth-valid'),
          path: ['dateOfBirth'],
        });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('renew-adult-child:children.information.error-message.date-of-birth-is-past'),
          path: ['dateOfBirth'],
        });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('renew-adult-child:children.information.error-message.date-of-birth-is-past-valid'),
          path: ['dateOfBirth'],
        });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return {
        ...val,
        dateOfBirth: `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`,
      };
    });

  const data = {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    clientNumber: String(formData.get('clientNumber') ?? ''),
    isParent: formData.get('isParent') ? formData.get('isParent') === YesNoOption.Yes : undefined,
  };

  const parsedDataResult = childInformationSchema.safeParse(data);
  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  // TODO: Implement logic to check if the form data matches any existing children
  // for the applicant. Retrieve the applicant's list of children (possibily 'RelatedPerson') and compare the
  // provided child data (first name, last name, date of birth, and client number)
  // with the stored data. If a match is found, proceed with the next screen;
  // otherwise, return an error indicating no matching child was found.

  saveRenewState({
    params,
    session,
    state: {
      children: renewState.children.map((child) => {
        if (child.id !== state.id) return child;
        const information = { ...parsedDataResult.data };
        return { ...child, information };
      }),
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult-child/review-child-information', params));
  }

  if (!parsedDataResult.data.isParent) {
    return redirect(getPathById('public/renew/$id/adult-child/children/$childId/parent-or-guardian', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/children/$childId/dental-insurance', params));
}

export default function RenewFlowChildInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, childName, editMode, isNew } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    firstName: 'first-name',
    lastName: 'last-name',
    ...(i18n.language === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
    clientNumber: 'client-number',
    isParent: 'input-radio-is-parent-radios-option-0',
  });

  return (
    <>
      <AppPageTitle>{t('renew-adult-child:children.information.page-title', { childName })}</AppPageTitle>
      <div className="max-w-prose">
        <p className="mb-4">{t('renew-adult-child:children.information.form-instructions-sin')}</p>
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <Collapsible id="name-instructions" summary={t('renew-adult-child:children.information.single-legal-name')}>
              <p>{t('renew-adult-child:children.information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                label={t('renew-adult-child:children.information.first-name')}
                className="w-full"
                maxLength={100}
                aria-description={t('renew-adult-child:children.information.name-instructions')}
                autoComplete="given-name"
                errorMessage={errors?.firstName}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                label={t('renew-adult-child:children.information.last-name')}
                className="w-full"
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                aria-description={t('renew-adult-child:children.information.name-instructions')}
                required
              />
            </div>
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('renew-adult-child:children.information.date-of-birth')}
              errorMessages={{
                all: errors?.dateOfBirth,
                year: errors?.dateOfBirthYear,
                month: errors?.dateOfBirthMonth,
                day: errors?.dateOfBirthDay,
              }}
              required
            />
            <InputPatternField
              id="client-number"
              name="clientNumber"
              label={t('renew-adult-child:children.information.client-number')}
              inputMode="numeric"
              format="#############"
              helpMessagePrimary={t('renew-adult-child:children.information.client-number-detail')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.clientNumber ?? ''}
              errorMessage={errors?.clientNumber}
              required
            />
            <InputRadios
              id="is-parent-radios"
              name="isParent"
              legend={t('renew-adult-child:children.information.parent-legend')}
              options={[
                { value: YesNoOption.Yes, children: t('renew-adult-child:children.information.radio-options.yes'), defaultChecked: defaultState?.isParent === true, readOnly: !isNew, tabIndex: isNew ? 0 : -1 },
                { value: YesNoOption.No, children: t('renew-adult-child:children.information.radio-options.no'), defaultChecked: defaultState?.isParent === false, readOnly: !isNew, tabIndex: isNew ? 0 : -1 },
              ]}
              errorMessage={errors?.isParent}
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Child information click">
                {t('renew-adult-child:children.information.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="public/renew/$id/adult-child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Child information click"
              >
                {t('renew-adult-child:children.information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Child information click">
                {t('renew-adult-child:children.information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/children/index"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Child information click"
              >
                {t('renew-adult-child:children.information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
