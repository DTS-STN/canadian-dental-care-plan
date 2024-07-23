import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { describe, expect, it } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/dropdown-menu';

describe('DropdownMenu', () => {
  it('renders DropdownMenuTrigger and opens DropdownMenuContent on click', async () => {
    render(
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <span>Item 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <span>Item 2</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const user = userEvent.setup();
    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    expect(screen.getByText('Item 1')).toBeVisible();
    expect(screen.getByText('Item 2')).toBeVisible();
  });

  it('renders DropdownMenuCheckboxItem with checked state', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Checked Item 1</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Checked Item 2</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const user = userEvent.setup();
    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const checkedItem = screen.getByText('Checked Item 1');
    expect(checkedItem).toBeInTheDocument();
    expect(checkedItem).toHaveAttribute('data-state', 'checked');

    const uncheckedItem = screen.getByText('Checked Item 2');
    expect(uncheckedItem).toBeInTheDocument();
    expect(uncheckedItem).toHaveAttribute('data-state', 'unchecked');
  });

  it('renders DropdownMenuRadioItem', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="item-1">Item 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="item-2">Item 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const user = userEvent.setup();
    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders DropdownMenuLabel and DropdownMenuSeparator', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const user = userEvent.setup();
    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('renders DropdownMenuSub with nested items', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Sub Menu</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const user = userEvent.setup();
    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const subTrigger = screen.getByText('Sub Menu');
    await user.click(subTrigger);

    expect(screen.getByText('Sub Item 1')).toBeInTheDocument();
    expect(screen.getByText('Sub Item 2')).toBeInTheDocument();
  });
});
