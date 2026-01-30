import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationFullChildrenSteps = ['parent-or-guardian', 'childrens-application', 'submit'] as const;
type ApplicationFullChildrenSteps = (typeof applicationFullChildrenSteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationFullChildrenSteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation(['application-full-child']);

  const steps = useMemo(
    function () {
      return applicationFullChildrenSteps.map((step) => ({
        id: step,
        label: t(`application-full-child:progress-stepper.${step}`),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
