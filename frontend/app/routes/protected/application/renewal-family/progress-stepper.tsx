import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationRenewalFamilySteps = ['maritalStatus', 'contactInformation', 'dentalInsurance', 'childrensApplication', 'submit'] as const;
type ApplicationRenewalFamilySteps = (typeof applicationRenewalFamilySteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationRenewalFamilySteps;
  /**
   * Indicates whether the marital status step should be excluded.
   */
  excludeMaritalStatus?: boolean;
};

export function ProgressStepper({ activeStep, excludeMaritalStatus, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['protectedApplicationRenewalFamily']);

  const steps = useMemo(
    function () {
      return applicationRenewalFamilySteps
        .filter((step) => !excludeMaritalStatus || step !== 'maritalStatus')
        .map((step) => ({
          id: step,
          label: t(`protectedApplicationRenewalFamily:progressStepper.${step}`),
        }));
    },
    [excludeMaritalStatus, t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
