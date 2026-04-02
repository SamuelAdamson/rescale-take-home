import { useState, type ReactElement } from 'react';
import Modal from './Modal';

interface ConfirmDeleteModalProps {
  jobName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ConfirmDeleteModal({ jobName, onClose, onConfirm }: ConfirmDeleteModalProps): ReactElement {
  const [deleting, setDeleting] = useState<boolean>(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal title="Delete Job" onClose={onClose}>
      <p className="text-sm text-[var(--color-text)] mb-1">
        Are you sure you want to delete <span className="font-semibold">{jobName}</span>?
      </p>
      <p className="text-xs text-[var(--color-text-muted)] mb-6">This action cannot be undone.</p>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="h-9 px-4 text-sm font-medium rounded-[3px] border border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-card-bg)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={deleting}
          className="h-9 px-4 text-sm font-medium rounded-[3px] bg-[var(--color-status-failed)] text-white hover:opacity-90 transition-opacity duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}
