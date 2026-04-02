import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import JobPreview from '../../components/JobPreview';
import type { Job } from '../../types/job';

const mockJob: Job = {
  id: 42,
  name: 'my-job',
  current_status: 'PENDING',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const defaultProps = {
  job: mockJob,
  onStatusChange: vi.fn(),
  onDelete: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPreview(overrides?: Partial<typeof defaultProps>) {
  return render(
    <MemoryRouter>
      <JobPreview {...defaultProps} {...overrides} />
    </MemoryRouter>,
  );
}

describe('JobPreview', () => {
  it('renders job name and status badge', () => {
    renderPreview();
    expect(screen.getByText('my-job')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('does not show the expanded panel initially', () => {
    renderPreview();
    expect(screen.queryByText('Running')).not.toBeInTheDocument();
  });

  it('expands when the row is clicked', async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByText('my-job'));
    // All four status options appear in the expanded panel
    expect(screen.getByRole('button', { name: /running/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /failed/i })).toBeInTheDocument();
  });

  it('collapses when the row is clicked again', async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByText('my-job'));
    await user.click(screen.getByText('my-job'));
    expect(screen.queryByRole('button', { name: /running/i })).not.toBeInTheDocument();
  });

  it('calls onStatusChange when a non-current status is clicked', async () => {
    const user = userEvent.setup();
    defaultProps.onStatusChange.mockResolvedValue(undefined);
    renderPreview();
    await user.click(screen.getByText('my-job'));
    await user.click(screen.getByRole('button', { name: /running/i }));
    await waitFor(() =>
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(42, 'RUNNING'),
    );
  });

  it('does not call onStatusChange when the current status is clicked', async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByText('my-job'));
    // PENDING is the current status — button is disabled
    const pendingButtons = screen.getAllByRole('button', { name: /pending/i });
    // find the one inside the expanded panel (disabled)
    const disabledPending = pendingButtons.find((b) => b.hasAttribute('disabled'));
    expect(disabledPending).toBeInTheDocument();
    expect(defaultProps.onStatusChange).not.toHaveBeenCalled();
  });

  it('shows the delete confirmation modal when Delete is clicked', async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByText('my-job'));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('dismisses the delete modal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByText('my-job'));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', async () => {
    const user = userEvent.setup();
    defaultProps.onDelete.mockResolvedValue(undefined);
    renderPreview();
    await user.click(screen.getByText('my-job'));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    // Scope to the modal to avoid ambiguity with the row's Delete button
    const modal = screen.getByText(/are you sure/i).closest('div[class*="fixed"]') as HTMLElement;
    await user.click(within(modal).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(defaultProps.onDelete).toHaveBeenCalledWith(42));
  });

  it('renders a View job details link', () => {
    renderPreview();
    expect(screen.getByRole('link', { name: /view job details/i })).toHaveAttribute('href', '/jobs/42');
  });
});
