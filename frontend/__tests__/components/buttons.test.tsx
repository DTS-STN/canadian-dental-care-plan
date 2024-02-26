import { fireEvent, render } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { describe, expect, it, vi } from 'vitest';

import { Button, ButtonLink } from '~/components/buttons';

describe('Button Component', () => {
  it('renders button with default props', () => {
    const { getByText } = render(<Button>Click me</Button>);
    const button = getByText('Click me');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toEqual('BUTTON');
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center', 'rounded', 'align-middle', 'font-lato', 'outline-offset-2');
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
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('ButtonLink Component', () => {
  it('renders link with default props', () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <ButtonLink to="/">Click me</ButtonLink>,
        path: '/',
      },
    ]);

    const { getByText } = render(<RemixStub />);
    const link = getByText('Click me');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toEqual('A');
    expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center', 'rounded', 'align-middle', 'font-lato', 'outline-offset-2');
  });

  it('renders link with custom size and variant', () => {
    const RemixStub = createRemixStub([
      {
        Component: () => (
          <ButtonLink size="lg" variant="primary" to="/">
            Click me
          </ButtonLink>
        ),
        path: '/',
      },
    ]);

    const { getByText } = render(<RemixStub />);
    const link = getByText('Click me');
    expect(link).toHaveClass('px-5', 'py-3', 'text-base', 'bg-slate-700', 'text-white', 'hover:bg-sky-800');
  });

  it('renders pill link', () => {
    const RemixStub = createRemixStub([
      {
        Component: () => (
          <ButtonLink pill to="/">
            Click me
          </ButtonLink>
        ),
        path: '/',
      },
    ]);

    const { getByText } = render(<RemixStub />);
    const link = getByText('Click me');
    expect(link).toHaveClass('rounded-full');
  });
});
