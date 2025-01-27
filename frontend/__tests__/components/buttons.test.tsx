import { fireEvent, render } from '@testing-library/react';

import { createRoutesStub } from 'react-router';

import { describe, expect, it, vi } from 'vitest';

import { Button, ButtonLink } from '~/components/buttons';

describe('Button Component', () => {
  it('renders button with default props', () => {
    const { getByText } = render(<Button>Click me</Button>);
    const button = getByText('Click me');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toEqual('BUTTON');
    expect(button).toHaveClass('cursor-pointer', 'inline-flex', 'items-center', 'justify-center', 'rounded-sm', 'border', 'align-middle', 'font-lato', 'outline-offset-4');
  });

  it('renders button with custom size and variant', () => {
    const { getByText } = render(
      <Button size="lg" variant="primary">
        Click me
      </Button>,
    );
    const button = getByText('Click me');
    expect(button).toHaveClass('px-5', 'py-3', 'text-base', 'bg-slate-700', 'text-white', 'hover:bg-sky-800');
  });

  it('renders disabled button', () => {
    const { getByText } = render(<Button disabled>Click me</Button>);
    const button = getByText('Click me') as HTMLButtonElement;
    expect(button.disabled).toEqual(true);
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:cursor-not-allowed', 'disabled:opacity-70');
  });

  it('renders pill button', () => {
    const { getByText } = render(<Button pill>Click me</Button>);
    const button = getByText('Click me');
    expect(button).toHaveClass('rounded-full');
  });

  it('executes onClick handler', () => {
    const handleClick = vi.fn();
    const { getByText } = render(<Button onClick={handleClick}>Click me</Button>);
    const button = getByText('Click me');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledOnce();
  });
});

describe('ButtonLink Component', () => {
  it('renders link with default props', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <ButtonLink to="/">Click me</ButtonLink>,
        path: '/',
      },
    ]);

    const { getByText } = render(<RoutesStub />);
    const link = getByText('Click me');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toEqual('A');
    expect(link).toHaveClass('cursor-pointer', 'inline-flex', 'items-center', 'justify-center', 'rounded-sm', 'border', 'align-middle', 'font-lato', 'outline-offset-4');
  });

  it('renders link with custom size and variant', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => (
          <ButtonLink size="lg" variant="primary" to="/">
            Click me
          </ButtonLink>
        ),
        path: '/',
      },
    ]);

    const { getByText } = render(<RoutesStub />);
    const link = getByText('Click me');
    expect(link).toHaveClass('px-5', 'py-3', 'text-base', 'bg-slate-700', 'text-white', 'hover:bg-sky-800');
  });

  it('renders pill link', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => (
          <ButtonLink pill to="/">
            Click me
          </ButtonLink>
        ),
        path: '/',
      },
    ]);

    const { getByText } = render(<RoutesStub />);
    const link = getByText('Click me');
    expect(link).toHaveClass('rounded-full');
  });

  it('renders disabled link', () => {
    const { getByText } = render(
      <ButtonLink disabled to="/">
        Click me
      </ButtonLink>,
    );
    const button = getByText('Click me') as HTMLButtonElement;
    expect(button.role).toEqual('link');
    expect(button.ariaDisabled).toEqual('true');
    expect(button).toHaveClass('pointer-events-none', 'cursor-not-allowed', 'opacity-70');
  });
});
