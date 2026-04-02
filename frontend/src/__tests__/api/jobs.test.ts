import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJobs, createJob, updateJobStatus, deleteJob, fetchJobDetail } from '../../api/jobs';
import type { Job, JobWithHistory, PaginatedJobs } from '../../types/job';

const mockJob: Job = {
  id: 1,
  name: 'test-job',
  current_status: 'PENDING',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function mockFetch(body: unknown, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? 'OK' : 'Bad Request',
      json: () => Promise.resolve(body),
    }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchJobs', () => {
  const paginatedResponse: PaginatedJobs = { count: 1, results: [mockJob] };

  it('returns paginated response on success', async () => {
    mockFetch(paginatedResponse);
    const result = await fetchJobs({ page: 1, page_size: 10, status: '', search: '' });
    expect(result).toEqual(paginatedResponse);
  });

  it('builds correct query string from params', async () => {
    mockFetch(paginatedResponse);
    await fetchJobs({ page: 2, page_size: 30, status: 'RUNNING', search: 'my-job' });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('page_size=30');
    expect(calledUrl).toContain('status=RUNNING');
    expect(calledUrl).toContain('search=my-job');
  });

  it('sends request to /api/jobs/', async () => {
    mockFetch(paginatedResponse);
    await fetchJobs({ page: 1, page_size: 10, status: '', search: '' });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/^\/api\/jobs\/\?/);
  });

  it('throws on non-ok response', async () => {
    mockFetch(null, false, 500);
    await expect(fetchJobs({ page: 1, page_size: 10, status: '', search: '' })).rejects.toThrow(
      'Failed to fetch jobs: 500',
    );
  });
});

describe('createJob', () => {
  it('posts job name and returns created job', async () => {
    mockFetch(mockJob);
    const result = await createJob('test-job');
    expect(result).toEqual(mockJob);
    expect(fetch).toHaveBeenCalledWith('/api/jobs/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-job' }),
    });
  });

  it('throws on non-ok response', async () => {
    mockFetch(null, false, 400);
    await expect(createJob('bad job')).rejects.toThrow('Failed to create job: 400');
  });
});

describe('updateJobStatus', () => {
  it('patches status and returns updated job', async () => {
    const updated = { ...mockJob, current_status: 'RUNNING' as const };
    mockFetch(updated);
    const result = await updateJobStatus(1, 'RUNNING');
    expect(result).toEqual(updated);
    expect(fetch).toHaveBeenCalledWith('/api/jobs/1/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_type: 'RUNNING' }),
    });
  });

  it('throws on non-ok response', async () => {
    mockFetch(null, false, 404);
    await expect(updateJobStatus(99, 'RUNNING')).rejects.toThrow('Failed to update job status: 404');
  });
});

describe('deleteJob', () => {
  it('sends DELETE request', async () => {
    mockFetch(null);
    await deleteJob(1);
    expect(fetch).toHaveBeenCalledWith('/api/jobs/1/', { method: 'DELETE' });
  });

  it('throws on non-ok response', async () => {
    mockFetch(null, false, 404);
    await expect(deleteJob(99)).rejects.toThrow('Failed to delete job: 404');
  });
});

describe('fetchJobDetail', () => {
  const mockJobWithHistory: JobWithHistory = {
    id: 1,
    name: 'test-job',
    current_status: 'RUNNING',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    status_history: [
      { id: 2, status_type: 'RUNNING', timestamp: '2026-01-01T01:00:00Z' },
      { id: 1, status_type: 'PENDING', timestamp: '2026-01-01T00:00:00Z' },
    ],
  };

  it('sends GET request to the correct endpoint', async () => {
    mockFetch(mockJobWithHistory);
    await fetchJobDetail(1);
    expect(fetch).toHaveBeenCalledWith('/api/jobs/1/');
  });

  it('returns job with status history on success', async () => {
    mockFetch(mockJobWithHistory);
    const result = await fetchJobDetail(1);
    expect(result).toEqual(mockJobWithHistory);
    expect(result.status_history).toHaveLength(2);
  });

  it('throws on non-ok response', async () => {
    mockFetch(null, false, 404);
    await expect(fetchJobDetail(99)).rejects.toThrow('Failed to fetch job: 404');
  });
});
