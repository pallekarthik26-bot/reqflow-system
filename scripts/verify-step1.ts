import { createRequestSchema, transitionRequestSchema } from '../lib/validations';
import { validateStateTransition, TRANSITION_MATRIX, TERMINAL_STATUSES } from '../lib/workflow';
import { requestStore, SEED_USERS } from '../lib/store';
import { Role, Status } from '../lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('--- Testing Zod Validations ---');

// 1. Create Request Schema
const validCreate = createRequestSchema.safeParse({
  title: '  Upgrade Staging Server Cluster  ',
  description: '  Provision additional RAM and CPU units for staging workloads.  ',
});
assert(validCreate.success, 'Valid createRequest input passes');
if (validCreate.success) {
  assert(validCreate.data.title === 'Upgrade Staging Server Cluster', 'Title is trimmed');
  assert(
    validCreate.data.description === 'Provision additional RAM and CPU units for staging workloads.',
    'Description is trimmed'
  );
}

const shortTitle = createRequestSchema.safeParse({
  title: 'ab',
  description: 'Valid description here',
});
assert(!shortTitle.success, 'Short title (<3 chars) fails validation');

const longTitle = createRequestSchema.safeParse({
  title: 'a'.repeat(101),
  description: 'Valid description here',
});
assert(!longTitle.success, 'Long title (>100 chars) fails validation');

const shortDesc = createRequestSchema.safeParse({
  title: 'Valid Title',
  description: 'Four',
});
assert(!shortDesc.success, 'Short description (<5 chars) fails validation');

// 2. Transition Request Schema
const validTransition = transitionRequestSchema.safeParse({
  targetStatus: 'SUBMITTED',
  actorId: 'usr_alice',
  actorRole: 'CREATOR',
  note: 'Ready for review',
});
assert(validTransition.success, 'Valid transitionRequest passes');

const invalidRole = transitionRequestSchema.safeParse({
  targetStatus: 'SUBMITTED',
  actorId: 'usr_alice',
  actorRole: 'ADMIN', // Invalid role
});
assert(!invalidRole.success, 'Invalid actorRole fails validation');

const invalidStatus = transitionRequestSchema.safeParse({
  targetStatus: 'UNKNOWN_STATUS',
  actorId: 'usr_alice',
  actorRole: 'CREATOR',
});
assert(!invalidStatus.success, 'Invalid targetStatus fails validation');

console.log('\n--- Testing Centralized Workflow State Machine ---');

// Matrix checks
assert(TRANSITION_MATRIX.DRAFT.SUBMITTED?.allowedRoles.includes('CREATOR') === true, 'DRAFT -> SUBMITTED allowed for CREATOR');
assert(TRANSITION_MATRIX.DRAFT.CANCELLED?.allowedRoles.includes('CREATOR') === true, 'DRAFT -> CANCELLED allowed for CREATOR');
assert(TRANSITION_MATRIX.SUBMITTED.APPROVED?.allowedRoles.includes('REVIEWER') === true, 'SUBMITTED -> APPROVED allowed for REVIEWER');
assert(TRANSITION_MATRIX.SUBMITTED.REJECTED?.allowedRoles.includes('REVIEWER') === true, 'SUBMITTED -> REJECTED allowed for REVIEWER');
assert(TRANSITION_MATRIX.SUBMITTED.CANCELLED?.allowedRoles.includes('CREATOR') === true, 'SUBMITTED -> CANCELLED allowed for CREATOR');

// Validate state transition function
// 1. Authorized transitions
assert(validateStateTransition('DRAFT', 'SUBMITTED', 'CREATOR').valid === true, 'DRAFT -> SUBMITTED by CREATOR is 200');
assert(validateStateTransition('DRAFT', 'CANCELLED', 'CREATOR').valid === true, 'DRAFT -> CANCELLED by CREATOR is 200');
assert(validateStateTransition('SUBMITTED', 'APPROVED', 'REVIEWER').valid === true, 'SUBMITTED -> APPROVED by REVIEWER is 200');
assert(validateStateTransition('SUBMITTED', 'REJECTED', 'REVIEWER').valid === true, 'SUBMITTED -> REJECTED by REVIEWER is 200');
assert(validateStateTransition('SUBMITTED', 'CANCELLED', 'CREATOR').valid === true, 'SUBMITTED -> CANCELLED by CREATOR is 200');

// 2. Unauthorized role checks (403)
const draftSubReviewer = validateStateTransition('DRAFT', 'SUBMITTED', 'REVIEWER');
assert(draftSubReviewer.valid === false && draftSubReviewer.statusCode === 403, 'DRAFT -> SUBMITTED by REVIEWER returns 403');

const subAppCreator = validateStateTransition('SUBMITTED', 'APPROVED', 'CREATOR');
assert(subAppCreator.valid === false && subAppCreator.statusCode === 403, 'SUBMITTED -> APPROVED by CREATOR returns 403');

const subRejCreator = validateStateTransition('SUBMITTED', 'REJECTED', 'CREATOR');
assert(subRejCreator.valid === false && subRejCreator.statusCode === 403, 'SUBMITTED -> REJECTED by CREATOR returns 403');

const subCancelReviewer = validateStateTransition('SUBMITTED', 'CANCELLED', 'REVIEWER');
assert(subCancelReviewer.valid === false && subCancelReviewer.statusCode === 403, 'SUBMITTED -> CANCELLED by REVIEWER returns 403');

