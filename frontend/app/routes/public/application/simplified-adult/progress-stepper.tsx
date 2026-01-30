import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { Stepper } from '~/components/stepper';

const applicationSimplifiedAdultSteps = ['contact-information', 'dental-insurance', 'submit'] as const;
type ApplicationSimplifiedAdultSteps = (typeof applicationSimplifiedAdultSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof Stepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationSimplifiedAdultSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['application-simplified-adult']);

  const activeStepIndex = applicationSimplifiedAdultSteps.indexOf(activeStep);

  // We pass -1 to the Stepper component to indicate that all steps are completed.
  // Otherwise, we add 1 to the index because the Stepper component uses 1-based indexing.
  const resolvedActiveStepIndex = activeStepIndex === -1 ? activeStepIndex : activeStepIndex + 1;

  const steps = useMemo(
    function () {
      return applicationSimplifiedAdultSteps.map((step) => ({
        id: step,
        label: t(`application-simplified-adult:progress-stepper.${step}`),
      }));
    },
    [t],
  );

  return <Stepper steps={steps} activeStep={resolvedActiveStepIndex} {...props} />;
}
