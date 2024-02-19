import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A function that allows the conditional classnames from 'clsx' or 'classnames' to be passed into 'tailwind-merge'.
 *
 * Combining clsx or classnames with tailwind-merge allows us to conditionally join Tailwind CSS classes in classNames
 * together without style conflicts. Inspired by [shadcn/ui](https://ui.shadcn.com/).
 *
 * @param inputs - Class names or objects representing class names to be merged.
 * @returns The merged class names.
 */
export function cn(...args: ClassValue[]) {
  return twMerge(clsx(args));
}
