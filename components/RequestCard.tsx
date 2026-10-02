import React, { useState } from 'react';
import { RequestItem, Status, Role } from '@/lib/types';
import { Persona } from './Navbar';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  History,
  Check,
  CircleDot,
  ArrowRight,
} from 'lucide-react';

interface RequestCardProps {
  request: RequestItem;
  activePersona: Persona;
  onInitiateTransition: (request: RequestItem, targetStatus: Status) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  activePersona,
  onInitiateTransition,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  // Status Badge Styling
  const getStatusBadge = (status: Status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <CircleDot className="w-3 h-3 text-slate-500" />
            Draft
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            <Ban className="w-3 h-3 text-zinc-500" />
            Cancelled
          </span>
        );
    }
  };

  // Helper for human-relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Mini Workflow Stepper / Visual Progress Bar
  const renderStepper = () => {
    const isStep1Done = true; // Always drafted
    const isStep2Active = request.status === 'SUBMITTED';
    const isStep2Done =
      request.status === 'APPROVED' || request.status === 'REJECTED' || request.status === 'CANCELLED';

    const isStep3Approved = request.status === 'APPROVED';
    const isStep3Rejected = request.status === 'REJECTED';
    const isStep3Cancelled = request.status === 'CANCELLED';
    const isStep3Finalized = isStep3Approved || isStep3Rejected || isStep3Cancelled;

    return (
      <div className="w-full py-2.5 px-3 bg-slate-50/80 rounded-xl border border-slate-100 my-3">
        <div className="flex items-center justify-between text-xs">
          {/* Step 1: Draft */}
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">
              <Check className="w-3 h-3" />
            </div>
            <span>Draft</span>
          </div>

          {/* Line 1 */}
          <div
            className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
              isStep2Active || isStep2Done ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />

          {/* Step 2: Under Review */}
          <div
            className={`flex items-center gap-1.5 font-medium ${
              isStep2Active
                ? 'text-amber-700 font-semibold'
                : isStep2Done
                ? 'text-slate-800'
                : 'text-slate-400'
            }`}
          >
            <div
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                isStep2Active
                  ? 'bg-amber-500 text-white ring-2 ring-amber-200 animate-pulse'
                  : isStep2Done
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isStep2Done ? <Check className="w-3 h-3" /> : '2'}
            </div>
            <span>Review</span>
          </div>

          {/* Line 2 */}
          <div
            className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
              isStep3Finalized ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />

          {/* Step 3: Decision */}
          <div
            className={`flex items-center gap-1.5 font-medium ${
              isStep3Approved
                ? 'text-emerald-700 font-semibold'
                : isStep3Rejected
                ? 'text-rose-700 font-semibold'
                : isStep3Cancelled
                ? 'text-zinc-600 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <div
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                isStep3Approved
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                  : isStep3Rejected
                  ? 'bg-rose-600 text-white ring-2 ring-rose-200'
                  : isStep3Cancelled
                  ? 'bg-zinc-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isStep3Approved && <Check className="w-3 h-3" />}
              {isStep3Rejected && <XCircle className="w-3 h-3" />}
              {isStep3Cancelled && <Ban className="w-3 h-3" />}
              {!isStep3Finalized && '3'}
            </div>
            <span>
              {isStep3Approved
                ? 'Approved'
                : isStep3Rejected
                ? 'Rejected'
                : isStep3Cancelled
                ? 'Cancelled'
                : 'Decision'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Role-Governed Action Controls
  const renderActions = () => {
    const isCreator = activePersona.role === 'CREATOR';
    const isReviewer = activePersona.role === 'REVIEWER';

    // 1. Terminal States: Workflow Finalized
    if (request.status === 'APPROVED' || request.status === 'REJECTED' || request.status === 'CANCELLED') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/70 border border-slate-200 rounded-lg text-xs text-slate-600">
          <Check className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium">Workflow finalized (No further actions)</span>
        </div>
      );
    }

    // 2. Draft Status
    if (request.status === 'DRAFT') {
      if (isCreator) {
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onInitiateTransition(request, 'SUBMITTED')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </button>
            <button
              onClick={() => onInitiateTransition(request, 'CANCELLED')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
            >
              <Ban className="w-3.5 h-3.5 text-rose-500" />
              <span>Cancel Request</span>
            </button>
          </div>
        );
      } else {
        // Reviewer viewing a draft
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting Creator submission</span>
          </div>
        );
      }
    }

    // 3. Submitted Status
    if (request.status === 'SUBMITTED') {
      if (isReviewer) {
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onInitiateTransition(request, 'APPROVED')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => onInitiateTransition(request, 'REJECTED')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          </div>
        );
      } else if (isCreator) {
        // Creator viewing submitted request: can cancel before review is finalized
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Under Review by Bob Martinez</span>
            <button
              onClick={() => onInitiateTransition(request, 'CANCELLED')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
            >
              <Ban className="w-3.5 h-3.5 text-rose-500" />
              <span>Cancel Request</span>
            </button>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-200 overflow-hidden">
      <div className="p-5">
        {/* Card Header: Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-400 font-semibold">{request.id}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">Updated {formatTimeAgo(request.updatedAt)}</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight leading-snug">
              {request.title}
            </h3>
          </div>
          <div className="shrink-0">{getStatusBadge(request.status)}</div>
        </div>

        {/* Description */}
        <p className="mt-2.5 text-sm text-slate-600 leading-relaxed font-normal">
          {request.description}
        </p>

        {/* Visual Stepper */}
        {renderStepper()}

        {/* Card Metadata & Role Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-medium">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>
              Proposed by <strong className="text-slate-800">{request.createdBy.name}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            {/* Toggle Audit History */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium py-1 px-2 rounded-md hover:bg-slate-100 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Trail</span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-100 text-slate-600 rounded-full">
                {request.history.length}
              </span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Role Action Buttons */}
            {renderActions()}
          </div>
        </div>
      </div>

      {/* Expandable Activity / Audit Timeline */}
      {showHistory && (
        <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-4 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Immutable Activity & Audit History
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Total entries: {request.history.length}
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
            {request.history.map((entry, idx) => (
              <div key={idx} className="relative flex items-start gap-3 pl-1 text-xs">
                <div className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-white border-2 border-slate-400 mt-0.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>
                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900 font-medium">{entry.actorName}</strong>
                      <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-[9px] uppercase font-mono font-semibold text-slate-600">
                        {entry.actorRole}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(entry.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-slate-600">
                    <span>{entry.fromStatus ? `${entry.fromStatus} ➔ ` : ''}</span>
                    <strong className="text-slate-800 font-bold">{entry.toStatus}</strong>
                  </div>

                  {entry.note && (
                    <p className="mt-1.5 text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                      "{entry.note}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
