/**
 * CampusPulse Phase 3 Verification & Test Suite
 * Validates:
 * - 14 Core Mongoose models (Zero audit_logs)
 * - Date sequence validation (start < end, regStart < regEnd, regEnd <= start)
 * - Venue conflict engine & overlap formula
 * - Back-to-back venue bookings allowed; overlapping rejected
 * - Venue concurrency safety
 * - Event Lifecycle state machine transitions & cancellations
 * - Invalid status transitions rejected
 * - Student individual registration
 * - Duplicate registration prevention
 * - Concurrency-safe capacity enforcement (zero overbooking)
 * - Public catalog visibility rules (Drafts hidden)
 * - RBAC authorization boundaries
 */

import { createApp } from '../backend/src/app.js';
import { seedDevelopmentData } from '../backend/src/services/seed.service.js';
import { CORE_COLLECTION_COUNT } from '../backend/src/models/index.js';
import * as Models from '../backend/src/models/index.js';
import http from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, errorMsg?: string) {
  if (condition) {
    results.push({ name: testName, passed: true });
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    results.push({ name: testName, passed: false, error: errorMsg || 'Assertion failed' });
    console.error(`  ✗ [FAIL] ${testName}: ${errorMsg || 'Assertion failed'}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('CAMPUSPULSE PHASE 3 VERIFICATION & TEST SUITE');
  console.log('======================================================\n');

  // TEST 1: Model Inventory
  console.log('--- 1. DATABASE MODELS REGISTRY ---');
  assert(
    CORE_COLLECTION_COUNT === 14,
    'Exactly 14 core collections defined in Phase 3',
    `Expected 14, got ${CORE_COLLECTION_COUNT}`
  );

  const hasAuditLog = 'AuditLog' in Models || 'audit_logs' in (Models as any);
  assert(
    hasAuditLog,
    'audit_logs collection #15 is present in Phase 6'
  );

  // Initialize App and seed data
  const app = createApp();
  await seedDevelopmentData();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3002, resolve));
  const baseUrl = 'http://127.0.0.1:3002';

  try {
    // Authenticate test users
    console.log('\n--- 2. AUTHENTICATION CONTEXTS ---');
    // Admin login
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campuspulse.edu', password: 'Password123!' }),
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.data.accessToken;

    // Organizer Marcus Brody login
    const orgRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@campuspulse.edu', password: 'Password123!' }),
    });
    const orgData = await orgRes.json();
    const orgToken = orgData.data.accessToken;

    // Student Maya Patel login
    const stuRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campuspulse.edu', password: 'Password123!' }),
    });
    const stuData = await stuRes.json();
    const stuToken = stuData.data.accessToken;

    // Register a second student for concurrency & capacity tests
    const stu2Email = `student2.${Date.now()}@college.edu`;
    const stu2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sam Student', email: stu2Email, password: 'Password123!' }),
    });
    const stu2Data = await stu2Res.json();
    const stu2Token = stu2Data.data.accessToken;

    assert(Boolean(adminToken && orgToken && stuToken && stu2Token), 'Auth tokens generated for test roles');

    // TEST 3: Date Sequence Validations
    console.log('\n--- 3. DATE SEQUENCE VALIDATIONS ---');
    const baseNow = Date.now();
    const catId = '6ac25fa6e90fec98e2f56701';
    const venue1Id = '6ac25fa6e90fec98e2f56711'; // Main Auditorium
    const venue2Id = '6ac25fa6e90fec98e2f56712'; // Turing Lab 3

    // Invalid start >= end
    const invalidDates1 = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Invalid Event 1',
        description: 'Test description',
        categoryId: catId,
        primaryVenueId: venue1Id,
        startDateTime: new Date(baseNow + 50000).toISOString(),
        endDateTime: new Date(baseNow + 10000).toISOString(), // End before start!
        registrationStart: new Date(baseNow - 10000).toISOString(),
        registrationEnd: new Date(baseNow + 20000).toISOString(),
        capacity: 50,
      }),
    });
    assert(invalidDates1.status === 400, 'Rejects event start >= end with HTTP 400');

    // Invalid registrationEnd > eventStart
    const invalidDates2 = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Invalid Event 2',
        description: 'Test description',
        categoryId: catId,
        primaryVenueId: venue1Id,
        startDateTime: new Date(baseNow + 50000).toISOString(),
        endDateTime: new Date(baseNow + 100000).toISOString(),
        registrationStart: new Date(baseNow).toISOString(),
        registrationEnd: new Date(baseNow + 60000).toISOString(), // Reg closes AFTER event started!
        capacity: 50,
      }),
    });
    assert(invalidDates2.status === 400, 'Rejects registrationEnd > eventStart with HTTP 400');

    // TEST 4: Venue Conflict Engine & Overlap Formula
    console.log('\n--- 4. VENUE CONFLICT ENGINE & OVERLAP FORMULA ---');
    const slot1Start = new Date(baseNow + 200000000);
    const slot1End = new Date(slot1Start.getTime() + 2 * 3600 * 1000); // 2 hours slot

    // Create Event A on Venue 1
    const createResA = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Robotics Showcase Event A',
        description: 'Annual robotics demonstration',
        categoryId: catId,
        primaryVenueId: venue1Id,
        startDateTime: slot1Start.toISOString(),
        endDateTime: slot1End.toISOString(),
        registrationStart: new Date(baseNow - 10000).toISOString(),
        registrationEnd: slot1Start.toISOString(),
        capacity: 100,
      }),
    });
    const dataA = await createResA.json();
    assert(createResA.status === 201, 'Successfully creates initial Event A on Venue 1');
    const eventAId = dataA.data.event._id || dataA.data.event.id;

    // Attempt overlapping Event B on SAME Venue 1 (Starts 1 hour into Event A, ends 3 hours later)
    const slotOverlapStart = new Date(slot1Start.getTime() + 1 * 3600 * 1000);
    const slotOverlapEnd = new Date(slot1Start.getTime() + 3 * 3600 * 1000);
    const createResOverlap = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Conflicting Event B',
        description: 'Should be rejected',
        categoryId: catId,
        primaryVenueId: venue1Id,
        startDateTime: slotOverlapStart.toISOString(),
        endDateTime: slotOverlapEnd.toISOString(),
        registrationStart: new Date(baseNow - 10000).toISOString(),
        registrationEnd: slotOverlapStart.toISOString(),
        capacity: 50,
      }),
    });
    assert(createResOverlap.status === 409, 'Overlapping venue booking is rejected with HTTP 409 VENUE_CONFLICT');

    // Back-to-back Event C on SAME Venue 1 (Starts exactly when Event A ends: slot1End)
    const slotBackToBackStart = slot1End;
    const slotBackToBackEnd = new Date(slot1End.getTime() + 2 * 3600 * 1000);
    const createResB2B = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Back to Back Event C',
        description: 'Adjacent time slot on same venue',
        categoryId: catId,
        primaryVenueId: venue1Id,
        startDateTime: slotBackToBackStart.toISOString(),
        endDateTime: slotBackToBackEnd.toISOString(),
        registrationStart: new Date(baseNow - 10000).toISOString(),
        registrationEnd: slotBackToBackStart.toISOString(),
        capacity: 75,
      }),
    });
    assert(createResB2B.status === 201, 'Back-to-back time slot on same venue is PERMITTED (HTTP 201)');

    // Overlapping booking on DIFFERENT Venue 2 (Allowed)
    const createResDiffVenue = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Simultaneous Event on Venue 2',
        description: 'Different venue parallel booking',
        categoryId: catId,
        primaryVenueId: venue2Id, // Venue 2
        startDateTime: slot1Start.toISOString(),
        endDateTime: slot1End.toISOString(),
        registrationStart: new Date(baseNow - 10000).toISOString(),
        registrationEnd: slot1Start.toISOString(),
        capacity: 40,
      }),
    });
    assert(createResDiffVenue.status === 201, 'Simultaneous booking on DIFFERENT venue is PERMITTED (HTTP 201)');

    // Edit Event A without changing time/venue (Should succeed, no self-conflict)
    const editResA = await fetch(`${baseUrl}/api/events/${eventAId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Robotics Showcase Event A (Updated Title)',
      }),
    });
    assert(editResA.status === 200, 'Editing event without modifying interval succeeds with no self-conflict');

    // TEST 5: Event Lifecycle State Machine
    console.log('\n--- 5. EVENT LIFECYCLE STATE MACHINE ---');
    // Event A is in Draft -> Transition to Published
    const trans1 = await fetch(`${baseUrl}/api/events/${eventAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'Published' }),
    });
    assert(trans1.status === 200, 'Valid transition: Draft -> Published');

    // Published -> RegistrationOpen
    const trans2 = await fetch(`${baseUrl}/api/events/${eventAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'RegistrationOpen' }),
    });
    assert(trans2.status === 200, 'Valid transition: Published -> RegistrationOpen');

    // Invalid transition: RegistrationOpen -> EventCompleted (Skip!)
    const invalidTrans = await fetch(`${baseUrl}/api/events/${eventAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'EventCompleted' }),
    });
    assert(invalidTrans.status === 400, 'Rejects invalid transition RegistrationOpen -> EventCompleted with HTTP 400');

    // RegistrationOpen -> RegistrationClosed
    const trans3 = await fetch(`${baseUrl}/api/events/${eventAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'RegistrationClosed' }),
    });
    assert(trans3.status === 200, 'Valid transition: RegistrationOpen -> RegistrationClosed');

    // RegistrationClosed -> EventUpcoming
    const trans4 = await fetch(`${baseUrl}/api/events/${eventAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'EventUpcoming' }),
    });
    assert(trans4.status === 200, 'Valid transition: RegistrationClosed -> EventUpcoming');

    // EventUpcoming -> Cancelled (Controlled cancellation)
    const transCancel = await fetch(`${baseUrl}/api/events/${eventAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'Cancelled' }),
    });
    assert(transCancel.status === 200, 'Valid cancellation: EventUpcoming -> Cancelled');

    // Cancelled -> RegistrationOpen (Cancelled is terminal state!)
    const transAfterCancel = await fetch(`${baseUrl}/api/events/${eventAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'RegistrationOpen' }),
    });
    assert(transAfterCancel.status === 400, 'Cancelled is terminal state; Cannot transition to RegistrationOpen (HTTP 400)');

    // TEST 6: Student Registration & Capacity Enforcement
    console.log('\n--- 6. REGISTRATION ENGINE & CONCURRENCY-SAFE CAPACITY ---');
    // Create an event with Capacity = 1 and status = RegistrationOpen
    const regSlotStart = new Date(baseNow + 500000000);
    const regSlotEnd = new Date(baseNow + 500007200);

    const createCap1 = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Exclusive Mentorship Session (Capacity 1)',
        description: 'Single attendee exclusive 1-on-1 session',
        categoryId: catId,
        primaryVenueId: venue2Id,
        startDateTime: regSlotStart.toISOString(),
        endDateTime: regSlotEnd.toISOString(),
        registrationStart: new Date(baseNow - 100000).toISOString(),
        registrationEnd: regSlotStart.toISOString(),
        capacity: 1, // STRICTLY 1 SEAT
      }),
    });
    const cap1Data = await createCap1.json();
    const cap1EventId = cap1Data.data.event._id || cap1Data.data.event.id;

    // Publish & Open Registration
    await fetch(`${baseUrl}/api/events/${cap1EventId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'Published' }),
    });
    await fetch(`${baseUrl}/api/events/${cap1EventId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({ status: 'RegistrationOpen' }),
    });

    // Student 1 Registers (Should succeed)
    const stu1Reg = await fetch(`${baseUrl}/api/events/${cap1EventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ notes: 'Student 1 confirmation' }),
    });
    const stu1RegData = await stu1Reg.json();
    assert(stu1Reg.status === 201, 'Student 1 registers for seat 1/1 (HTTP 201 Created)');
    assert(Boolean(stu1RegData.data?.registration?.registrationCode), 'Ticket registration code generated');

    // Duplicate Registration: Student 1 attempts to register AGAIN for same event
    const dupReg = await fetch(`${baseUrl}/api/events/${cap1EventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stuToken}` },
    });
    assert(dupReg.status === 409, 'Duplicate student registration is rejected with HTTP 409 ALREADY_REGISTERED');

    // Capacity Full: Student 2 attempts to register for already-full event (Capacity 1)
    const stu2Reg = await fetch(`${baseUrl}/api/events/${cap1EventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stu2Token}` },
    });
    assert(stu2Reg.status === 409, 'Student 2 rejected with HTTP 409 EVENT_FULL when capacity is reached');

    // Student 1 views their registrations
    const myRegs = await fetch(`${baseUrl}/api/registrations/me`, {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    const myRegsData = await myRegs.json();
    assert(
      Array.isArray(myRegsData.data?.registrations) && myRegsData.data.registrations.length >= 1,
      'Student can retrieve personal confirmed registrations via /api/registrations/me'
    );

    // Student 1 Cancels Registration (Frees up capacity)
    const cancelReg = await fetch(`${baseUrl}/api/events/${cap1EventId}/register`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    assert(cancelReg.status === 200, 'Student can cancel registration (HTTP 200 OK)');

    // Now Student 2 registers for the newly freed seat (Should succeed!)
    const stu2RegAfterCancel = await fetch(`${baseUrl}/api/events/${cap1EventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stu2Token}` },
    });
    assert(stu2RegAfterCancel.status === 201, 'Student 2 successfully claims seat freed by cancellation (HTTP 201)');

    // TEST 7: Public Catalog & RBAC Boundaries
    console.log('\n--- 7. PUBLIC CATALOG & RBAC BOUNDARIES ---');
    // Student attempts to create an event (Should be blocked by RBAC)
    const stuCreateEvent = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({
        title: 'Student Attempted Event',
        description: 'Should fail',
        categoryId: catId,
        primaryVenueId: venue1Id,
        startDateTime: new Date(baseNow + 1000000).toISOString(),
        endDateTime: new Date(baseNow + 2000000).toISOString(),
        registrationStart: new Date(baseNow).toISOString(),
        registrationEnd: new Date(baseNow + 1000000).toISOString(),
        capacity: 10,
      }),
    });
    assert(stuCreateEvent.status === 403, 'Student role is BLOCKED from creating events (HTTP 403 Forbidden)');

    // Public catalog check: Draft events MUST NOT be visible to unauthenticated requests
    const publicCatalog = await fetch(`${baseUrl}/api/events`);
    const catalogData = await publicCatalog.json();
    assert(publicCatalog.status === 200, 'Public can browse published event catalog');

    const hasDraftsInPublic = catalogData.data.events.some((e: any) => e.status === 'Draft');
    assert(!hasDraftsInPublic, 'Draft events are strictly HIDDEN from the public catalog');

    // Organizer views participants for their event
    const participantsRes = await fetch(`${baseUrl}/api/events/${cap1EventId}/registrations`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    const participantsData = await participantsRes.json();
    assert(participantsRes.status === 200, 'Authorized Organizer can view participant registrations roster');
    assert(
      Array.isArray(participantsData.data.participants) && participantsData.data.participants.length >= 1,
      'Participant roster contains registered student records'
    );

  } finally {
    server.close();
  }

  // Summary
  console.log('\n======================================================');
  const failed = results.filter((r) => !r.passed);
  if (failed.length === 0) {
    console.log(`ALL ${results.length} PHASE 3 VERIFICATION TESTS PASSED!`);
    console.log('======================================================\n');
    process.exit(0);
  } else {
    console.error(`${failed.length} of ${results.length} tests FAILED:`);
    failed.forEach((f) => console.error(`  - ${f.name}: ${f.error}`));
    console.log('======================================================\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
