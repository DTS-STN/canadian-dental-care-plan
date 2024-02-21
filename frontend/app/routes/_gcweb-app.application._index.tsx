import { ReactNode } from 'react';

import { useSearchParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('application-form');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'application-form:title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-00015',
} as const satisfies RouteHandleData;

export default function Application() {
  const { t } = useTranslation(i18nNamespaces);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get('step') ?? '1', 10);

  // Placeholder for form fields
  const steps = [
    { id: '1', title: 'Type of application', content: <div>Type of application content</div>, required: true },
    { id: '2', title: 'Date of birth', content: <div>Date of birth content</div>, required: true },
    { id: '3', title: 'Applicant information', content: <div>Applicant information content</div>, required: true },
    { id: '4', title: 'Review your information', content: <div>Review your information content</div>, required: false },
  ];

  const handlePrevious = () => {
    setSearchParams({ step: Math.max(currentStep - 1, 1).toString() });
  };

  const handleNext = () => {
    setSearchParams({ step: Math.min(currentStep + 1, steps.length).toString() });
  };
  return (
    <>
      <Stepper
        title={steps[currentStep - 1].title}
        previousProps={{
          id: 'prev',
          onClick: handlePrevious,
          text: t('application-form:button.back'),
        }}
        nextProps={{
          id: 'next',
          onClick: handleNext,
          text: t('application-form:button.continue'),
        }}
        required={steps[currentStep - 1].required}
        currentStep={currentStep}
        prevPageUrl="/privacy"
      >
        {steps[currentStep - 1].content}
      </Stepper>
    </>
  );
}

interface StepButtonProps {
  id: string;
  onClick: () => void;
  text: string;
}

interface StepperProps {
  children: ReactNode;
  previousProps?: StepButtonProps;
  nextProps?: StepButtonProps;
  title: string;
  required: boolean;
  prevPageUrl: string;
  currentStep: number;
}

export function Stepper({ children, previousProps, nextProps, title, required, prevPageUrl, currentStep }: StepperProps) {
  const { t } = useTranslation(i18nNamespaces);
  return (
    // TODO: div should be replace by Remix Form once action and form fields are implemented
    <div className="py-24">
      <div className="pb-8">
        <h1 className="text-lg font-bold">{title}</h1>
        {required && <span className="text-xs font-bold text-red-500">*{t('application-form:form.required')}</span>}
      </div>
      {children}
      <div className="mt-12 items-center md:flex">
        {
          // If current step is the first step, clicking on back button should go back to the previous page
          previousProps && currentStep === 1 && prevPageUrl ? (
            <ButtonLink to={prevPageUrl} size="base" variant="alternative" className="my-2 mr-4 w-24 rounded-sm border-2 hover:text-black">
              {previousProps.text}
            </ButtonLink>
          ) : (
            previousProps && (
              <Button id={previousProps.id} onClick={previousProps.onClick} size="base" variant="default" className="my-2 mr-4 w-24 rounded-sm border-2 border-gray-500 px-8 hover:text-black">
                {previousProps.text}
              </Button>
            )
          )
        }
        {nextProps && (
          <Button onClick={nextProps.onClick} size="base" variant="default" className="my-2 w-24 rounded-sm border-2 border-gray-500 bg-gray-500 text-white hover:text-black">
            {nextProps.text}
          </Button>
        )}
      </div>
    </div>
  );
}
