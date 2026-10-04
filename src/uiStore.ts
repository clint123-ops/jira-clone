import { create } from 'zustand';
import type { Status } from './types';

interface CreateDefaults {
  projectId?: string;
  status?: Status;
}

export type ToastKind = 'success' | 'xp';

interface Toast {
  id: number;
  message: string;
  issueKey?: string;
  kind: ToastKind;
}

interface UiState {
  createOpen: boolean;
  createDefaults: CreateDefaults;
  toast: Toast | null;
  openCreate: (defaults?: CreateDefaults) => void;
  closeCreate: () => void;
  showToast: (message: string, issueKey?: string, kind?: ToastKind) => void;
  hideToast: () => void;
}

/** Non-persisted UI state (dialogs, toasts). */
export const useUi = create<UiState>()((set) => ({
  createOpen: false,
  createDefaults: {},
  toast: null,
  openCreate: (defaults = {}) => set({ createOpen: true, createDefaults: defaults }),
  closeCreate: () => set({ createOpen: false }),
  showToast: (message, issueKey, kind = 'success') => set({ toast: { id: Date.now(), message, issueKey, kind } }),
  hideToast: () => set({ toast: null }),
}));
