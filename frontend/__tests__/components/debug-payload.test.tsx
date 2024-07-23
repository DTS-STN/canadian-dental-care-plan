import { fireEvent, render, screen } from '@testing-library/react';

import { faClipboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DebugPayload } from '~/components/debug-payload';

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: vi.fn(() => null),
}));

describe('DebugPayload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  it('renders JSON data correctly', () => {
    const data = { key: 'value' };
    render(<DebugPayload data={data} enableCopy={false} />);

    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();
  });

  it('does not render copy button when enableCopy is false', () => {
    render(<DebugPayload data={{ key: 'value' }} enableCopy={false} />);

    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });

  it('renders copy button when enableCopy is true', () => {
    render(<DebugPayload data={{ key: 'value' }} enableCopy={true} />);

    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('copies JSON data to clipboard when copy button is clicked', () => {
    const data = { key: 'value' };
    render(<DebugPayload data={data} enableCopy={true} />);

    fireEvent.click(screen.getByText('Copy'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
  });

  it('resets hasCopied state after 2 seconds', () => {
    render(<DebugPayload data={{ key: 'value' }} enableCopy={true} />);

    fireEvent.click(screen.getByText('Copy'));

    vi.advanceTimersByTime(2000);

    expect(FontAwesomeIcon).toHaveBeenCalledWith(expect.objectContaining({ icon: faClipboard }), {});
  });
});
