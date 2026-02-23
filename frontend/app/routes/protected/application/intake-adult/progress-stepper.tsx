import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationIntakeAdultSteps = ['marital-status', 'contact-information', 'dental-insurance', 'submit'] as const;
type ApplicationIntakeAdultSteps = (typeof applicationIntakeAdultSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationIntakeAdultSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['protected-application-intake-adult']);

  const steps = useMemo(
    function () {
      return applicationIntakeAdultSteps.map((step) => ({
        id: step,
        label: t(`protected-application-intake-adult:progress-stepper.${step}`),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
