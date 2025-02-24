import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/terms-and-conditions';

import { TYPES } from '~/.server/constants';
import { clearApplyState, loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum CheckboxValue {
  Yes = 'yes',
}

const FORM_ACTION = {
  continue: 'continue',
  exit: 'exit',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.termsAndConditions,
  pageTitleI18nKey: 'apply:terms-and-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  loadApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:terms-and-conditions.page-title') }) };
  return { meta };
}

export async function action({ context: { appContainer, session }, request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.exit) {
    clearApplyState({ params, session });
    return redirect(t('apply:terms-and-conditions.dialog.exit-btn-link'));
  }

  const consentSchema = z
    .object({
      doNotConsent: z.string().trim().optional(),
      acknowledgeTerms: z.string().trim().optional(),
      acknowledgePrivacy: z.string().trim().optional(),
      shareData: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (!val.doNotConsent && !val.acknowledgeTerms) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:terms-and-conditions.checkboxes.error-message.acknowledge-terms-required'), path: ['acknowledgeTerms'] });
      }
      if (!val.doNotConsent && !val.acknowledgePrivacy) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:terms-and-conditions.checkboxes.error-message.acknowledge-privacy-required'), path: ['acknowledgePrivacy'] });
      }
      if (!val.doNotConsent && !val.shareData) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:terms-and-conditions.checkboxes.error-message.share-data-required'), path: ['shareData'] });
      }
    });

  const parsedDataResult = consentSchema.safeParse({
    acknowledgeTerms: formData.get('acknowledgeTerms') ?? '',
    acknowledgePrivacy: formData.get('acknowledgePrivacy') ?? '',
    shareData: formData.get('shareData') ?? '',
    doNotConsent: formData.get('doNotConsent') ?? '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveApplyState({ params, session, state: {} });
  return redirect(getPathById('public/apply/$id/tax-filing', params));
}

export default function ApplyIndex({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const [showDialog, setShowDialog] = useState(false);
  const [doNotConsentChecked, setDoNotConsentChecked] = useState(false);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    acknowledgeTerms: 'input-checkbox-acknowledge-terms',
    acknowledgePrivacy: 'input-checkbox-acknowledge-privacy',
    shareData: 'input-checkbox-share-data',
    doNotConsent: 'input-checkbox-do-not-consent"',
  });

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDoNotConsentChecked(event.target.checked);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (doNotConsentChecked) {
      event.preventDefault();
      setShowDialog(true);
    }
  };

  const canadaTermsConditions = <InlineLink to={t('apply:terms-and-conditions.links.canada-ca-terms-and-conditions')} className="external-link" newTabIndicator target="_blank" />;
  const fileacomplaint = <InlineLink to={t('apply:terms-and-conditions.links.file-complaint')} className="external-link" newTabIndicator target="_blank" />;
  const hcaptchaTermsOfService = <InlineLink to={t('apply:terms-and-conditions.links.hcaptcha')} className="external-link" newTabIndicator target="_blank" />;
  const infosource = <InlineLink to={t('apply:terms-and-conditions.links.info-source')} className="external-link" newTabIndicator target="_blank" />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('apply:terms-and-conditions.links.microsoft-data-privacy-policy')} className="external-link" newTabIndicator target="_blank" />;
  const cite = <cite />;

  return (
    <div className="max-w-prose">
      <div className="space-y-6">
        <p>{t('apply:terms-and-conditions.intro-text')}</p>
        <errorSummary.ErrorSummary />
        <Collapsible summary={t('apply:terms-and-conditions.terms-and-conditions-of-use.summary')}>
          <div className="space-y-6">
            <div className="space-y-4">
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.terms-and-conditions-of-use.online-application-legal-terms" components={{ canadaTermsConditions }} />
              </p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-access-terms')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-usage-terms')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-outage')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-timeout')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.terms-rejection-policy')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.esdc-definition-clarification')}</p>
            </div>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.heading')}</h2>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.self-agreement')}</li>
                <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.on-behalf-of-someone-else')}</li>
                <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.at-your-own-risk')}</li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.terms-and-conditions-of-use.online-application.msdc" components={{ microsoftDataPrivacyPolicy }} />
                </li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.terms-and-conditions-of-use.online-application.antibot" components={{ hcaptchaTermsOfService }} />
                </li>
              </ul>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('apply:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.heading')}</h2>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
            </section>
          </div>
        </Collapsible>

        <Collapsible summary={t('apply:terms-and-conditions.privacy-notice-statement.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.privacy-notice-statement.personal-information.heading')}</h2>
              <p>{t('apply:terms-and-conditions.privacy-notice-statement.personal-information.service-canada-application-administration')}</p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.personal-information.collection-use" components={{ cite }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.personal-information.microsoft-policy" components={{ microsoftDataPrivacyPolicy, cite }} />
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.heading')}</h2>
              <p>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-rights-and-access')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.hc-ppu-440')}</li>
                <li>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.esdc-ppu-712')}</li>
              </ul>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.info-source-access" components={{ infosource }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-handling-complaint-process" components={{ fileacomplaint }} />
              </p>
            </section>
          </div>
        </Collapsible>
        <Collapsible summary={t('apply:terms-and-conditions.sharing-your-information.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.heading')}</h2>
              <p>{t('apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.share-info')}</p>
              <p>{t('apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.disclose-info')}</p>
              <p>{t('apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.sun-life-authorization')}</p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.heading')}</h2>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.enrol-consent" components={{ cite }} />
              </p>
              <p>{t('apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.considered-minor')}</p>
              <p>{t('apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.analysis')}</p>
            </section>
          </div>
        </Collapsible>
      </div>
      <p className="my-8">{t('apply:terms-and-conditions.apply.application-participation')}</p>
      <p className="my-8" id="application-consent">
        {t('apply:terms-and-conditions.apply.application-consent')}
      </p>
      <fetcher.Form method="post" noValidate onSubmit={handleSubmit}>
        <CsrfTokenInput />
        <InputCheckbox id="acknowledge-terms" name="acknowledgeTerms" value={CheckboxValue.Yes} errorMessage={errors?.acknowledgeTerms} required>
          {t('apply:terms-and-conditions.checkboxes.acknowledge-terms')}
        </InputCheckbox>
        <InputCheckbox id="acknowledge-privacy" name="acknowledgePrivacy" value={CheckboxValue.Yes} errorMessage={errors?.acknowledgePrivacy} required>
          {t('apply:terms-and-conditions.checkboxes.acknowledge-privacy')}
        </InputCheckbox>
        <InputCheckbox id="share-data" name="shareData" value={CheckboxValue.Yes} errorMessage={errors?.shareData} required>
          {t('apply:terms-and-conditions.checkboxes.share-data')}
        </InputCheckbox>
        <InputCheckbox id="do-not-consent" name="doNotConsent" value={CheckboxValue.Yes} className="my-8" onChange={handleChecked}>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.checkboxes.do-not-consent" />
        </InputCheckbox>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            aria-describedby="application-consent"
            variant="primary"
            id="continue-button"
            name="_action"
            value={FORM_ACTION.continue}
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Agree and Continue - Terms and Conditions click"
          >
            {t('apply:terms-and-conditions.apply.start-button')}
          </LoadingButton>
          <ButtonLink id="back-button" to={t('apply:terms-and-conditions.apply.link')} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Terms and Conditions click">
            {t('apply:terms-and-conditions.apply.back-button')}
          </ButtonLink>
        </div>
      </fetcher.Form>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('apply:terms-and-conditions.dialog.title')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{t('apply:terms-and-conditions.dialog.description')}</DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="confirm-modal-back" disabled={isSubmitting} startIcon={faChevronLeft} variant="default" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Modal Back - Terms and Conditions click">
                {t('apply:terms-and-conditions.dialog.back-btn')}
              </Button>
            </DialogClose>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <Button
                id="exit-application"
                name="_action"
                value={FORM_ACTION.exit}
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Modal Exit application - Terms and Conditions click"
              >
                {t('apply:terms-and-conditions.dialog.exit-btn')}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
