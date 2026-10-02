/**
 * Request Workflow Approval System - Core Domain Types
 */

export type Role = 'CREATOR' | 'REVIEWER';

export type Status = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface HistoryEntry {
  timestamp: string;
  action: string;
  actorRole: Role;
  actorName: string;
  fromStatus?: Status;
  toStatus: Status;
  note?: string;
}

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  status: Status;
  createdBy: {
    id: string;
    name: string;
    role: Role;
  };
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export interface Actor {
  id: string;
  name: string;
  role: Role;
}
