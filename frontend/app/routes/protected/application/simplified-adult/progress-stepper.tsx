import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationSimplifiedAdultSteps = ['marital-status', 'contact-information', 'dental-insurance', 'submit'] as const;
type ApplicationSimplifiedAdultSteps = (typeof applicationSimplifiedAdultSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationSimplifiedAdultSteps;
  /**
   * Indicates whether the marital status step should be excluded.
   */
  excludeMaritalStatus?: boolean;
};

export function ProgressStepper({ activeStep, excludeMaritalStatus, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['protected-application-simplified-adult']);

  const steps = useMemo(
    function () {
      return applicationSimplifiedAdultSteps
        .filter((step) => !excludeMaritalStatus || step !== 'marital-status')
        .map((step) => ({
          id: step,
          label: t(`protected-application-simplified-adult:progress-stepper.${step}`),
        }));
    },
    [excludeMaritalStatus, t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