// 3. Workflow conflict / invalid path checks (409)
const draftAppCreator = validateStateTransition('DRAFT', 'APPROVED', 'CREATOR');
assert(draftAppCreator.valid === false && draftAppCreator.statusCode === 409, 'DRAFT -> APPROVED by CREATOR returns 409');

const draftAppReviewer = validateStateTransition('DRAFT', 'APPROVED', 'REVIEWER');
assert(draftAppReviewer.valid === false && draftAppReviewer.statusCode === 409, 'DRAFT -> APPROVED by REVIEWER returns 409');

const sameState = validateStateTransition('DRAFT', 'DRAFT', 'CREATOR');
assert(sameState.valid === false && sameState.statusCode === 409, 'DRAFT -> DRAFT returns 409');

// 4. Terminal states checks (409)
for (const terminal of ['APPROVED', 'REJECTED', 'CANCELLED'] as Status[]) {
  assert(TERMINAL_STATUSES.has(terminal), `${terminal} is terminal`);
  const termRes = validateStateTransition(terminal, 'SUBMITTED', 'CREATOR');
  assert(termRes.valid === false && termRes.statusCode === 409, `${terminal} -> SUBMITTED returns 409`);
}

console.log('\n--- Testing In-Memory Store ---');

const items = requestStore.getAll();
assert(items.length === 3, 'Pre-seeded store has exactly 3 items');

const draftItem = items.find((i) => i.status === 'DRAFT');
assert(!!draftItem && draftItem.title === 'Q4 Marketing Budget Allocation', 'Draft item seeded: Q4 Marketing Budget Allocation');
assert(draftItem?.createdBy.name === 'Alice Chen', 'Draft created by Alice Chen');
assert(draftItem?.history.length === 1, 'Draft has 1 history log');

const submittedItem = items.find((i) => i.status === 'SUBMITTED');
assert(!!submittedItem && submittedItem.title === 'New Developer Laptop Requisition', 'Submitted item seeded: New Developer Laptop Requisition');
assert(submittedItem?.createdBy.name === 'Alice Chen', 'Submitted item created by Alice Chen');
assert(submittedItem?.history.length === 2, 'Submitted item has 2 history logs');

const approvedItem = items.find((i) => i.status === 'APPROVED');
assert(!!approvedItem && approvedItem.title === 'Cloud Infrastructure Capacity Upgrade', 'Approved item seeded: Cloud Infrastructure Capacity Upgrade');
assert(approvedItem?.createdBy.name === 'Alice Chen', 'Approved item created by Alice Chen');
assert(approvedItem?.history.length === 3, 'Approved item has 3 history logs');
assert(approvedItem?.history[2].actorName === 'Bob Martinez', 'Approved by Bob Martinez');

// Test create
const created = requestStore.create({
  title: 'Security Compliance Audit Software',
  description: 'Procurement of automated SOC2 compliance monitoring tools.',
  createdBy: SEED_USERS.ALICE,
});
assert(created.status === 'DRAFT', 'New request starts in DRAFT');
assert(created.history.length === 1, 'New request has initial CREATED_DRAFT history entry');

// Test transitionStatus (valid: Alice submits draft)
const submitRes = requestStore.transitionStatus(created.id, 'SUBMITTED', SEED_USERS.ALICE, 'Ready for Bob to review');
assert(submitRes.success === true, 'Alice successfully submitted draft');
if (submitRes.success) {
  assert(submitRes.data.status === 'SUBMITTED', 'Status updated to SUBMITTED');
  assert(submitRes.data.history.length === 2, 'History updated with second entry');
  assert(submitRes.data.history[1].fromStatus === 'DRAFT', 'History tracks fromStatus: DRAFT');
  assert(submitRes.data.history[1].toStatus === 'SUBMITTED', 'History tracks toStatus: SUBMITTED');
  assert(submitRes.data.history[1].note === 'Ready for Bob to review', 'Note recorded');
}

// Test transitionStatus (unauthorized: Alice tries to approve her own request)
const unauthApprove = requestStore.transitionStatus(created.id, 'APPROVED', SEED_USERS.ALICE, 'Self approval attempt');
assert(unauthApprove.success === false && unauthApprove.statusCode === 403, 'Creator cannot approve: returns 403 Forbidden');

// Test transitionStatus (valid: Bob approves request)
const approveRes = requestStore.transitionStatus(created.id, 'APPROVED', SEED_USERS.BOB, 'Looks good, approved!');
assert(approveRes.success === true, 'Bob successfully approved the request');
if (approveRes.success) {
  assert(approveRes.data.status === 'APPROVED', 'Status updated to APPROVED');
  assert(approveRes.data.history.length === 3, 'History contains 3 entries');
}

// Test transitionStatus on terminal state (cannot transition after approved)
const afterApproved = requestStore.transitionStatus(created.id, 'SUBMITTED', SEED_USERS.ALICE, 'Try to reopen');
assert(afterApproved.success === false && afterApproved.statusCode === 409, 'Cannot transition terminal APPROVED request: returns 409');

// Test not found
const notFound = requestStore.transitionStatus('non_existent_id', 'SUBMITTED', SEED_USERS.ALICE);
assert(notFound.success === false && notFound.statusCode === 404, 'Non-existent item returns 404');

console.log('\n🎉 ALL STEP 1 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
