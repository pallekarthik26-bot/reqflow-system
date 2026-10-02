import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Role } from '@/lib/types';

export type FilterCategory = 'ALL' | 'SUBMITTED' | 'DRAFTS' | 'APPROVED' | 'ARCHIVED';

interface ControlsBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterCategory;
  onFilterChange: (f: FilterCategory) => void;
  userRole: Role;
  onOpenCreateModal: () => void;
  counts: {
    all: number;
    submitted: number;
    drafts: number;
    approved: number;
    archived: number;
  };
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  userRole,
  onOpenCreateModal,
  counts,
}) => {
  const tabs: { id: FilterCategory; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Requests', count: counts.all },
    { id: 'SUBMITTED', label: 'Needs Review', count: counts.submitted },
    { id: 'DRAFTS', label: 'My Drafts', count: counts.drafts },
    { id: 'APPROVED', label: 'Approved', count: counts.approved },
    { id: 'ARCHIVED', label: 'Completed / Archived', count: counts.archived },
  ];

  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, description, or request ID..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Button: + New Request */}
        <div className="flex items-center gap-2">
          {userRole === 'CREATOR' ? (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Request</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium">
              <span>Reviewer Mode (Read & Decide)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-2 shrink-0 hidden sm:block" />
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
