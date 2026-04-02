import { type ReactElement } from 'react';
import type { JobStatusEntry, JobStatusType } from '../types/job';
import { STATUS_STYLES } from '../constants/jobStatus';

interface JobHistoryProps {
  history: JobStatusEntry[];
}

export default function JobHistory({ history }: JobHistoryProps): ReactElement {
  return (
    <div
      className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)]"
      style={{ boxShadow: 'var(--color-card-shadow)' }}
    >
      <div className="px-4 py-3 border-b border-[var(--color-card-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Status History</h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{history.length} event{history.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="job-list-scroll h-[320px] overflow-y-scroll">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-muted)]">
            No history available.
          </div>
        ) : (
          <div className="px-4 pt-4 pb-2">
            {history.map((entry, index) => {
              const styleKey = entry.status_type in STATUS_STYLES ? entry.status_type : 'UNKNOWN';
              const style = STATUS_STYLES[styleKey as JobStatusType | 'UNKNOWN'];
              const isLast = index === history.length - 1;
              const date = new Date(entry.timestamp);

              return (
                <div key={entry.id} className="flex items-start gap-3">
                  {/* Timeline spine */}
                  <div className="flex flex-col items-center shrink-0 w-3">
                    <div className={`w-3 h-3 rounded-full mt-0.5 ${style.dot}`} />
                    {!isLast && (
                      <div className="w-px flex-1 min-h-[28px] bg-[var(--color-card-border)]" />
                    )}
                  </div>

                  {/* Row content */}
                  <div className={`flex items-start justify-between flex-1 gap-4 ${!isLast ? 'pb-4' : ''}`}>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${style.text} ${style.bg} ${style.border}`}
                    >
                      {style.label}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
