import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationSimplifiedChildrenSteps = ['parentOrGuardian', 'childrensApplication', 'submit'] as const;
type ApplicationSimplifiedChildrenSteps = (typeof applicationSimplifiedChildrenSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  activeStep: ApplicationSimplifiedChildrenSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation('applicationSimplifiedChild');

  const steps = useMemo(
    function () {
      return applicationSimplifiedChildrenSteps.map((step) => ({
        id: step,
        label: t(($) => $.progressStepper[step]),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
