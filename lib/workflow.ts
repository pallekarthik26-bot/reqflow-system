import { Role, Status } from './types';

export interface TransitionRule {
  allowedRoles: readonly Role[];
  description: string;
}

export interface TransitionValidationResult {
  valid: boolean;
  statusCode: number;
  error?: string;
}

/**
 * Terminal statuses that cannot undergo any further state transitions.
 */
export const TERMINAL_STATUSES: ReadonlySet<Status> = new Set<Status>([
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

/**
 * Clean transition matrix defining valid state paths and authorized roles.
 *
 * Rules:
 * - DRAFT -> SUBMITTED (Only CREATOR)
 * - DRAFT -> CANCELLED (Only CREATOR)
 * - SUBMITTED -> APPROVED (Only REVIEWER)
 * - SUBMITTED -> REJECTED (Only REVIEWER)
 * - SUBMITTED -> CANCELLED (Only CREATOR)
 * - Terminal states (APPROVED, REJECTED, CANCELLED) have no outbound transitions.
 */
export const TRANSITION_MATRIX: Record<Status, Partial<Record<Status, TransitionRule>>> = {
  DRAFT: {
    SUBMITTED: {
      allowedRoles: ['CREATOR'],
      description: 'Submit request for reviewer approval',
    },
    CANCELLED: {
      allowedRoles: ['CREATOR'],
      description: 'Cancel draft request',
    },
  },
  SUBMITTED: {
    APPROVED: {
      allowedRoles: ['REVIEWER'],
      description: 'Approve submitted request',
    },
    REJECTED: {
      allowedRoles: ['REVIEWER'],
      description: 'Reject submitted request',
    },
    CANCELLED: {
      allowedRoles: ['CREATOR'],
      description: 'Cancel request before review is finalized',
    },
  },
  APPROVED: {},
  REJECTED: {},
  CANCELLED: {},
};

/**
 * Validates whether a state transition is permitted for a given current status,
 * target status, and actor role.
 *
 * Returns:
 * - 409 Conflict: if transition is not permitted in the workflow (e.g. invalid path, terminal state, self-transition)
 * - 403 Forbidden: if transition exists but actor's role is unauthorized
 * - 200 OK: if transition is valid
 */
export function validateStateTransition(
  current: Status,
  next: Status,
  role: Role
): TransitionValidationResult {
  // Disallow no-op self transitions
  if (current === next) {
    return {
      valid: false,
      statusCode: 409,
      error: `Conflict: Request is already in '${current}' status.`,
    };
  }

  // Check terminal state restriction
  if (TERMINAL_STATUSES.has(current)) {
    return {
      valid: false,
      statusCode: 409,
      error: `Conflict: Cannot transition from terminal state '${current}'.`,
    };
  }

  // Check if transition path exists in workflow matrix
  const transitionRule = TRANSITION_MATRIX[current]?.[next];
  if (!transitionRule) {
    return {
      valid: false,
      statusCode: 409,
      error: `Conflict: Transition from '${current}' to '${next}' is not permitted in the workflow.`,
    };
  }

  // Check role authorization
  if (!transitionRule.allowedRoles.includes(role)) {
    const requiredRoles = transitionRule.allowedRoles.join(' or ');
    return {
      valid: false,
      statusCode: 403,
      error: `Forbidden: Actor with role '${role}' is not authorized to transition request from '${current}' to '${next}'. Requires role: ${requiredRoles}.`,
    };
  }

  return {
    valid: true,
    statusCode: 200,
  };
}

/**
 * Checks whether a given status is a terminal state.
 */
export function isTerminalStatus(status: Status): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Retrieves allowed next statuses from current status, optionally filtered by role.
 */
export function getAvailableTransitions(current: Status, role?: Role): Status[] {
  const transitions = TRANSITION_MATRIX[current] || {};
  const nextStatuses = Object.keys(transitions) as Status[];

  if (!role) {
    return nextStatuses;
  }

  return nextStatuses.filter((next) =>
    transitions[next]?.allowedRoles.includes(role)
  );
}
