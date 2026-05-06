import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationRenewalAdultSteps = ['maritalStatus', 'contactInformation', 'dentalInsurance', 'submit'] as const;
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
  const { t } = useTranslation('protectedApplicationRenewalAdult');

  const steps = useMemo(
    function () {
      return applicationRenewalAdultSteps
        .filter((step) => !excludeMaritalStatus || step !== 'maritalStatus')
        .map((step) => ({
          id: step,
          label: t(($) => $.progressStepper[step]),
        }));
    },
    [excludeMaritalStatus, t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
