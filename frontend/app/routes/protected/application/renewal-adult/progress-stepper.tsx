import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationRenewalAdultSteps = ['marital-status', 'contact-information', 'dental-insurance', 'submit'] as const;
type ApplicationRenewalAdultSteps = (typeof applicationRenewalAdultSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationRenewalAdultSteps;
  /**
   * Indicates whether the marital status step should be excluded.
   */
  excludeMaritalStatus?: boolean;
};

export function ProgressStepper({ activeStep, excludeMaritalStatus, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['protected-application-renewal-adult']);

  const steps = useMemo(
    function () {
      return applicationRenewalAdultSteps
        .filter((step) => !excludeMaritalStatus || step !== 'marital-status')
        .map((step) => ({
          id: step,
          label: t(`protected-application-renewal-adult:progress-stepper.${step}`),
        }));
    },
    [excludeMaritalStatus, t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
