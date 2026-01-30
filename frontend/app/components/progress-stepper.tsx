import type { ComponentProps, JSX } from 'react';

import { Stepper } from '~/components/stepper';

type ProgressStepperProps = OmitStrict<ComponentProps<typeof Stepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: string;

  /**
   * The steps to display in the stepper.
   */
  steps: ReadonlyArray<{
    id: string;
    label: string;
  }>;
};

export function ProgressStepper({ activeStep, steps, ...props }: ProgressStepperProps): JSX.Element {
  const activeStepIndex = steps.findIndex(({ id }) => id === activeStep);

  // We pass -1 to the Stepper component to indicate that all steps are completed.
  // Otherwise, we add 1 to the index because the Stepper component uses 1-based indexing.
  const resolvedActiveStepIndex = activeStepIndex === -1 ? activeStepIndex : activeStepIndex + 1;

  return <Stepper steps={steps} activeStep={resolvedActiveStepIndex} {...props} />;
}
