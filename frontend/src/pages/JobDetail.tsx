import { useState, type ReactElement } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { JobStatusType } from '../types/job';
import { updateJobStatus, deleteJob } from '../api/jobs';
import { useJobDetail } from '../hooks/useJobDetail';
import { ALL_STATUSES, STATUS_STYLES } from '../constants/jobStatus';
import JobHistory from '../components/JobHistory';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function JobDetail(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const jobId = parseInt(id ?? '0', 10);

  const { job, loading, error, refetch } = useJobDetail(jobId);
  const [actionPending, setActionPending] = useState<boolean>(false);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);

  const handleStatusChange = async (newStatus: JobStatusType) => {
    if (job?.current_status === newStatus) return;
    setActionPending(true);
    try {
      await updateJobStatus(jobId, newStatus);
      refetch();
    } finally {
      setActionPending(false);
    }
  };

  const handleDelete = async () => {
    setActionPending(true);
    try {
      await deleteJob(jobId);
      navigate('/jobs');
    } finally {
      setActionPending(false);
    }
  };

  const styleKey = job?.current_status ?? 'UNKNOWN';
  const currentStyle = STATUS_STYLES[styleKey];

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/jobs"
        className="nav-link inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors duration-150 w-fit"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Back to Jobs
      </Link>

      {loading && !job && (
        <>
          <div
            className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-5 py-4 flex flex-col gap-4"
            style={{ boxShadow: 'var(--color-card-shadow)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="h-6 w-48 rounded bg-[var(--color-card-border)] animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-[var(--color-card-border)] animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-16 rounded bg-[var(--color-card-border)] animate-pulse mb-2" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 w-16 rounded-full bg-[var(--color-card-border)] animate-pulse" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-[var(--color-card-border)] pt-3">
              <div className="h-3 w-36 rounded bg-[var(--color-card-border)] animate-pulse" />
              <div className="h-3 w-36 rounded bg-[var(--color-card-border)] animate-pulse" />
            </div>
          </div>

          <div
            className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)]"
            style={{ boxShadow: 'var(--color-card-shadow)' }}
          >
            <div className="px-4 py-3 border-b border-[var(--color-card-border)] flex items-center gap-2">
              <svg className="animate-spin w-4 h-4 text-[var(--color-text-muted)] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm text-[var(--color-text-muted)]">Loading…</span>
            </div>
            <div className="h-[320px]" />
          </div>
        </>
      )}

      {error && !loading && (
        <div className="rounded-md border border-[var(--color-status-failed-border)] bg-[var(--color-status-failed-bg)] px-4 py-3 text-sm text-[var(--color-status-failed)]">
          {error}
        </div>
      )}

      {job && (
        <>
          <div
            className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-5 py-4 flex flex-col gap-4"
            style={{ boxShadow: 'var(--color-card-shadow)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold text-[var(--color-text)] truncate">{job.name}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0 ${currentStyle.text} ${currentStyle.bg} ${currentStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.dot}`} />
                {currentStyle.label}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Set status</p>
              <div className="flex items-center gap-2 flex-wrap">
                {ALL_STATUSES.map((s) => {
                  const st = STATUS_STYLES[s];
                  const isCurrent = s === job.current_status;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={actionPending || isCurrent}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-opacity duration-150 cursor-pointer disabled:cursor-default ${st.text} ${st.border} ${isCurrent ? `${st.bg} ring-1 ring-offset-1 ring-current` : 'bg-transparent hover:opacity-80 disabled:opacity-100'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-card-border)] pt-3">
              <span>Created {new Date(job.created_at).toLocaleString()}</span>
              <span>Updated {new Date(job.updated_at).toLocaleString()}</span>
            </div>
          </div>

          <JobHistory history={job.status_history} />

          <div className="flex justify-end">
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={actionPending}
              className="text-sm font-medium px-4 py-2 rounded-[3px] bg-[var(--color-status-failed)] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity duration-150"
            >
              Delete Job
            </button>
          </div>
        </>
      )}

      {confirmingDelete && job && (
        <ConfirmDeleteModal
          jobName={job.name}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
