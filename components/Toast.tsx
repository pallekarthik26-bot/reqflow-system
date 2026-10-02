import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />}
            <div>
              <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs mt-0.5 text-slate-600 font-normal leading-relaxed">{toast.message}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-700 p-1 -mr-1 -mt-1 rounded-md transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
