import { useState, useEffect, useRef, type ReactElement } from 'react';
import { createJob } from '../api/jobs';
import Modal from './Modal';

const MAX_NAME_LENGTH = 255;

function validate(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Job name is required.';
  if (trimmed.length > MAX_NAME_LENGTH) return `Job name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  if (/\s/.test(trimmed)) return 'Job name must not contain spaces.';
  return null;
}

interface CreateJobModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateJobModal({ onClose, onCreated }: CreateJobModalProps): ReactElement {
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError(validate(e.target.value));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await createJob(name.trim());
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Create Job" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5 mb-6">
          <label htmlFor="job-name" className="text-sm font-medium text-[var(--color-text)]">
            Job Name <span className="text-[var(--color-status-failed)]">*</span>
          </label>
          <input
            ref={inputRef}
            id="job-name"
            type="text"
            value={name}
            onChange={handleChange}
            placeholder="e.g. simulation-run-42"
            disabled={submitting}
            maxLength={MAX_NAME_LENGTH + 1}
            className={`h-9 px-3 text-sm rounded-[3px] border bg-[var(--color-card-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 transition-colors ${
              error
                ? 'border-[var(--color-status-failed)] focus:ring-[var(--color-status-failed)]'
                : 'border-[var(--color-border)] focus:ring-[var(--color-accent)]'
            }`}
          />
          <div className="flex items-center justify-between">
            {error ? (
              <p className="text-xs text-[var(--color-status-failed)]">{error}</p>
            ) : (
              <span />
            )}
            <p className={`text-xs tabular-nums ${name.length > MAX_NAME_LENGTH ? 'text-[var(--color-status-failed)]' : 'text-[var(--color-text-muted)]'}`}>
              {name.length}/{MAX_NAME_LENGTH}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 px-4 text-sm font-medium rounded-[3px] border border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-card-bg)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-9 px-4 text-sm font-medium rounded-[3px] bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create Job'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
