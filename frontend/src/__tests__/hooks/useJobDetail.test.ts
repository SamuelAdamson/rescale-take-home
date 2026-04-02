import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJobDetail } from '../../hooks/useJobDetail';
import type { JobWithHistory } from '../../types/job';

vi.mock('../../api/jobs', () => ({
  fetchJobDetail: vi.fn(),
}));

import { fetchJobDetail } from '../../api/jobs';
const mockFetchJobDetail = vi.mocked(fetchJobDetail);

const mockJob: JobWithHistory = {
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useJobDetail', () => {
  it('starts in loading state', async () => {
    mockFetchJobDetail.mockResolvedValue(mockJob);
    const { result } = renderHook(() => useJobDetail(1));
    expect(result.current.loading).toBe(true);
    expect(result.current.job).toBeNull();
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('populates job on successful fetch', async () => {
    mockFetchJobDetail.mockResolvedValue(mockJob);
    const { result } = renderHook(() => useJobDetail(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.job).toEqual(mockJob);
    expect(result.current.error).toBeNull();
  });

  it('fetches using the provided id', async () => {
    mockFetchJobDetail.mockResolvedValue(mockJob);
    const { result } = renderHook(() => useJobDetail(42));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchJobDetail).toHaveBeenCalledWith(42);
  });

  it('sets error on failed fetch', async () => {
    mockFetchJobDetail.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useJobDetail(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Not found');
    expect(result.current.job).toBeNull();
  });

  it('handles non-Error thrown values', async () => {
    mockFetchJobDetail.mockRejectedValue('unexpected');
    const { result } = renderHook(() => useJobDetail(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Unknown error');
  });

  it('refetch triggers another fetch and resets to loading', async () => {
    mockFetchJobDetail.mockResolvedValue(mockJob);
    const { result } = renderHook(() => useJobDetail(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchJobDetail).toHaveBeenCalledTimes(1);

    act(() => { result.current.refetch(); });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchJobDetail).toHaveBeenCalledTimes(2);
  });
});
