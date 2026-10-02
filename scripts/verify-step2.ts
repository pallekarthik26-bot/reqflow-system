import { NextRequest } from 'next/server';
import { GET as getRequests, POST as createRequest } from '../app/api/requests/route';
import { POST as transitionRequest } from '../app/api/requests/[id]/transition/route';
import { requestStore, getInitialSeedData } from '../lib/store';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runStep2Tests() {
  console.log('--- Step 2 API Route Verification ---');

  // Reset store to known state
  requestStore.seed(getInitialSeedData());

  // 1. Test GET /api/requests
  console.log('\n[GET /api/requests]');
  const getRes = await getRequests();
  assert(getRes.status === 200, 'GET /api/requests returns HTTP 200');
  const getData = await getRes.json();
  assert(getData.success === true, 'GET response has success: true');
  assert(Array.isArray(getData.data), 'GET response data is an array');
  assert(getData.data.length === 3, 'GET response returns all 3 pre-seeded items');

  // Verify sort order descending by updatedAt
  for (let i = 0; i < getData.data.length - 1; i++) {
    const timeA = new Date(getData.data[i].updatedAt).getTime();
    const timeB = new Date(getData.data[i + 1].updatedAt).getTime();
    assert(timeA >= timeB, `Item ${i} updatedAt >= Item ${i + 1} updatedAt (descending order)`);
  }

  // 2. Test POST /api/requests (Role Enforcement)
  console.log('\n[POST /api/requests - Role Authorization]');
  const unauthReq = new NextRequest('http://localhost:3000/api/requests', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_bob_reviewer',
      'x-user-role': 'REVIEWER',
      'x-user-name': 'Bob Martinez',
    },
    body: JSON.stringify({
      title: 'New Server Provisioning',
      description: 'Requesting staging server allocation.',
    }),
  });
  const unauthRes = await createRequest(unauthReq);
  assert(unauthRes.status === 403, 'POST /api/requests with REVIEWER role returns 403');
  const unauthData = await unauthRes.json();
  assert(
    unauthData.error === 'Only users with the CREATOR role can create requests.',
    '403 error message matches requirement exactly'
  );

  // 3. Test POST /api/requests (Validation Failure)
  console.log('\n[POST /api/requests - Validation]');
  const invalidReq = new NextRequest('http://localhost:3000/api/requests', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_alice_creator',
      'x-user-role': 'CREATOR',
      'x-user-name': 'Alice Chen',
    },
    body: JSON.stringify({
      title: 'ab', // < 3 chars
      description: 'hi', // < 5 chars
    }),
  });
  const invalidRes = await createRequest(invalidReq);
  assert(invalidRes.status === 400, 'Invalid title and description returns 400');
  const invalidData = await invalidRes.json();
  assert(invalidData.success === false, 'Validation failure returns success: false');
  assert(invalidData.error === 'Validation failed', 'Error is "Validation failed"');
  assert(!!invalidData.details?.title, 'Details contains title error');
  assert(!!invalidData.details?.description, 'Details contains description error');

  // 4. Test POST /api/requests (Successful Creation)
  console.log('\n[POST /api/requests - Successful Creation]');
  const validCreateReq = new NextRequest('http://localhost:3000/api/requests', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_alice_creator',
      'x-user-role': 'CREATOR',
      'x-user-name': 'Alice Chen',
    },
    body: JSON.stringify({
      title: 'Ergonomic Standing Desk Requisition',
      description: 'Dual-motor motorized standing desk with cable management tray.',
    }),
  });
  const createRes = await createRequest(validCreateReq);
  assert(createRes.status === 201, 'POST /api/requests returns 201 Created');
  const createData = await createRes.json();
  assert(createData.success === true, 'Create response has success: true');
  assert(createData.data.status === 'DRAFT', 'Created request status is DRAFT');
  assert(createData.data.createdBy.role === 'CREATOR', 'Created by has role CREATOR');
  assert(createData.data.history.length === 1, 'History array initialized with 1 entry');
  assert(
    createData.data.history[0].note === 'Created draft request',
    'History note is "Created draft request"'
  );
  const newRequestId = createData.data.id;

  // 5. Test POST /api/requests/[id]/transition (404 Not Found)
  console.log('\n[POST /api/requests/[id]/transition - 404]');
  const notFoundReq = new NextRequest('http://localhost:3000/api/requests/fake_id/transition', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_alice_creator',
      'x-user-role': 'CREATOR',
    },
    body: JSON.stringify({
      targetStatus: 'SUBMITTED',
      note: 'Submit draft',
    }),
  });
  const notFoundRes = await transitionRequest(notFoundReq, {
    params: Promise.resolve({ id: 'fake_id' }),
  });
  assert(notFoundRes.status === 404, 'Non-existent ID returns 404');
  const notFoundData = await notFoundRes.json();
  assert(notFoundData.error === 'Request not found', '404 message is "Request not found"');

  // 6. Test POST /api/requests/[id]/transition (403 Unauthorized Role Transition)
  console.log('\n[POST /api/requests/[id]/transition - 403 Forbidden]');
  // Bob (REVIEWER) tries to submit Alice's draft
  const unauthTransReq = new NextRequest(`http://localhost:3000/api/requests/${newRequestId}/transition`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_bob_reviewer',
      'x-user-role': 'REVIEWER',
      'x-user-name': 'Bob Martinez',
    },
    body: JSON.stringify({
      targetStatus: 'SUBMITTED',
      note: 'Attempting unauthorized submission',
    }),
  });
  const unauthTransRes = await transitionRequest(unauthTransReq, {
    params: Promise.resolve({ id: newRequestId }),
  });
  assert(unauthTransRes.status === 403, 'REVIEWER attempting DRAFT -> SUBMITTED returns 403');
  const unauthTransData = await unauthTransRes.json();
  assert(unauthTransData.success === false, '403 has success: false');

  // 7. Test POST /api/requests/[id]/transition (409 Conflict - Invalid Transition Path)
  console.log('\n[POST /api/requests/[id]/transition - 409 Conflict]');
  // Alice tries DRAFT -> APPROVED directly
  const conflictReq = new NextRequest(`http://localhost:3000/api/requests/${newRequestId}/transition`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_alice_creator',
      'x-user-role': 'CREATOR',
      'x-user-name': 'Alice Chen',
    },
    body: JSON.stringify({
      targetStatus: 'APPROVED',
      note: 'Skip review',
    }),
  });
  const conflictRes = await transitionRequest(conflictReq, {
    params: Promise.resolve({ id: newRequestId }),
  });
  assert(conflictRes.status === 409, 'DRAFT -> APPROVED returns 409 Conflict');
  const conflictData = await conflictRes.json();
  assert(conflictData.success === false, '409 response has success: false');

  // 8. Test POST /api/requests/[id]/transition (200 OK - Alice submits draft)
  console.log('\n[POST /api/requests/[id]/transition - 200 OK Submit]');
  const validSubmitReq = new NextRequest(`http://localhost:3000/api/requests/${newRequestId}/transition`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_alice_creator',
      'x-user-role': 'CREATOR',
      'x-user-name': 'Alice Chen',
    },
    body: JSON.stringify({
      targetStatus: 'SUBMITTED',
      note: 'Forwarding to Bob for approval',
    }),
  });
  const validSubmitRes = await transitionRequest(validSubmitReq, {
    params: Promise.resolve({ id: newRequestId }),
  });
  assert(validSubmitRes.status === 200, 'Valid submit returns 200');
  const validSubmitData = await validSubmitRes.json();
  assert(validSubmitData.success === true, 'Submit response has success: true');
  assert(validSubmitData.data.status === 'SUBMITTED', 'Status changed to SUBMITTED');
  assert(
    validSubmitData.message === 'Request status transitioned to SUBMITTED',
    'Message is "Request status transitioned to SUBMITTED"'
  );
  assert(validSubmitData.data.history.length === 2, 'History has 2 entries');
  assert(validSubmitData.data.history[1].fromStatus === 'DRAFT', 'fromStatus is DRAFT');
  assert(validSubmitData.data.history[1].toStatus === 'SUBMITTED', 'toStatus is SUBMITTED');
  assert(validSubmitData.data.history[1].actorRole === 'CREATOR', 'actorRole is CREATOR');
  assert(validSubmitData.data.history[1].actorName === 'Alice Chen', 'actorName is Alice Chen');
  assert(validSubmitData.data.history[1].note === 'Forwarding to Bob for approval', 'Note is saved');

  // 9. Test POST /api/requests/[id]/transition (200 OK - Bob approves)
  console.log('\n[POST /api/requests/[id]/transition - 200 OK Approve]');
  const validApproveReq = new NextRequest(`http://localhost:3000/api/requests/${newRequestId}/transition`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_bob_reviewer',
      'x-user-role': 'REVIEWER',
      'x-user-name': 'Bob Martinez',
    },
    body: JSON.stringify({
      targetStatus: 'APPROVED',
      note: 'Budget verified. Approved.',
    }),
  });
  const validApproveRes = await transitionRequest(validApproveReq, {
    params: Promise.resolve({ id: newRequestId }),
  });
  assert(validApproveRes.status === 200, 'Bob approving returns 200');
  const validApproveData = await validApproveRes.json();
  assert(validApproveData.data.status === 'APPROVED', 'Status changed to APPROVED');
  assert(
    validApproveData.message === 'Request status transitioned to APPROVED',
    'Message is "Request status transitioned to APPROVED"'
  );
  assert(validApproveData.data.history.length === 3, 'History has 3 entries');
  assert(validApproveData.data.history[2].fromStatus === 'SUBMITTED', 'fromStatus is SUBMITTED');
  assert(validApproveData.data.history[2].toStatus === 'APPROVED', 'toStatus is APPROVED');
  assert(validApproveData.data.history[2].actorRole === 'REVIEWER', 'actorRole is REVIEWER');
  assert(validApproveData.data.history[2].actorName === 'Bob Martinez', 'actorName is Bob Martinez');

  // 10. Test POST /api/requests/[id]/transition (409 Conflict - Terminal State)
  console.log('\n[POST /api/requests/[id]/transition - 409 Terminal State]');
  const terminalReq = new NextRequest(`http://localhost:3000/api/requests/${newRequestId}/transition`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'usr_bob_reviewer',
      'x-user-role': 'REVIEWER',
    },
    body: JSON.stringify({
      targetStatus: 'REJECTED',
      note: 'Attempting to change approved request',
    }),
  });
  const terminalRes = await transitionRequest(terminalReq, {
    params: Promise.resolve({ id: newRequestId }),
  });
  assert(terminalRes.status === 409, 'Transitioning terminal state returns 409 Conflict');

  console.log('\n🎉 ALL STEP 2 BACKEND API TESTS PASSED! 🎉');
}

runStep2Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
