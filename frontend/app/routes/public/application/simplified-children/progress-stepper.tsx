import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { Stepper } from '~/components/stepper';

const applicationSimplifiedChildrenSteps = ['parent-or-guardian', 'childrens-application', 'submit'] as const;
type ApplicationSimplifiedChildrenSteps = (typeof applicationSimplifiedChildrenSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof Stepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   * Use 'confirmation' to indicate that all steps are completed.
   */
  activeStep: ApplicationSimplifiedChildrenSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['application-simplified-child']);

  const activeStepIndex = applicationSimplifiedChildrenSteps.indexOf(activeStep);

  // We pass -1 to the Stepper component to indicate that all steps are completed.
  // Otherwise, we add 1 to the index because the Stepper component uses 1-based indexing.
  const resolvedActiveStepIndex = activeStepIndex === -1 ? activeStepIndex : activeStepIndex + 1;

  const steps = useMemo(
    function () {
      return applicationSimplifiedChildrenSteps.map((step) => ({
        id: step,
        label: t(`application-simplified-child:progress-stepper.${step}`),
      }));
    },
    [t],
  );

  return <Stepper steps={steps} activeStep={resolvedActiveStepIndex} {...props} />;
}
