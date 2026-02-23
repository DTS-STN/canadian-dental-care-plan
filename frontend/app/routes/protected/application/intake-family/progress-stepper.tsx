import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationIntakeFamilySteps = ['marital-status', 'contact-information', 'dental-insurance', 'childrens-application', 'submit'] as const;
type ApplicationIntakeFamilySteps = (typeof applicationIntakeFamilySteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationIntakeFamilySteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['protected-application-intake-family']);

  const steps = useMemo(
    function () {
      return applicationIntakeFamilySteps.map((step) => ({
        id: step,
        label: t(`protected-application-intake-family:progress-stepper.${step}`),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
