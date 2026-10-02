import { Actor, HistoryEntry, RequestItem, Role, Status } from './types';
import { validateStateTransition } from './workflow';

/**
 * Seed data users
 */
export const SEED_USERS = {
  ALICE: {
    id: 'usr_alice_creator',
    name: 'Alice Chen',
    role: 'CREATOR' as Role,
  },
  BOB: {
    id: 'usr_bob_reviewer',
    name: 'Bob Martinez',
    role: 'REVIEWER' as Role,
  },
} as const;

/**
 * Realistic initial seed data representing three distinct stages in the workflow lifecycle.
 */
export function getInitialSeedData(): RequestItem[] {
  return [
    {
      id: 'req_01_mktg_budget',
      title: 'Q4 Marketing Budget Allocation',
      description:
        'Proposed operational budget of $45,000 for Q4 digital acquisition campaigns, conference sponsorships, and customer advocacy content production.',
      status: 'DRAFT',
      createdBy: {
        id: SEED_USERS.ALICE.id,
        name: SEED_USERS.ALICE.name,
        role: SEED_USERS.ALICE.role,
      },
      createdAt: '2026-09-28T09:15:00.000Z',
      updatedAt: '2026-09-28T09:15:00.000Z',
      history: [
        {
          timestamp: '2026-09-28T09:15:00.000Z',
          action: 'CREATED_DRAFT',
          actorRole: 'CREATOR',
          actorName: 'Alice Chen',
          toStatus: 'DRAFT',
          note: 'Initial draft created with preliminary Q4 spend forecasts.',
        },
      ],
    },
    {
      id: 'req_02_dev_laptop',
      title: 'New Developer Laptop Requisition',
      description:
        'Requesting a 16-inch MacBook Pro M3 Max (36GB RAM, 1TB SSD) for newly onboarded senior backend engineer joining the platform team.',
      status: 'SUBMITTED',
      createdBy: {
        id: SEED_USERS.ALICE.id,
        name: SEED_USERS.ALICE.name,
        role: SEED_USERS.ALICE.role,
      },
      createdAt: '2026-10-01T11:30:00.000Z',
      updatedAt: '2026-10-01T14:45:00.000Z',
      history: [
        {
          timestamp: '2026-10-01T11:30:00.000Z',
          action: 'CREATED_DRAFT',
          actorRole: 'CREATOR',
          actorName: 'Alice Chen',
          toStatus: 'DRAFT',
          note: 'Drafted hardware specifications based on engineering equipment tiers.',
        },
        {
          timestamp: '2026-10-01T14:45:00.000Z',
          action: 'SUBMITTED_FOR_REVIEW',
          actorRole: 'CREATOR',
          actorName: 'Alice Chen',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          note: 'Submitted request for departmental procurement approval.',
        },
      ],
    },
    {
      id: 'req_03_cloud_infra',
      title: 'Cloud Infrastructure Capacity Upgrade',
      description:
        'Provisioning an additional AWS RDS Multi-AZ read replica and scaling Redis ElastiCache cluster sizing to handle projected Q4 traffic surges.',
      status: 'APPROVED',
      createdBy: {
        id: SEED_USERS.ALICE.id,
        name: SEED_USERS.ALICE.name,
        role: SEED_USERS.ALICE.role,
      },
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-22T16:20:00.000Z',
      history: [
        {
          timestamp: '2026-09-20T10:00:00.000Z',
          action: 'CREATED_DRAFT',
          actorRole: 'CREATOR',
          actorName: 'Alice Chen',
          toStatus: 'DRAFT',
          note: 'Initial scope based on recent synthetic stress testing benchmarks.',
        },
        {
          timestamp: '2026-09-20T15:10:00.000Z',
          action: 'SUBMITTED_FOR_REVIEW',
          actorRole: 'CREATOR',
          actorName: 'Alice Chen',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          note: 'Forwarded for engineering management and FinOps sign-off.',
        },
        {
          timestamp: '2026-09-22T16:20:00.000Z',
          action: 'APPROVED_BY_REVIEWER',
          actorRole: 'REVIEWER',
          actorName: 'Bob Martinez',
          fromStatus: 'SUBMITTED',
          toStatus: 'APPROVED',
          note: 'Approved after architecture review and verified budget availability.',
        },
      ],
    },
  ];
}

