// Dropdown Menu (manual installation)
// Displays a menu to the user — such as a set of actions or functions — triggered by a button.
// https://ui.shadcn.com/docs/components/dropdown-menu#installation
import * as React from 'react';

import { faCircle } from '@fortawesome/free-regular-svg-icons';
import { faCheck, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger ref={ref} className={clsx('flex cursor-default items-center rounded-sm px-2 py-1.5 outline-hidden select-none focus:bg-zinc-100 data-[state=open]:bg-zinc-100', inset && 'pl-8', className)} {...props}>
    {children}
    <FontAwesomeIcon icon={faChevronRight} className="ml-auto size-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={clsx(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-black/[.87] shadow-lg',
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<React.ComponentRef<typeof DropdownMenuPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={clsx(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-black/[.87] shadow-md',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={clsx('relative flex cursor-default items-center rounded-sm px-2 py-1.5 outline-hidden transition-colors select-none focus:bg-zinc-100 focus:text-black data-disabled:pointer-events-none data-disabled:opacity-50', inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={clsx('relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 outline-hidden transition-colors select-none focus:bg-zinc-100 focus:text-black data-disabled:pointer-events-none data-disabled:opacity-50', className)}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <FontAwesomeIcon icon={faCheck} className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={clsx('relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 outline-hidden transition-colors select-none focus:bg-zinc-100 focus:text-black data-disabled:pointer-events-none data-disabled:opacity-50', className)}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <FontAwesomeIcon icon={faCircle} className="size-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => <DropdownMenuPrimitive.Label ref={ref} className={clsx('px-2 py-1.5 font-semibold', inset && 'pl-8', className)} {...props} />);
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<React.ComponentRef<typeof DropdownMenuPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={clsx('-mx-1 my-1 h-px bg-slate-100', className)} {...props} />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={clsx('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />;
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
