import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import JobList from '../../components/JobList';
import type { Job } from '../../types/job';

function makeJob(id: number): Job {
  return {
    id,
    name: `job-${id}`,
    current_status: 'PENDING',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

const defaultProps = {
  total: 0,
  loading: false,
  currentPage: 1,
  pageSize: 10 as const,
  onPageChange: vi.fn(),
  onClientPageSizeChange: vi.fn(),
  onStatusChange: vi.fn(),
  onDelete: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderList(jobs: Job[], overrides?: Partial<typeof defaultProps>) {
  const props = { ...defaultProps, total: jobs.length, ...overrides };
  return render(
    <MemoryRouter>
      <JobList jobs={jobs} {...props} />
    </MemoryRouter>,
  );
}

describe('JobList', () => {
  it('shows empty state when no jobs', () => {
    renderList([]);
    expect(screen.getByText('No jobs found.')).toBeInTheDocument();
  });

  it('shows pagination showing 0 of 0 when empty', () => {
    renderList([]);
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent?.includes('0') && el.textContent?.includes('jobs') ? true : false)).toBeInTheDocument();
  });

  it('renders all provided jobs', () => {
    const jobs = Array.from({ length: 5 }, (_, i) => makeJob(i + 1));
    renderList(jobs);
    expect(screen.getAllByText(/^job-\d+$/)).toHaveLength(5);
  });

  it('renders the jobs passed to it without slicing', () => {
    // API returns exactly the jobs for the current page; JobList renders all of them
    const jobs = Array.from({ length: 10 }, (_, i) => makeJob(i + 1));
    renderList(jobs, { total: 15 });
    expect(screen.getAllByText(/^job-\d+$/)).toHaveLength(10);
  });

  it('shows correct pagination text based on total and currentPage', () => {
    const jobs = Array.from({ length: 10 }, (_, i) => makeJob(i + 1));
    renderList(jobs, { total: 15, currentPage: 1 });
    expect(screen.getByText('1–10', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('15', { exact: false })).toBeInTheDocument();
  });

  it('shows correct range text on second page', () => {
    const jobs = Array.from({ length: 5 }, (_, i) => makeJob(i + 11));
    renderList(jobs, { total: 15, currentPage: 2 });
    expect(screen.getByText('11–15', { exact: false })).toBeInTheDocument();
  });

  it('calls onPageChange with next page when Next is clicked', async () => {
    const user = userEvent.setup();
    const jobs = Array.from({ length: 10 }, (_, i) => makeJob(i + 1));
    renderList(jobs, { total: 15 });
    await user.click(screen.getByRole('button', { name: /next page/i }));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with previous page when Prev is clicked', async () => {
    const user = userEvent.setup();
    const jobs = Array.from({ length: 5 }, (_, i) => makeJob(i + 11));
    renderList(jobs, { total: 15, currentPage: 2 });
    await user.click(screen.getByRole('button', { name: /previous page/i }));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Prev button on first page', () => {
    const jobs = Array.from({ length: 5 }, (_, i) => makeJob(i + 1));
    renderList(jobs, { currentPage: 1 });
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    const jobs = Array.from({ length: 5 }, (_, i) => makeJob(i + 1));
    renderList(jobs, { total: 5, currentPage: 1 });
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });

  it('enables Next button when more pages exist', () => {
    const jobs = Array.from({ length: 10 }, (_, i) => makeJob(i + 1));
    renderList(jobs, { total: 15, currentPage: 1 });
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled();
  });
});
