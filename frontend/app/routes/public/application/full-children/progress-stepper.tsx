import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationFullChildrenSteps = ['parentOrGuardian', 'childrensApplication', 'submit'] as const;
type ApplicationFullChildrenSteps = (typeof applicationFullChildrenSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationFullChildrenSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation('applicationFullChild');

  const steps = useMemo(
    function () {
      return applicationFullChildrenSteps.map((step) => ({
        id: step,
        label: t(($) => $.progressStepper[step]),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
