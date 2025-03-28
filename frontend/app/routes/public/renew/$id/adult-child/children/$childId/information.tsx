import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/information';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildState, loadRenewAdultSingleChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorAlert } from '~/components/error-alert';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { isValidClientNumberRenewal, renewalCodeInputPatternFormat } from '~/utils/application-code-utils';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString, parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { extractDigits, hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';

const YES_NO_OPTION = {
  yes: 'yes',
  no: 'no',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'renew-adult-child', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.childInformation,
  pageTitleI18nKey: 'renew-adult-child:children.information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultSingleChildState({ params, request, session });

  if (!state.isNew) {
    return redirect(getPathById('public/renew/$id/adult-child/children/$childId/dental-insurance', params));
  }

  const t = await getFixedT(request, handle.i18nNamespaces);

  const childName = t('renew-adult-child:children.child-number', { childNumber: state.childNumber });

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('renew-adult-child:children.information.page-title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('renew-adult-child:children.information.page-title', { childName }) }),
  };

  return { meta, defaultState: state.information, childName, editMode: state.editMode, i18nOptions: { childName } };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewAdultSingleChildState({ params, request, session });
  const renewState = loadRenewAdultChildState({ params, request, session });

  const locale = getLocale(request);
  const t = await getFixedT(request, handle.i18nNamespaces);

  // Form action Continue & Save
  // state validation schema
  const childInformationSchema = z
    .object({
      firstName: z
        .string()
        .trim()
        .min(1, t('renew-adult-child:children.information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('renew-adult-child:children.information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('renew-adult-child:children.information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('renew-adult-child:children.information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('renew-adult-child:children.information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('renew-adult-child:children.information.error-message.last-name-no-digits')),
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
      clientNumber: z
        .string()
        .trim()
        .min(1, t('renew-adult-child:children.information.error-message.client-number-required'))
        .refine(isValidClientNumberRenewal, t('renew-adult-child:children.information.error-message.client-number-valid'))
        .transform((code) => extractDigits(code)),
      isParent: z.boolean({ errorMap: () => ({ message: t('renew-adult-child:children.information.error-message.is-parent') }) }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      const coverageEndDate = renewState.applicationYear.coverageEndDate;

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
      } else if (getAgeFromDateString(dateOfBirth, coverageEndDate) >= 18) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('renew-adult-child:children.information.error-message.date-of-birth-ineligible', { coverageEndDate: toLocaleDateString(parseDateString(coverageEndDate), locale) }),
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

  const parsedDataResult = childInformationSchema.safeParse({
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    clientNumber: String(formData.get('clientNumber') ?? ''),
    isParent: formData.get('isParent') ? formData.get('isParent') === YES_NO_OPTION.yes : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  const matches = renewState.clientApplication?.children.map(
    (child) =>
      child.information.clientNumber === parsedDataResult.data.clientNumber &&
      child.information.dateOfBirth === parsedDataResult.data.dateOfBirth &&
      child.information.lastName.toLowerCase() === parsedDataResult.data.lastName.toLowerCase() &&
      child.information.firstName.toLowerCase() === parsedDataResult.data.firstName.toLowerCase(),
  );

  if (matches && !matches.includes(true)) {
    return { status: 'child-not-found' } as const;
  }

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

export default function RenewFlowChildInformation({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    firstName: 'first-name',
    lastName: 'last-name',
    ...(currentLanguage === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
    clientNumber: 'client-number',
    isParent: 'input-radio-is-parent-radios-option-0',
  });
  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'child-not-found');

  const noWrap = <span className="whitespace-nowrap" />;

  return (
    <>
      <ErrorAlert>
        <h2 className="mb-2 font-bold">{t('renew-adult-child:children.information.child-not-found.heading')}</h2>
        <p className="mb-2">{t('renew-adult-child:children.information.child-not-found.please-review')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:children.information.child-not-found.contact-service-canada" components={{ noWrap }} />
        </p>
      </ErrorAlert>
      <div className="my-6 sm:my-8">
        <Progress value={81} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('renew-adult-child:children.information.form-instructions-sin')}</p>
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
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
              format={renewalCodeInputPatternFormat}
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
                { value: YES_NO_OPTION.yes, children: t('renew-adult-child:children.information.radio-options.yes'), defaultChecked: defaultState?.isParent === true, readOnly: false, tabIndex: 0 },
                { value: YES_NO_OPTION.no, children: t('renew-adult-child:children.information.radio-options.no'), defaultChecked: defaultState?.isParent === false, readOnly: false, tabIndex: 0 },
              ]}
              errorMessage={errors?.isParent}
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Save - Child information click">
                {t('renew-adult-child:children.information.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="public/renew/$id/adult-child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Cancel - Child information click"
              >
                {t('renew-adult-child:children.information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Continue - Child information click">
                {t('renew-adult-child:children.information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/children/index"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Back - Child information click"
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