export interface CreateRequestData {
  title: string;
  description: string;
  createdBy: Actor;
  initialNote?: string;
}

export type TransitionResult =
  | { success: true; statusCode: 200; data: RequestItem }
  | { success: false; statusCode: number; error: string };

/**
 * Thread-safe singleton repository for requests with in-memory persistence.
 * Preserves state across Next.js dev server hot-reloads via globalThis.
 */
export class RequestStore {
  private items: Map<string, RequestItem> = new Map();

  constructor(initialData?: RequestItem[]) {
    this.seed(initialData || getInitialSeedData());
  }

  /**
   * Resets the store with fresh seed data.
   */
  public seed(data: RequestItem[]): void {
    this.items.clear();
    for (const item of data) {
      // Store a deep copy to prevent external mutation
      this.items.set(item.id, JSON.parse(JSON.stringify(item)));
    }
  }

  /**
   * Retrieves all requests, sorted by updatedAt descending.
   */
  public getAll(): RequestItem[] {
    const list = Array.from(this.items.values());
    return list
      .map((item) => JSON.parse(JSON.stringify(item)))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Retrieves a single request by ID.
   */
  public getById(id: string): RequestItem | null {
    const item = this.items.get(id);
    if (!item) {
      return null;
    }
    return JSON.parse(JSON.stringify(item));
  }

  /**
   * Creates a new request in DRAFT status.
   */
  public create(data: CreateRequestData): RequestItem {
    const now = new Date().toISOString();
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const initialHistory: HistoryEntry = {
      timestamp: now,
      action: 'CREATED_DRAFT',
      actorRole: data.createdBy.role,
      actorName: data.createdBy.name,
      toStatus: 'DRAFT',
      note: data.initialNote || 'Created draft request',
    };

    const newItem: RequestItem = {
      id,
      title: data.title.trim(),
      description: data.description.trim(),
      status: 'DRAFT',
      createdBy: {
        id: data.createdBy.id,
        name: data.createdBy.name,
        role: data.createdBy.role,
      },
      createdAt: now,
      updatedAt: now,
      history: [initialHistory],
    };

    this.items.set(id, newItem);
    return JSON.parse(JSON.stringify(newItem));
  }

  /**
   * Transitions request status through the state machine validation.
   */
  public transitionStatus(
    id: string,
    targetStatus: Status,
    actor: Actor,
    note?: string
  ): TransitionResult {
    const item = this.items.get(id);
    if (!item) {
      return {
        success: false,
        statusCode: 404,
        error: `Request with ID '${id}' was not found.`,
      };
    }

    // Validate transition via centralized state machine
    const validation = validateStateTransition(item.status, targetStatus, actor.role);
    if (!validation.valid) {
      return {
        success: false,
        statusCode: validation.statusCode,
        error: validation.error || 'Transition not allowed.',
      };
    }

    const previousStatus = item.status;
    const now = new Date().toISOString();

    const historyEntry: HistoryEntry = {
      timestamp: now,
      action: `TRANSITION_TO_${targetStatus}`,
      actorRole: actor.role,
      actorName: actor.name,
      fromStatus: previousStatus,
      toStatus: targetStatus,
      note: note?.trim() || undefined,
    };

    item.status = targetStatus;
    item.updatedAt = now;
    item.history.push(historyEntry);

    return {
      success: true,
      statusCode: 200,
      data: JSON.parse(JSON.stringify(item)),
    };
  }
}

// Global declaration for singleton across hot module reloads in Next.js development
declare global {
  // eslint-disable-next-line no-var
  var __requestWorkflowStore: RequestStore | undefined;
}

export const requestStore =
  globalThis.__requestWorkflowStore ?? (globalThis.__requestWorkflowStore = new RequestStore());
