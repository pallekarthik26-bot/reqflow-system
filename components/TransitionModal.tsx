import React, { useState } from 'react';
import { Status, Role } from '@/lib/types';
import { Persona } from './Navbar';
import { X, Loader2, CheckCircle2, XCircle, Send, Ban } from 'lucide-react';

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestTitle: string;
  targetStatus: Status;
  activePersona: Persona;
  onSuccess: (updatedRequest: any) => void;
  onError: (errorMsg: string) => void;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  targetStatus,
  activePersona,
  onSuccess,
  onError,
}) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const getActionConfig = () => {
    switch (targetStatus) {
      case 'SUBMITTED':
        return {
          title: 'Submit Request for Review',
          description: 'This will move the request into the REVIEWER queue for evaluation.',
          buttonText: 'Confirm Submission',
          buttonColor: 'bg-slate-900 hover:bg-slate-800 text-white',
          icon: Send,
          placeholder: 'Add an optional handover note or vendor quote details...',
        };
      case 'APPROVED':
        return {
          title: 'Approve Request',
          description: 'This will officially approve the budget and authorize the implementation.',
          buttonText: 'Confirm Approval',
          buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          icon: CheckCircle2,
          placeholder: 'e.g. Approved with FinOps allocation #482...',
        };
      case 'REJECTED':
        return {
          title: 'Reject Request',
          description: 'This will reject the proposal. A terminal status will be applied.',
          buttonText: 'Confirm Rejection',
          buttonColor: 'bg-rose-600 hover:bg-rose-700 text-white',
          icon: XCircle,
          placeholder: 'Provide the reasoning or alternatives for rejection...',
        };
      case 'CANCELLED':
        return {
          title: 'Cancel Request',
          description: 'Withdraw this request from active workflow. This cannot be undone.',
          buttonText: 'Confirm Cancellation',
          buttonColor: 'bg-zinc-800 hover:bg-zinc-900 text-white',
          icon: Ban,
          placeholder: 'Reason for cancellation (optional)...',
        };
      default:
        return {
          title: 'Transition Request',
          description: 'Change request workflow status.',
          buttonText: 'Confirm Transition',
          buttonColor: 'bg-slate-900 hover:bg-slate-800 text-white',
          icon: Send,
          placeholder: 'Add an optional note...',
        };
    }
  };

  const config = getActionConfig();
  const Icon = config.icon;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/requests/${requestId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activePersona.id,
          'x-user-role': activePersona.role,
          'x-user-name': activePersona.name,
        },
        body: JSON.stringify({
          targetStatus,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update request status');
      }

      setNote('');
      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      onError(err.message || 'Error occurred while updating status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{config.title}</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{requestId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <div>
            <span className="text-xs font-medium text-slate-500">Request:</span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 line-clamp-1">{requestTitle}</p>
            <p className="text-xs text-slate-500 mt-1">{config.description}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="trans-note" className="text-xs font-semibold text-slate-700">
                Action Note <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">{note.length}/500</span>
            </div>
            <textarea
              id="trans-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={config.placeholder}
              maxLength={500}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span>Actor: </span>
              <strong className="text-slate-700 font-medium">{activePersona.name}</strong>
            </div>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] uppercase font-mono font-semibold">
              {activePersona.role}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-colors ${config.buttonColor} disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{config.buttonText}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
