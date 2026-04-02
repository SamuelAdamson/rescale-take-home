import { useEffect, useCallback, useReducer, useState } from 'react';
import type { Job, JobsFilterParams } from '../types/job';
import { fetchJobs } from '../api/jobs';

interface UseJobsResult {
  jobs: Job[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface FetchState {
  jobs: Job[];
  total: number;
  loading: boolean;
  error: string | null;
}

type FetchAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; jobs: Job[]; total: number }
  | { type: 'FETCH_ERROR'; error: string };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { loading: false, error: null, jobs: action.jobs, total: action.total };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };
  }
}

export function useJobs({ page, page_size, status, search }: JobsFilterParams): UseJobsResult {
  const [state, dispatch] = useReducer(fetchReducer, {
    jobs: [],
    total: 0,
    loading: true,
    error: null,
  });
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    fetchJobs({ page, page_size, status, search })
      .then(({ count, results }) => {
        dispatch({ type: 'FETCH_SUCCESS', jobs: results, total: count });
      })
      .catch((err: unknown) => {
        dispatch({
          type: 'FETCH_ERROR',
          error: err instanceof Error ? err.message : 'An unexpected error occurred',
        });
      });
  }, [page, page_size, status, search, fetchTrigger]);

  const refetch = useCallback(() => {
    setFetchTrigger((n) => n + 1);
  }, []);

  return { ...state, refetch };
}
