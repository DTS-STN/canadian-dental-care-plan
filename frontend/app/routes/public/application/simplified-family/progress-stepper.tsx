import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ProgressStepper as ReusableProgressStepper } from '~/components/progress-stepper';

const applicationSimplifiedFamilySteps = ['contactInformation', 'dentalInsurance', 'childrensApplication', 'submit'] as const;
type ApplicationSimplifiedFamilySteps = (typeof applicationSimplifiedFamilySteps)[number];

type ProgressStepperProps = OmitStrict<ComponentProps<typeof ReusableProgressStepper>, 'activeStep' | 'steps'> & {
  /**
   * The active step of the application.
   */
  activeStep: ApplicationSimplifiedFamilySteps;
};

export function ProgressStepper({ activeStep, ...props }: ProgressStepperProps): JSX.Element {
  const { t } = useTranslation('applicationSimplifiedFamily');

  const steps = useMemo(
    function () {
      return applicationSimplifiedFamilySteps.map((step) => ({
        id: step,
        label: t(($) => $.progressStepper[step]),
      }));
    },
    [t],
  );

  return <ReusableProgressStepper steps={steps} activeStep={activeStep} {...props} />;
}
