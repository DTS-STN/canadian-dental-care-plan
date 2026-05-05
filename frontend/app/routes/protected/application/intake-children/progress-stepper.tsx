import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationIntakeChildrenSteps = ['parentOrGuardian', 'childrensApplication', 'submit'] as const;
type ApplicationIntakeChildrenSteps = (typeof applicationIntakeChildrenSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationIntakeChildrenSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['protected-application-intake-child']);

  const steps = useMemo(
    function () {
      return applicationIntakeChildrenSteps.map((step) => ({
        id: step,
        label: t(`protected-application-intake-child:progressStepper.${step}`),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
