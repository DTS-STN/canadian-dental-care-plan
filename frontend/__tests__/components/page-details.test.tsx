import { render } from '@testing-library/react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageDetails } from '~/components/page-details';
import { getClientEnv } from '~/utils/env-utils';
import { usePageIdentifier } from '~/utils/route-utils';

vi.mock('~/utils/env-utils');
vi.mock('~/utils/route-utils');

describe('PageDetails', () => {
  beforeEach(() => {
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({
      BUILD_DATE: '2024-03-11T00:00:00Z',
      BUILD_VERSION: '1.0.0',
    });

    vi.mocked(usePageIdentifier).mockReturnValue('page123');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PageDetails />);
  });

  it('displays page identifier if available', () => {
    const { getByText } = render(<PageDetails />);
    expect(getByText('gcweb:page-details.screen-id')).toBeInTheDocument();
    expect(getByText('page123')).toBeInTheDocument();
  });

  it('displays build date if available', () => {
    const { getByText } = render(<PageDetails />);
    expect(getByText('gcweb:page-details.date-modfied')).toBeInTheDocument();
    expect(getByText('2024-03-11')).toBeInTheDocument();
  });

  it('displays build version if available', () => {
    const { getByText } = render(<PageDetails />);
    expect(getByText('gcweb:page-details.version')).toBeInTheDocument();
    expect(getByText('1.0.0')).toBeInTheDocument();
  });

  it('does not display page identifier if not available', () => {
    vi.mocked(usePageIdentifier).mockReturnValueOnce('');
    const { queryByText } = render(<PageDetails />);
    expect(queryByText('gcweb:page-details.screen-id')).not.toBeInTheDocument();
  });

  it('does not display build date if not available', () => {
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({});
    const { queryByText } = render(<PageDetails />);
    expect(queryByText('gcweb:page-details.date-modfied')).not.toBeInTheDocument();
  });

  it('does not display build version if not available', () => {
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({ BUILD_VERSION: '' });
    const { queryByText } = render(<PageDetails />);
    expect(queryByText('gcweb:page-details.version')).not.toBeInTheDocument();
  });
});
