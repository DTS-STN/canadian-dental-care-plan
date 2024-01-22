import { render, screen, waitFor } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { PhoneNumber } from '~/components/phone-number';

describe('<PhoneNumber />', () => {
  it('Renders component with phone number', async () => {
    render(<PhoneNumber phoneNumber="1234567890" />);
    const element: HTMLInputElement = await screen.findByTestId('phoneNumber');
    expect(element.value).toBe('1234567890');
  });

  it('Renders component with previous phone number', async () => {
    render(<PhoneNumber phoneNumber="1234567890" previousPhoneNumber="0987654321" />);
    const phoneNumberElement: HTMLInputElement = await waitFor(() => screen.findByTestId('phoneNumber'));
    expect(phoneNumberElement.value).toBe('1234567890');
    const previousPhoneNumberElement: HTMLInputElement = await screen.findByTestId('previousPhoneNumber');
    expect(previousPhoneNumberElement.value).toBe('0987654321');
  });

  it('Renders component in edit mode', async () => {
    render(<PhoneNumber phoneNumber="1234567890" editMode />);
    const requiredLabel = await waitFor(() => screen.getAllByLabelText(/required/));
    expect(requiredLabel).toBeDefined();
    const element: HTMLInputElement = await screen.findByTestId('phoneNumber');
    expect(element.disabled).toBe(false);
  });

  it('Renders component with field errors', async () => {
    render(<PhoneNumber phoneNumber="1234567890" editMode fieldErrors={['testing-1-2-3', 'additional-error']} />);
    let err = [...(document.querySelectorAll('.wb-server-error') || [])];
    let fieldErrors = err?.map((x) => x.querySelector('.mrgn-lft-sm')?.textContent);
    expect(fieldErrors).toStrictEqual(['testing-1-2-3', 'additional-error']);
  });
});
