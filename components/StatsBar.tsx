import React from 'react';
import { RequestItem } from '@/lib/types';
import { FileText, Clock, CheckCircle, Archive, AlertCircle } from 'lucide-react';

interface StatsBarProps {
  requests: RequestItem[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ requests, activeFilter, onSelectFilter }) => {
  const total = requests.length;
  const pendingReview = requests.filter((r) => r.status === 'SUBMITTED').length;
  const approved = requests.filter((r) => r.status === 'APPROVED').length;
  const draftsAndCancelled = requests.filter((r) => r.status === 'DRAFT' || r.status === 'CANCELLED').length;

  const stats = [
    {
      id: 'ALL',
      label: 'Total Requests',
      count: total,
      sublabel: 'Across all lifecycle stages',
      icon: FileText,
      iconColor: 'text-slate-600',
      badgeBg: 'bg-slate-100',
    },
    {
      id: 'SUBMITTED',
      label: 'Pending Review',
      count: pendingReview,
      sublabel: 'Awaiting reviewer decision',
      icon: Clock,
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-50',
    },
    {
      id: 'APPROVED',
      label: 'Approved',
      count: approved,
      sublabel: 'Fully finalized and sanctioned',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50',
    },
    {
      id: 'DRAFTS_CANCELLED',
      label: 'Drafts & Cancelled',
      count: draftsAndCancelled,
      sublabel: 'Unsubmitted or rescinded',
      icon: Archive,
      iconColor: 'text-slate-500',
      badgeBg: 'bg-slate-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isSelected = activeFilter === stat.id;
        return (
          <div
            key={stat.id}
            onClick={() => onSelectFilter(stat.id)}
            className={`p-4 rounded-xl border bg-white shadow-sm transition-all duration-200 cursor-pointer hover:border-slate-300 hover:shadow-md ${
              isSelected ? 'ring-2 ring-slate-900 border-transparent' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.badgeBg}`}>
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {stat.count}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 font-normal">{stat.sublabel}</p>
          </div>
        );
      })}
    </div>
  );
};
