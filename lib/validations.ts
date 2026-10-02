import { z } from 'zod';
import { Role, Status } from './types';

export const STATUS_VALUES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const satisfies readonly Status[];

export const ROLE_VALUES = [
  'CREATOR',
  'REVIEWER',
] as const satisfies readonly Role[];

/**
 * Validation schema for creating a new request.
 * - title: string, 3 to 100 chars, trimmed
 * - description: string, 5 to 500 chars, trimmed
 */
export const createRequestSchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .trim()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(100, { message: 'Title cannot exceed 100 characters' }),
  description: z
    .string({ message: 'Description is required' })
    .trim()
    .min(5, { message: 'Description must be at least 5 characters long' })
    .max(500, { message: 'Description cannot exceed 500 characters' }),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

/**
 * Validation schema for requesting a state transition.
 * - targetStatus: Status enum
 * - actorId: string
 * - actorRole: Role enum
 * - note: optional string (up to 500 chars)
 */
export const transitionRequestSchema = z.object({
  targetStatus: z.enum(STATUS_VALUES, {
    message: 'Invalid target status provided',
  }),
  actorId: z
    .string({ message: 'Actor ID is required' })
    .trim()
    .min(1, { message: 'Actor ID cannot be empty' }),
  actorRole: z.enum(ROLE_VALUES, {
    message: 'Invalid actor role provided',
  }),
  note: z
    .string()
    .trim()
    .max(500, { message: 'Note cannot exceed 500 characters' })
    .optional(),
});

export type TransitionRequestInput = z.infer<typeof transitionRequestSchema>;
