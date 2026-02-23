import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationSimplifiedChildrenSteps = ['parent-or-guardian', 'childrens-application', 'submit'] as const;
type ApplicationSimplifiedChildrenSteps = (typeof applicationSimplifiedChildrenSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  activeStep: ApplicationSimplifiedChildrenSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['protected-application-renewal-child']);

  const steps = useMemo(
    function () {
      return applicationSimplifiedChildrenSteps.map((step) => ({
        id: step,
        label: t(`protected-application-renewal-child:progress-stepper.${step}`),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
