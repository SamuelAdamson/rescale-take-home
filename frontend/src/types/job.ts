export interface Job {
  id: number;
  name: string;
  current_status: JobStatusType | null;
  created_at: string;
  updated_at: string;
}

export interface JobWithHistory extends Job {
  status_history: JobStatusEntry[];
}

export interface PaginatedJobs {
  count: number;
  results: Job[];
}

export type JobStatusType = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface JobStatusEntry {
  id: number;
  status_type: JobStatusType;
  timestamp: string;
}

export interface StatusStyle {
  label: string;
  dot: string;
  text: string;
  bg: string;
  border: string;
}

export interface JobsFilterParams {
  page: number;
  page_size: number;
  status: string;
  search: string;
}
