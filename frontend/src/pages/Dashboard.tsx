import { useState, type ReactElement } from 'react';
import { useJobs } from '../hooks/useJobs';
import { useDebounce } from '../hooks/useDebounce';
import JobList from '../components/JobList';
import CreateJobModal from '../components/CreateJobModal';
import { updateJobStatus, deleteJob } from '../api/jobs';
import type { JobStatusType } from '../types/job';
import type { ClientPageSize } from '../constants/pagination';
import { ALL_STATUSES, STATUS_STYLES } from '../constants/jobStatus';


function ErrorBanner({ message }: { message: string }): ReactElement {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-status-failed-border)] bg-[var(--color-status-failed-bg)] text-[var(--color-status-failed)]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <p className="text-sm font-semibold">Failed to load jobs</p>
        <p className="text-xs mt-0.5 opacity-80">{message}</p>
      </div>
    </div>
  );
}

export default function Dashboard(): ReactElement {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<ClientPageSize>(10);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<JobStatusType | ''>('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { jobs, total, loading, error, refetch } = useJobs({
    page: currentPage,
    page_size: pageSize,
    status: statusFilter,
    search: debouncedQuery,
  });

  const handleStatusChange = async (id: number, status: JobStatusType) => {
    await updateJobStatus(id, status);
    refetch();
  };

  const handleDelete = async (id: number) => {
    await deleteJob(id);
    setCurrentPage(1);
    refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search jobs…"
              className="w-full h-9 pl-8 pr-3 text-sm rounded-[3px] border border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value as JobStatusType | ''); setCurrentPage(1); }}
            className="h-9 pl-3 pr-8 text-sm rounded-[3px] border border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="h-9 px-4 text-sm font-medium rounded-[3px] bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity duration-150 cursor-pointer"
        >
          Create Job +
        </button>
      </div>

      {!loading && error && <ErrorBanner message={error} />}
      {!error && (
        <JobList
          jobs={jobs}
          total={total}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onClientPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      {modalOpen && (
        <CreateJobModal
          onClose={() => setModalOpen(false)}
          onCreated={refetch}
        />
      )}
    </div>
  );
}
