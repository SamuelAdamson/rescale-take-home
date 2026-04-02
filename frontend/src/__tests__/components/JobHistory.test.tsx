import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import JobHistory from '../../components/JobHistory';
import type { JobStatusEntry } from '../../types/job';

function makeEntry(id: number, status_type: JobStatusEntry['status_type'], timestamp: string): JobStatusEntry {
  return { id, status_type, timestamp };
}

describe('JobHistory', () => {
  it('shows empty state when history is empty', () => {
    render(<JobHistory history={[]} />);
    expect(screen.getByText('No history available.')).toBeInTheDocument();
  });

  it('shows the event count in the header', () => {
    const history = [makeEntry(1, 'PENDING', '2026-01-01T00:00:00Z')];
    render(<JobHistory history={history} />);
    expect(screen.getByText('1 event')).toBeInTheDocument();
  });

  it('uses plural "events" for multiple entries', () => {
    const history = [
      makeEntry(1, 'RUNNING', '2026-01-01T01:00:00Z'),
      makeEntry(2, 'PENDING', '2026-01-01T00:00:00Z'),
    ];
    render(<JobHistory history={history} />);
    expect(screen.getByText('2 events')).toBeInTheDocument();
  });

  it('renders a status badge for each history entry', () => {
    const history = [
      makeEntry(1, 'COMPLETED', '2026-01-01T02:00:00Z'),
      makeEntry(2, 'RUNNING', '2026-01-01T01:00:00Z'),
      makeEntry(3, 'PENDING', '2026-01-01T00:00:00Z'),
    ];
    render(<JobHistory history={history} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders all four status types correctly', () => {
    const history = [
      makeEntry(1, 'FAILED', '2026-01-01T03:00:00Z'),
      makeEntry(2, 'COMPLETED', '2026-01-01T02:00:00Z'),
      makeEntry(3, 'RUNNING', '2026-01-01T01:00:00Z'),
      makeEntry(4, 'PENDING', '2026-01-01T00:00:00Z'),
    ];
    render(<JobHistory history={history} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('does not show empty state when history has entries', () => {
    const history = [makeEntry(1, 'PENDING', '2026-01-01T00:00:00Z')];
    render(<JobHistory history={history} />);
    expect(screen.queryByText('No history available.')).not.toBeInTheDocument();
  });

  it('renders the Status History heading', () => {
    render(<JobHistory history={[]} />);
    expect(screen.getByText('Status History')).toBeInTheDocument();
  });
});
