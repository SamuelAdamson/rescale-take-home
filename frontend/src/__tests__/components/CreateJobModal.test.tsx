import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateJobModal from '../../components/CreateJobModal';
import type { Job } from '../../types/job';

vi.mock('../../api/jobs', () => ({
  createJob: vi.fn(),
}));

import { createJob } from '../../api/jobs';
const mockCreateJob = vi.mocked(createJob);

const defaultProps = {
  onClose: vi.fn(),
  onCreated: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderModal() {
  return render(<CreateJobModal {...defaultProps} />);
}

describe('CreateJobModal', () => {
  it('renders the form with job name input', () => {
    renderModal();
    expect(screen.getByLabelText(/job name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create job/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  describe('validation', () => {
    it('shows required error when submitting empty name', async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole('button', { name: /create job/i }));
      expect(screen.getByText('Job name is required.')).toBeInTheDocument();
      expect(mockCreateJob).not.toHaveBeenCalled();
    });

    it('shows required error for whitespace-only name', async () => {
      const user = userEvent.setup();
      renderModal();
      await user.type(screen.getByLabelText(/job name/i), '   ');
      await user.click(screen.getByRole('button', { name: /create job/i }));
      expect(screen.getByText('Job name is required.')).toBeInTheDocument();
      expect(mockCreateJob).not.toHaveBeenCalled();
    });

    it('shows error when name contains spaces', async () => {
      const user = userEvent.setup();
      renderModal();
      await user.type(screen.getByLabelText(/job name/i), 'has spaces');
      await user.click(screen.getByRole('button', { name: /create job/i }));
      expect(screen.getByText('Job name must not contain spaces.')).toBeInTheDocument();
      expect(mockCreateJob).not.toHaveBeenCalled();
    });

    it('shows error when name exceeds 255 characters', async () => {
      const user = userEvent.setup();
      renderModal();
      await user.type(screen.getByLabelText(/job name/i), 'a'.repeat(256));
      await user.click(screen.getByRole('button', { name: /create job/i }));
      expect(screen.getByText(/255 characters or fewer/i)).toBeInTheDocument();
      expect(mockCreateJob).not.toHaveBeenCalled();
    });
  });

  describe('successful submission', () => {
    it('calls createJob with trimmed name and invokes callbacks', async () => {
      const user = userEvent.setup();
      mockCreateJob.mockResolvedValue({
        id: 1,
        name: 'my-job',
        current_status: 'PENDING',
        created_at: '',
        updated_at: '',
      });

      renderModal();
      await user.type(screen.getByLabelText(/job name/i), 'my-job');
      await user.click(screen.getByRole('button', { name: /create job/i }));

      await waitFor(() => expect(mockCreateJob).toHaveBeenCalledWith('my-job'));
      expect(defaultProps.onCreated).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('shows Creating… while submitting', async () => {
      const user = userEvent.setup();
      let resolve!: () => void;
      mockCreateJob.mockReturnValue(new Promise<Job>((r) => { resolve = () => r({} as Job); }));

      renderModal();
      await user.type(screen.getByLabelText(/job name/i), 'my-job');
      await user.click(screen.getByRole('button', { name: /create job/i }));

      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument();
      resolve!();
      // Await settlement so state updates don't leak into teardown
      await waitFor(() => expect(screen.queryByRole('button', { name: /creating/i })).toBeNull());
    });
  });

  describe('failed submission', () => {
    it('shows API error message on failure', async () => {
      const user = userEvent.setup();
      mockCreateJob.mockRejectedValue(new Error('Server error'));

      renderModal();
      await user.type(screen.getByLabelText(/job name/i), 'my-job');
      await user.click(screen.getByRole('button', { name: /create job/i }));

      await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });
});
