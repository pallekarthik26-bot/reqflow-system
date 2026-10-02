'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RequestItem, Status } from '@/lib/types';
import { Navbar, PERSONAS, Persona } from '@/components/Navbar';
import { StatsBar } from '@/components/StatsBar';
import { ControlsBar, FilterCategory } from '@/components/ControlsBar';
import { RequestCard } from '@/components/RequestCard';
import { CreateRequestModal } from '@/components/CreateRequestModal';
import { TransitionModal } from '@/components/TransitionModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import {
  Inbox,
  AlertCircle,
  RefreshCw,
  SearchX,
  CheckCircle,
  FilePlus,
  ShieldAlert,
} from 'lucide-react';

export default function WorkflowDashboard() {
  // 1. Simulation Persona State (Defaults to Alice Vance - Creator)
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[0]);

  // 2. Data State
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');

  // 4. Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [transitionState, setTransitionState] = useState<{
    isOpen: boolean;
    request?: RequestItem;
    targetStatus?: Status;
  }>({
    isOpen: false,
  });

  // 5. Toast Feedback State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 6. Fetch Requests from Backend API
  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const res = await fetch('/api/requests', {
        headers: {
          'x-user-id': activePersona.id,
          'x-user-role': activePersona.role,
          'x-user-name': activePersona.name,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch requests.');
      }

      setRequests(data.data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setFetchError(err.message || 'Unable to communicate with the request service.');
    } finally {
      setIsLoading(false);
    }
  }, [activePersona]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Persona Switching
  const handleSwitchPersona = (persona: Persona) => {
    setActivePersona(persona);
    addToast(
      'info',
      `Switched Persona to ${persona.name}`,
      `Active role changed to ${persona.role} (${persona.title}).`
    );
  };

  // 7. Computed Metrics for Tabs & Quick Stats
  const counts = useMemo(() => {
    return {
      all: requests.length,
      submitted: requests.filter((r) => r.status === 'SUBMITTED').length,
      drafts: requests.filter((r) => r.status === 'DRAFT').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      archived: requests.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED').length,
    };
  }, [requests]);

  // 8. Filtered & Searched Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status category filter
      let matchesFilter = true;
      if (activeFilter === 'SUBMITTED') matchesFilter = req.status === 'SUBMITTED';
      else if (activeFilter === 'DRAFTS') matchesFilter = req.status === 'DRAFT';
      else if (activeFilter === 'APPROVED') matchesFilter = req.status === 'APPROVED';
      else if (activeFilter === 'ARCHIVED')
        matchesFilter = req.status === 'REJECTED' || req.status === 'CANCELLED';

      if (!matchesFilter) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        req.title.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q) ||
        req.createdBy.name.toLowerCase().includes(q)
      );
    });
  }, [requests, activeFilter, searchQuery]);

  // 9. Handlers for Actions
  const handleOpenTransition = (request: RequestItem, targetStatus: Status) => {
    setTransitionState({
      isOpen: true,
      request,
      targetStatus,
    });
  };

  const handleTransitionSuccess = (updatedRequest: RequestItem) => {
    setRequests((prev) =>
      prev.map((item) => (item.id === updatedRequest.id ? updatedRequest : item))
    );
    addToast(
      'success',
      'Status Updated',
      `Request "${updatedRequest.title}" transitioned to ${updatedRequest.status}.`
    );
  };

  const handleCreateSuccess = (newRequest: RequestItem) => {
    setRequests((prev) => [newRequest, ...prev]);
    addToast(
      'success',
      'Draft Created',
      `Proposal "${newRequest.title}" saved. Ready for review whenever you choose to submit.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Feedback Alerts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Navigation & Persona Switcher */}
      <Navbar activePersona={activePersona} onSwitchPersona={handleSwitchPersona} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner: Active Persona Role Guidance */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                activePersona.role === 'CREATOR' ? 'bg-sky-500' : 'bg-indigo-600'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Simulating as {activePersona.name}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    activePersona.role === 'CREATOR'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {activePersona.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activePersona.role === 'CREATOR'
                  ? 'Authorized to author new proposals, submit drafts for review, and withdraw unapproved requests.'
                  : 'Authorized to formally evaluate, approve, or reject pending submissions across departments.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequests}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Refresh request queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {fetchError && (
          <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={fetchRequests}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-rose-300 hover:bg-rose-100 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Key Metrics Bar */}
        <StatsBar
          requests={requests}
          activeFilter={activeFilter}
          onSelectFilter={(filterKey) => {
            if (filterKey === 'ALL') setActiveFilter('ALL');
            else if (filterKey === 'SUBMITTED') setActiveFilter('SUBMITTED');
            else if (filterKey === 'APPROVED') setActiveFilter('APPROVED');
            else if (filterKey === 'DRAFTS_CANCELLED') setActiveFilter('DRAFTS');
          }}
        />

        {/* Search, Filter Controls & + New Request Action */}
        <ControlsBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          userRole={activePersona.role}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          counts={counts}
        />

        {/* Request List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                {activeFilter === 'ALL'
                  ? 'All Requests'
                  : activeFilter === 'SUBMITTED'
                  ? 'Pending Review'
                  : activeFilter === 'DRAFTS'
                  ? 'Draft Proposals'
                  : activeFilter === 'APPROVED'
                  ? 'Approved Requests'
                  : 'Completed & Archived'}
              </h2>
              <span className="text-xs text-slate-400 font-mono font-medium">
                ({filteredRequests.length})
              </span>
            </div>

            {searchQuery && (
              <span className="text-xs text-slate-500">
                Filtered by query: <strong className="text-slate-800">"{searchQuery}"</strong>
              </span>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoading && requests.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs animate-pulse space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                  <div className="h-10 bg-slate-50 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredRequests.length > 0 ? (
            /* Cards List */
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  activePersona={activePersona}
                  onInitiateTransition={handleOpenTransition}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
              <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                {searchQuery ? (
                  <SearchX className="w-6 h-6 text-slate-500" />
                ) : activeFilter === 'SUBMITTED' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Inbox className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="max-w-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  {searchQuery
                    ? 'No matching requests found'
                    : activeFilter === 'SUBMITTED'
                    ? "You're all caught up!"
                    : 'No requests in this view'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {searchQuery
                    ? `No requests match "${searchQuery}". Try adjusting your keywords or clearing the search query.`
                    : activeFilter === 'SUBMITTED'
                    ? 'There are no pending requests awaiting reviewer evaluation right now.'
                    : activeFilter === 'DRAFTS'
                    ? 'No draft requests available. Start by authoring a new request proposal.'
                    : 'No records found matching the selected filter criteria.'}
                </p>
              </div>

              {activePersona.role === 'CREATOR' && !searchQuery && activeFilter === 'DRAFTS' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Create First Draft</span>
                </button>
              )}

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-1 text-xs text-slate-600 hover:text-slate-900 underline font-medium"
                >
                  Clear search query
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>ReqFlow Enterprise Governance Engine • Strict Role-Based Access Control</div>
          <div className="font-mono text-[11px]">Next.js App Router • TypeScript • Zod</div>
        </div>
      </footer>

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        activePersona={activePersona}
        onSuccess={handleCreateSuccess}
        onError={(err) => addToast('error', 'Request Creation Failed', err)}
      />

      {/* Status Transition Confirmation Modal */}
      {transitionState.isOpen && transitionState.request && transitionState.targetStatus && (
        <TransitionModal
          isOpen={transitionState.isOpen}
          onClose={() => setTransitionState({ isOpen: false })}
          requestId={transitionState.request.id}
          requestTitle={transitionState.request.title}
          targetStatus={transitionState.targetStatus}
          activePersona={activePersona}
          onSuccess={handleTransitionSuccess}
          onError={(err) => addToast('error', 'Transition Rejected', err)}
        />
      )}
    </div>
  );
}
