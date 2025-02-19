import { render, renderHook, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorSummary, createErrorSummaryItem, createErrorSummaryItems, hasErrors, useErrorSummary } from '~/components/error-summary';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('~/utils/link-utils', () => ({
  scrollAndFocusFromAnchorLink: vi.fn(),
}));

vi.mock('~/utils/adobe-analytics.client.ts', () => ({
  isConfigured: vi.fn().mockReturnValue(false),
}));

describe('ErrorSummary', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('createErrorSummaryItem should create a valid ErrorSummaryItem', () => {
    const item = createErrorSummaryItem('field1', 'Error message');
    expect(item).toEqual({ fieldId: 'field1', errorMessage: 'Error message' });
  });

  it('createErrorSummaryItems should create an array of ErrorSummaryItems', () => {
    const obj = {
      field1: 'Error 1',
      field2: 'Error 2',
      field3: undefined,
    };
    const items = createErrorSummaryItems(obj);
    expect(items).toEqual([
      { fieldId: 'field1', errorMessage: 'Error 1' },
      { fieldId: 'field2', errorMessage: 'Error 2' },
    ]);
  });

  it('hasErrors should return true when errors exist', () => {
    const obj = {
      field1: 'Error 1',
      field2: undefined,
    };
    expect(hasErrors(obj)).toBe(true);
  });

  it('hasErrors should return false when no errors exist', () => {
    const obj = {
      field1: undefined,
      field2: undefined,
    };
    expect(hasErrors(obj)).toBe(false);
  });
});

describe('ErrorSummary component', () => {
  it('renders error summary with correct number of errors', () => {
    const errors = [
      { fieldId: 'field1', errorMessage: 'Error 1' },
      { fieldId: 'field2', errorMessage: 'Error 2' },
    ];
    render(<ErrorSummary errors={errors} id="error-summary" />);

    expect(screen.getByText('gcweb:error-summary.header')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders no errors when errors array is empty', () => {
    render(<ErrorSummary errors={[]} id="error-summary" />);

    expect(screen.getByText('gcweb:error-summary.header')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});

describe('useErrorSummary hook', () => {
  it('should return error summary items and component when errors exist', () => {
    const errors = {
      field1: 'Error 1',
      field2: 'Error 2',
    };
    const errorFieldMap = {
      field1: 'fieldId1',
      field2: 'fieldId2',
    };

    const { result } = renderHook(() => useErrorSummary(errors, errorFieldMap));

    expect(result.current.errorSummaryItems).toEqual([
      { fieldId: 'fieldId1', errorMessage: 'Error 1' },
      { fieldId: 'fieldId2', errorMessage: 'Error 2' },
    ]);
    expect(result.current.ErrorSummary).toBeDefined();
  });

  it('should return empty error summary items when no errors exist', () => {
    const errors = {
      field1: undefined,
      field2: undefined,
    };
    const errorFieldMap = {
      field1: 'fieldId1',
      field2: 'fieldId2',
    };

    const { result } = renderHook(() => useErrorSummary(errors, errorFieldMap));

    expect(result.current.errorSummaryItems).toEqual([]);
  });
});
