import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import JobDetail from '../../pages/JobDetail';
import type { JobWithHistory } from '../../types/job';

// --- Mocks ---

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../hooks/useJobDetail', () => ({
  useJobDetail: vi.fn(),
}));

vi.mock('../../api/jobs', () => ({
  updateJobStatus: vi.fn(),
  deleteJob: vi.fn(),
}));

import { useJobDetail } from '../../hooks/useJobDetail';
import { updateJobStatus, deleteJob } from '../../api/jobs';
const mockUseJobDetail = vi.mocked(useJobDetail);
const mockUpdateJobStatus = vi.mocked(updateJobStatus);
const mockDeleteJob = vi.mocked(deleteJob);

// --- Fixtures ---

const mockJob: JobWithHistory = {
  id: 1,
  name: 'my-test-job',
  current_status: 'RUNNING',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T01:00:00Z',
  status_history: [
    { id: 2, status_type: 'RUNNING', timestamp: '2026-01-01T01:00:00Z' },
    { id: 1, status_type: 'PENDING', timestamp: '2026-01-01T00:00:00Z' },
  ],
};

const mockRefetch = vi.fn();

function makeHookResult(overrides?: Partial<ReturnType<typeof useJobDetail>>) {
  return {
    job: mockJob,
    loading: false,
    error: null,
    refetch: mockRefetch,
    ...overrides,
  };
}

// --- Helpers ---

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/jobs/1']}>
      <Routes>
        <Route path="/jobs/:id" element={<JobDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseJobDetail.mockReturnValue(makeHookResult());
});

// --- Tests ---

describe('JobDetail — loading and error states', () => {
  it('shows a loading indicator while fetching', () => {
    mockUseJobDetail.mockReturnValue(makeHookResult({ job: null, loading: true }));
    renderPage();
    expect(screen.getByText(/loading…/i)).toBeInTheDocument();
  });

  it('shows an error message when fetch fails', () => {
    mockUseJobDetail.mockReturnValue(makeHookResult({ job: null, loading: false, error: 'Not found' }));
    renderPage();
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('does not render job content while loading', () => {
    mockUseJobDetail.mockReturnValue(makeHookResult({ job: null, loading: true }));
    renderPage();
    expect(screen.queryByText('my-test-job')).not.toBeInTheDocument();
  });
});

describe('JobDetail — job header', () => {
  it('renders the job name', () => {
    renderPage();
    expect(screen.getByText('my-test-job')).toBeInTheDocument();
  });

  it('renders the current status badge', () => {
    renderPage();
    // The badge in the header (not a button)
    const badge = screen.getAllByText('Running')[0];
    expect(badge).toBeInTheDocument();
  });

  it('renders a back link to the jobs list', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /back to jobs/i })).toHaveAttribute('href', '/jobs');
  });

  it('renders created and updated timestamps', () => {
    renderPage();
    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });
});

describe('JobDetail — status selector', () => {
  it('renders all four status buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /running/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /failed/i })).toBeInTheDocument();
  });

  it('disables the current status button', () => {
    renderPage();
    // RUNNING is the current status — find the disabled one among Running buttons
    const runningButtons = screen.getAllByRole('button', { name: /running/i });
    const disabledRunning = runningButtons.find((b) => b.hasAttribute('disabled'));
    expect(disabledRunning).toBeInTheDocument();
  });

  it('calls updateJobStatus when a non-current status is clicked', async () => {
    const user = userEvent.setup();
    mockUpdateJobStatus.mockResolvedValue({ ...mockJob, current_status: 'COMPLETED' });
    renderPage();

    await user.click(screen.getByRole('button', { name: /completed/i }));

    await waitFor(() =>
      expect(mockUpdateJobStatus).toHaveBeenCalledWith(1, 'COMPLETED'),
    );
  });

  it('calls refetch after a status change', async () => {
    const user = userEvent.setup();
    mockUpdateJobStatus.mockResolvedValue({ ...mockJob, current_status: 'COMPLETED' });
    renderPage();

    await user.click(screen.getByRole('button', { name: /completed/i }));

    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });
});

describe('JobDetail — status history', () => {
  it('renders the Status History section', () => {
    renderPage();
    expect(screen.getByText('Status History')).toBeInTheDocument();
  });

  it('shows history entries from the job', () => {
    renderPage();
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
  });

  it('shows the correct event count', () => {
    renderPage();
    expect(screen.getByText('2 events')).toBeInTheDocument();
  });
});

describe('JobDetail — delete', () => {
  it('renders the Delete Job button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /delete job/i })).toBeInTheDocument();
  });

  it('opens the confirmation modal when Delete Job is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /delete job/i }));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /delete job/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it('calls deleteJob with the job id when deletion is confirmed', async () => {
    const user = userEvent.setup();
    mockDeleteJob.mockResolvedValue(undefined);
    renderPage();

    await user.click(screen.getByRole('button', { name: /delete job/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(mockDeleteJob).toHaveBeenCalledWith(1));
  });

  it('navigates to /jobs after successful deletion', async () => {
    const user = userEvent.setup();
    mockDeleteJob.mockResolvedValue(undefined);
    renderPage();

    await user.click(screen.getByRole('button', { name: /delete job/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/jobs'));
  });

  it('shows the job name in the confirmation modal', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /delete job/i }));
    expect(screen.getAllByText('my-test-job').length).toBeGreaterThan(0);
  });
});
