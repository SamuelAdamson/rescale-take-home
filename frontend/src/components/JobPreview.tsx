import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { Job, JobStatusType } from '../types/job';
import { ALL_STATUSES, STATUS_STYLES } from '../constants/jobStatus';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface JobPreviewProps {
  job: Job;
  onStatusChange: (id: number, status: JobStatusType) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function JobPreview({ job, onStatusChange, onDelete }: JobPreviewProps): ReactElement {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(false);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);

  const styleKey = job.current_status ?? 'UNKNOWN';
  const style = STATUS_STYLES[styleKey];
const handleStatusChange = async (status: JobStatusType) => {
    setPending(true);
    try {
      await onStatusChange(job.id, status);
      setExpanded(false);
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    setPending(true);
    try {
      await onDelete(job.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-md border border-[var(--color-card-border)] bg-[var(--color-card-bg)] overflow-hidden">
      {/* Collapsed row — clicking anywhere toggles the dropdown */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="text-sm font-medium text-[var(--color-text)] truncate pr-4">{job.name}</span>

        <div className="flex items-center gap-3 shrink-0">
          {/* View details link — nav-link underline effect */}
          <Link
            to={`/jobs/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className="nav-link inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors duration-150"
          >
            View job details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9,6 15,12 9,18" />
            </svg>
          </Link>

          {/* Status badge — toggles dropdown */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((prev) => !prev); }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium cursor-pointer ${style.text} ${style.bg} ${style.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {style.label}
          </button>

          {/* Chevron */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((prev) => !prev); }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-150 cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-[var(--color-card-border)] px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            {/* All statuses — current highlighted */}
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_STATUSES.map((s) => {
                const st = STATUS_STYLES[s];
                const isCurrent = s === job.current_status;
                return (
                  <button
                    key={s}
                    onClick={() => !isCurrent && handleStatusChange(s)}
                    disabled={pending || isCurrent}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium transition-opacity duration-150 cursor-pointer disabled:cursor-default ${st.text} ${st.border} ${isCurrent ? `${st.bg} ring-1 ring-offset-1 ring-current` : 'bg-transparent hover:opacity-80 disabled:opacity-100'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={pending}
              className="text-xs font-medium px-3 py-1 rounded-[3px] bg-[var(--color-status-failed)] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 hover:opacity-90 transition-opacity duration-150"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDeleteModal
          jobName={job.name}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
