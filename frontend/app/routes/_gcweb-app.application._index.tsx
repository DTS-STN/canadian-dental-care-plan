import { ReactNode, useEffect, useState } from 'react';

import { useSearchParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
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
  const currentStep = searchParams.get('title') ?? 'type-of-application';
  const [selectedOption, setSelectedOption] = useState(() => {
    return sessionStorage.getItem('option') ?? '';
  });

  useEffect(() => {
    sessionStorage.setItem('option', selectedOption);
  }, [selectedOption]);

  const options = ['Applying for myself', 'Applying on behalf of someone else'];

  // Placeholder for form fields
  const steps = [
    {
      id: 'type-of-application',
      title: 'Type of application',
      content: (
        <div>
          <InputRadios
            id="type-of-application"
            name="option"
            legend="I am:*"
            options={options.map((option) => ({
              children: option,
              value: option,
              defaultChecked: option === selectedOption,
              onChange: (e) => setSelectedOption(e.target.value),
            }))}
          />
        </div>
      ),
      required: true,
    },
    { id: '2', title: 'Date of birth', content: <div>Date of birth content</div>, required: true },
    { id: '3', title: 'Applicant information', content: <div>Applicant information content</div>, required: true },
    { id: '4', title: 'Review your information', content: <div>Review your information content</div>, required: false },
  ];

  const index = steps.findIndex((step) => step.id === currentStep);

  const handlePrevious = () => {
    setSearchParams({ title: steps[index - 1].id });
  };

  const handleNext = () => {
    setSearchParams({ title: steps[index + 1].id });
  };
  return (
    <>
      <Stepper
        title={steps[index].title}
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
        required={steps[index].required}
        currentStep={index}
        prevPageUrl="/privacy"
      >
        {steps[index].content}
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
          previousProps && currentStep === 0 && prevPageUrl ? (
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
