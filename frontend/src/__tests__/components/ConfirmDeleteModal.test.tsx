import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const defaultProps = {
  jobName: 'my-job',
  onClose: vi.fn(),
  onConfirm: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderModal(overrides?: Partial<typeof defaultProps>) {
  return render(<ConfirmDeleteModal {...defaultProps} {...overrides} />);
}

describe('ConfirmDeleteModal', () => {
  it('displays the job name in the confirmation message', () => {
    renderModal();
    expect(screen.getByText(/my-job/)).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when Delete is clicked', async () => {
    const user = userEvent.setup();
    defaultProps.onConfirm.mockResolvedValue(undefined);
    renderModal();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1));
  });

  it('shows Deleting… while onConfirm is in progress', async () => {
    const user = userEvent.setup();
    let resolve: () => void;
    const onConfirm = vi.fn().mockReturnValue(new Promise<void>((r) => { resolve = r; }));

    renderModal({ onConfirm });
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    resolve!();
    // Await settlement so state updates don't leak into teardown
    await waitFor(() => expect(screen.queryByRole('button', { name: /deleting/i })).toBeNull());
  });
});
