/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';

import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { describe, expect, it, vi } from 'vitest';

import { LoadingButton } from '~/components/loading-button';

vi.mock('~/components/button-icons', () => ({
  ButtonStartIcon: (props: any) => (
    <div data-testid="button-start-icon">
      <i className={`fa ${props.icon.iconName}`} data-testid="font-awesome-icon"></i>
    </div>
  ),
  ButtonEndIcon: (props: any) => (
    <div data-testid="button-end-icon">
      <i className={`fa ${props.icon.iconName}`} data-testid="font-awesome-icon"></i>
    </div>
  ),
}));

vi.mock('~/components/buttons', () => ({
  Button: (props: any) => <button {...props} />,
}));

describe('LoadingButton', () => {
  it('renders the children correctly', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders the loading spinner at the start position', () => {
    render(
      <LoadingButton loading loadingPosition="start">
        Click me
      </LoadingButton>,
    );
    const startIcon = screen.getByTestId('button-start-icon');
    expect(startIcon.querySelector('.fa')).toHaveClass('fa spinner');
  });

  it('renders the loading spinner at the end position', () => {
    render(
      <LoadingButton loading loadingPosition="end">
        Click me
      </LoadingButton>,
    );
    const endIcon = screen.getByTestId('button-end-icon');
    expect(endIcon.querySelector('.fa')).toHaveClass('fa spinner');
  });

  it('renders the custom loading icon', () => {
    render(
      <LoadingButton loading loadingIcon={faCheck}>
        Click me
      </LoadingButton>,
    );
    const endIcon = screen.getByTestId('button-end-icon');
    expect(endIcon.querySelector('.fa')).toHaveClass('fa check');
  });

  it('disables the button when loading is true', () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables the button when disabled is true', () => {
    render(<LoadingButton disabled>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders the start icon when not loading', () => {
    render(<LoadingButton startIcon={faCheck}>Click me</LoadingButton>);
    const startIcon = screen.getByTestId('button-start-icon');
    expect(startIcon.querySelector('.fa')).toHaveClass('fa check');
  });

  it('renders the end icon when not loading', () => {
    render(<LoadingButton endIcon={faCheck}>Click me</LoadingButton>);
    const endIcon = screen.getByTestId('button-end-icon');
    expect(endIcon.querySelector('.fa')).toHaveClass('fa check');
  });
});
