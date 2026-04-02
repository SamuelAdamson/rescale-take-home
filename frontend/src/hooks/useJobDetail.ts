import { useState, useEffect, useCallback } from 'react';
import { fetchJobDetail } from '../api/jobs';
import type { JobWithHistory } from '../types/job';

interface UseJobDetailResult {
  job: JobWithHistory | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobDetail(id: number): UseJobDetailResult {
  const [job, setJob] = useState<JobWithHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetchJobDetail(id)
      .then((data) => {
        if (!cancelled) {
          setJob(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, trigger]);

  const refetch = useCallback(() => {
    setLoading(true);
    setTrigger((t) => t + 1);
  }, []);

  return { job, loading, error, refetch };
}
