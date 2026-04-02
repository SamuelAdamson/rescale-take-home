import type { Job, JobStatusType, JobWithHistory, JobsFilterParams, PaginatedJobs } from '../types/job';

export async function fetchJobs(params: JobsFilterParams): Promise<PaginatedJobs> {
  const qs = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
    status: params.status,
    search: params.search,
  });
  const response = await fetch(`/api/jobs/?${qs}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<PaginatedJobs>;
}

export async function updateJobStatus(id: number, statusType: JobStatusType): Promise<Job> {
  const response = await fetch(`/api/jobs/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status_type: statusType }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update job status: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<Job>;
}

export async function createJob(name: string): Promise<Job> {
  const response = await fetch('/api/jobs/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create job: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<Job>;
}

export async function deleteJob(id: number): Promise<void> {
  const response = await fetch(`/api/jobs/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Failed to delete job: ${response.status} ${response.statusText}`);
  }
}

export async function fetchJobDetail(id: number): Promise<JobWithHistory> {
  const response = await fetch(`/api/jobs/${id}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<JobWithHistory>;
}
