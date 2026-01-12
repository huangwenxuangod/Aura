import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  show: (type: ToastType, message: string, duration?: number) => void;
  hide: (id: string) => void;
  clear: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  
  show: (type, message, duration = 3000) => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));
    
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  
  hide: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  clear: () => set({ toasts: [] }),
}));

export function useToast() {
  const { show, hide, clear, toasts } = useToastStore();
  
  return {
    toasts,
    success: (message: string, duration?: number) => show('success', message, duration),
    error: (message: string, duration?: number) => show('error', message, duration),
    info: (message: string, duration?: number) => show('info', message, duration),
    warning: (message: string, duration?: number) => show('warning', message, duration),
    hide,
    clear,
  };
}

