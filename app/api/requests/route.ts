import { NextRequest, NextResponse } from 'next/server';
import { requestStore, SEED_USERS } from '@/lib/store';
import { createRequestSchema } from '@/lib/validations';
import { Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/requests
 * Fetch all requests from the in-memory store sorted by updatedAt descending.
 */
export async function GET() {
  try {
    const requests = requestStore.getAll();
    // Guarantee strict descending sort by updatedAt
    requests.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(
      {
        success: true,
        data: requests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve requests due to an internal server error.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requests
 * Create a new draft request.
 * Enforces CREATOR role check and input validation.
 */
export async function POST(req: NextRequest) {
  try {
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

    // Extract user info from headers (priority) or fallback to body
    const headerUserId = req.headers.get('x-user-id');
    const headerUserRole = req.headers.get('x-user-role');
    const headerUserName = req.headers.get('x-user-name');

    const actorId = headerUserId || body.userId || body.createdBy?.id || SEED_USERS.ALICE.id;
    const actorRole = (headerUserRole || body.userRole || body.createdBy?.role || '') as Role;
    const actorName = headerUserName || body.userName || body.createdBy?.name || SEED_USERS.ALICE.name;

    // Enforce Role: Only users with the CREATOR role can create requests
    if (actorRole !== 'CREATOR') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only users with the CREATOR role can create requests.',
        },
        { status: 403 }
      );
    }

    // Validate body against createRequestSchema
    const validationResult = createRequestSchema.safeParse(body);
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

    const { title, description } = validationResult.data;

    // Create request with initial DRAFT status & "Created draft request" history log
    const createdRequest = requestStore.create({
      title,
      description,
      createdBy: {
        id: actorId,
        name: actorName,
        role: actorRole,
      },
      initialNote: 'Created draft request',
    });

    return NextResponse.json(
      {
        success: true,
        data: createdRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create request due to an internal server error.',
      },
      { status: 500 }
    );
  }
}
