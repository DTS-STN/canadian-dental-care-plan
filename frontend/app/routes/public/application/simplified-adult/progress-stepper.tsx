import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationSimplifiedAdultSteps = ['contactInformation', 'dentalInsurance', 'submit'] as const;
type ApplicationSimplifiedAdultSteps = (typeof applicationSimplifiedAdultSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationSimplifiedAdultSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['applicationSimplifiedAdult']);

  const steps = useMemo(
    function () {
      return applicationSimplifiedAdultSteps.map((step) => ({
        id: step,
        label: t(`applicationSimplifiedAdult:progressStepper.${step}`),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
