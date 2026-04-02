import type { JobStatusType, StatusStyle } from '../types/job';


export const ALL_STATUSES: JobStatusType[] = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'];

export const STATUS_STYLES: Record<JobStatusType | 'UNKNOWN', StatusStyle> = {
  PENDING: {
    label: 'Pending',
    dot: 'bg-[var(--color-status-pending)]',
    text: 'text-[var(--color-status-pending)]',
    bg: 'bg-[var(--color-status-pending-bg)]',
    border: 'border-[var(--color-status-pending-border)]',
  },
  RUNNING: {
    label: 'Running',
    dot: 'bg-[var(--color-status-running)]',
    text: 'text-[var(--color-status-running)]',
    bg: 'bg-[var(--color-status-running-bg)]',
    border: 'border-[var(--color-status-running-border)]',
  },
  COMPLETED: {
    label: 'Completed',
    dot: 'bg-[var(--color-status-completed)]',
    text: 'text-[var(--color-status-completed)]',
    bg: 'bg-[var(--color-status-completed-bg)]',
    border: 'border-[var(--color-status-completed-border)]',
  },
  FAILED: {
    label: 'Failed',
    dot: 'bg-[var(--color-status-failed)]',
    text: 'text-[var(--color-status-failed)]',
    bg: 'bg-[var(--color-status-failed-bg)]',
    border: 'border-[var(--color-status-failed-border)]',
  },
  UNKNOWN: {
    label: 'Unknown',
    dot: 'bg-[var(--color-status-unknown)]',
    text: 'text-[var(--color-status-unknown)]',
    bg: 'bg-[var(--color-status-unknown-bg)]',
    border: 'border-[var(--color-status-unknown-border)]',
  },
};
