import { type ReactElement } from 'react';
import type { Job, JobStatusType } from '../types/job';
import JobPreview from './JobPreview';
import { CLIENT_PAGE_SIZE_OPTIONS, type ClientPageSize } from '../constants/pagination';

function ChevronLeftIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  );
}

function ChevronRightIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  );
}

interface JobListProps {
  jobs: Job[];
  total: number;
  loading: boolean;
  currentPage: number;
  pageSize: ClientPageSize;
  onPageChange: (page: number) => void;
  onClientPageSizeChange: (size: ClientPageSize) => void;
  onStatusChange: (id: number, status: JobStatusType) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function JobList({ jobs, total, loading, currentPage, pageSize, onPageChange, onClientPageSizeChange, onStatusChange, onDelete }: JobListProps): ReactElement {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + jobs.length, total);

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex flex-col gap-4">
      {/* Job cards */}
      <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] h-[480px] p-2" style={{ boxShadow: 'var(--color-card-shadow)' }}>
        <div className="job-list-scroll h-full overflow-y-scroll">
          <div className="flex flex-col gap-2 px-2 py-1 min-h-full">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <svg
                  className="animate-spin text-[var(--color-accent)]"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="Loading"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                No jobs found.
              </div>
            ) : (
              jobs.map((job) => (
                <JobPreview
                  key={job.id}
                  job={job}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination bar */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-[var(--color-text-muted)]">
          Showing{' '}
          <span className="font-medium text-[var(--color-text)]">
            {total === 0 ? 0 : startIndex + 1}–{endIndex}
          </span>{' '}
          of{' '}
          <span className="font-medium text-[var(--color-text)]">{total}</span> jobs
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label htmlFor="page-size-select" className="text-xs text-[var(--color-text-muted)]">Rows per page</label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onClientPageSizeChange(Number(e.target.value) as ClientPageSize)}
              className="h-7 pl-2 pr-6 text-xs rounded-[3px] border border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent cursor-pointer"
            >
              {CLIENT_PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrev}
              aria-label="Previous page"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-card-bg)] transition-colors duration-150 enabled:hover:bg-[var(--color-bg)] enabled:hover:text-[var(--color-accent)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon />
            </button>

            <span className="px-3 text-xs text-[var(--color-text-muted)]">
              Page{' '}
              <span className="font-semibold text-[var(--color-text)]">{total === 0 ? 0 : currentPage}</span>{' '}
              of{' '}
              <span className="font-semibold text-[var(--color-text)]">{total === 0 ? 0 : totalPages}</span>
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext}
              aria-label="Next page"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-card-bg)] transition-colors duration-150 enabled:hover:bg-[var(--color-bg)] enabled:hover:text-[var(--color-accent)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
