import { NextRequest, NextResponse } from 'next/server';
import { requestStore, SEED_USERS } from '@/lib/store';
import { transitionRequestSchema } from '@/lib/validations';
import { validateStateTransition } from '@/lib/workflow';
import { Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/requests/[id]/transition
 * Perform a controlled status transition (Submit, Approve, Reject, Cancel).
 * Strictly leverages centralized state machine and in-memory store.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request ID is required.',
        },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON request payload.',
        },
        { status: 400 }
      );
    }

    // Extract actor info from request headers or body
    const headerUserId = req.headers.get('x-user-id');
    const headerUserRole = req.headers.get('x-user-role');
    const headerUserName = req.headers.get('x-user-name');

    const actorId = headerUserId || body.actorId || body.userId;
    const actorRole = (headerUserRole || body.actorRole || body.userRole) as Role;
    const actorName =
      headerUserName ||
      body.actorName ||
      body.userName ||
      (actorRole === 'REVIEWER' ? SEED_USERS.BOB.name : SEED_USERS.ALICE.name);

    // Validate payload against transitionRequestSchema
    const validationResult = transitionRequestSchema.safeParse({
      targetStatus: body.targetStatus,
      note: body.note,
      actorId,
      actorRole,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { targetStatus, note } = validationResult.data;

    // Retrieve request from store by id
    const existingRequest = requestStore.getById(id);
    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request not found',
        },
        { status: 404 }
      );
    }

    // Call centralized state machine validation
    const stateValidation = validateStateTransition(existingRequest.status, targetStatus, actorRole);
    if (!stateValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: stateValidation.error,
        },
        { status: stateValidation.statusCode }
      );
    }

    // Transition status and record history log in store
    const transitionResult = requestStore.transitionStatus(
      id,
      targetStatus,
      {
        id: actorId,
        name: actorName,
        role: actorRole,
      },
      note
    );

    if (!transitionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: transitionResult.error,
        },
        { status: transitionResult.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: transitionResult.data,
        message: `Request status transitioned to ${targetStatus}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error transitioning request status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to transition request due to an internal server error.',
      },
      { status: 500 }
    );
  }
}
