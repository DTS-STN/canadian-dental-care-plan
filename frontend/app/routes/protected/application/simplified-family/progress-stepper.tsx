import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationSimplifiedFamilySteps = ['contact-information', 'dental-insurance', 'childrens-application', 'submit'] as const;
type ApplicationSimplifiedFamilySteps = (typeof applicationSimplifiedFamilySteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationSimplifiedFamilySteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['protected-application-simplified-family']);

  const steps = useMemo(
    function () {
      return applicationSimplifiedFamilySteps.map((step) => ({
        id: step,
        label: t(`protected-application-simplified-family:progress-stepper.${step}`),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
