import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useUi } from '../uiStore';

// Dialogs can stack (e.g. browser Back reopens an issue over the create dialog), so #root must
// stay inert until the last one closes rather than being toggled by each dialog.
let openDialogs = 0;

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  width?: number;
  label: string;
}

export function Modal({ onClose, children, width = 560, label }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Captured during the first render: by the time effects run, autoFocus fields inside the dialog already hold focus.
  const [previouslyFocused] = useState(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    // The dialog is portalled outside #root, so making #root inert keeps keyboard and
    // screen-reader focus inside the dialog without a hand-rolled focus trap.
    const root = document.getElementById('root')!;
    const dialog = dialogRef.current!;
    openDialogs += 1;
    root.inert = true;
    // The toast lives in the inert #root, where clicks pass through it to the backdrop and close the dialog.
    useUi.getState().hideToast();
    // Fields with autoFocus have already taken focus by now; only move it when nothing inside has it.
    if (!dialog.contains(document.activeElement)) dialog.focus();
    return () => {
      openDialogs -= 1;
      if (openDialogs === 0) root.inert = false;
      // StrictMode re-runs effects with the dialog still mounted; restoring focus then would steal it from autoFocus.
      queueMicrotask(() => {
        if (!dialog.isConnected) previouslyFocused?.focus();
      });
    };
  }, [previouslyFocused]);

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
