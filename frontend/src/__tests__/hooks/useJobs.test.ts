import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJobs } from '../../hooks/useJobs';
import type { Job, PaginatedJobs } from '../../types/job';

vi.mock('../../api/jobs', () => ({
  fetchJobs: vi.fn(),
}));

import { fetchJobs } from '../../api/jobs';
const mockFetchJobs = vi.mocked(fetchJobs);

const mockJobs: Job[] = [
  {
    id: 1,
    name: 'job-one',
    current_status: 'PENDING',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'job-two',
    current_status: 'RUNNING',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
];

const mockPaginated: PaginatedJobs = { count: 2, results: mockJobs };

const defaultParams = { page: 1, page_size: 10, status: '', search: '' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useJobs', () => {
  it('starts in loading state', async () => {
    mockFetchJobs.mockResolvedValue(mockPaginated);
    const { result } = renderHook(() => useJobs(defaultParams));
    expect(result.current.loading).toBe(true);
    expect(result.current.jobs).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('populates jobs and total on successful fetch', async () => {
    mockFetchJobs.mockResolvedValue(mockPaginated);
    const { result } = renderHook(() => useJobs(defaultParams));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.jobs).toEqual(mockJobs);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('passes all params to fetchJobs', async () => {
    mockFetchJobs.mockResolvedValue(mockPaginated);
    const params = { page: 3, page_size: 30, status: 'RUNNING', search: 'my-job' };
    const { result } = renderHook(() => useJobs(params));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchJobs).toHaveBeenCalledWith(params);
  });

  it('sets error on failed fetch', async () => {
    mockFetchJobs.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useJobs(defaultParams));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.jobs).toEqual([]);
  });

  it('handles non-Error thrown values', async () => {
    mockFetchJobs.mockRejectedValue('string error');
    const { result } = renderHook(() => useJobs(defaultParams));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('An unexpected error occurred');
  });

  it('refetches when params change', async () => {
    mockFetchJobs.mockResolvedValue(mockPaginated);
    const { result, rerender } = renderHook((params) => useJobs(params), {
      initialProps: defaultParams,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchJobs).toHaveBeenCalledTimes(1);

    rerender({ ...defaultParams, page: 2 });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchJobs).toHaveBeenCalledTimes(2);
    expect(mockFetchJobs).toHaveBeenLastCalledWith({ ...defaultParams, page: 2 });
  });

  it('refetch() triggers another fetch and resets to loading', async () => {
    mockFetchJobs.mockResolvedValue(mockPaginated);
    const { result } = renderHook(() => useJobs(defaultParams));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchJobs).toHaveBeenCalledTimes(1);

    act(() => { result.current.refetch(); });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchJobs).toHaveBeenCalledTimes(2);
  });
});
