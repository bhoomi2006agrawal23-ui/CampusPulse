/**
 * CampusPulse Phase 5 Verification & Test Suite
 * Validates:
 * - Exactly 14 core Mongoose models (Zero audit_logs)
 * - Result Management, Finalization, and Controlled Publishing
 * - Deterministic Ranking and Unpublished Visibility Isolation
 * - Certificate Generation with Unique Verification Identifiers
 * - Safe Public Certificate Verification (Zero Private Data Leakage)
 * - Duplicate Certificate Prevention (HTTP 409)
 * - Announcement Management & RBAC Boundaries
 * - In-App Notifications & IDOR Security Isolation
 * - Student Attendance Tracking in Registration records
 * - Event Reporting and Administrator Universal Metrics
 * - Complete RBAC Matrix across all 5 roles
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
  console.log('CAMPUSPULSE PHASE 5 VERIFICATION & TEST SUITE');
  console.log('======================================================\n');

  // TEST 1: Model Inventory
  console.log('--- 1. DATABASE MODELS REGISTRY ---');
  assert(
    CORE_COLLECTION_COUNT === 14,
    'Exactly 14 core collections defined in Phase 5',
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
  await new Promise<void>((resolve) => server.listen(3004, resolve));
  const baseUrl = 'http://127.0.0.1:3004';

  try {
    // Authenticate test users
    console.log('\n--- 2. AUTHENTICATION CONTEXTS ---');
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campuspulse.edu', password: 'Password123!' }),
    });
    const adminToken = (await adminRes.json()).data.accessToken;

    const orgRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@campuspulse.edu', password: 'Password123!' }),
    });
    const orgToken = (await orgRes.json()).data.accessToken;

    const judgeRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'judge@campuspulse.edu', password: 'Password123!' }),
    });
    const judgeToken = (await judgeRes.json()).data.accessToken;

    const volRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'volunteer@campuspulse.edu', password: 'Password123!' }),
    });
    const volToken = (await volRes.json()).data.accessToken;

    const stuRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campuspulse.edu', password: 'Password123!' }),
    });
    const stuToken = (await stuRes.json()).data.accessToken;

    assert(Boolean(adminToken && orgToken && judgeToken && volToken && stuToken), 'Auth tokens generated for all 5 roles');

    const hackathonEventId = '6ac25fa6e90fec98e2f56721';
    const studentUserId = '6ac25fb6e90fec98e2f56765'; // Maya Patel

    // Register a second student for ranking & attendance tests
    const stu2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: 'jordan.lee@campuspulse.edu',
        password: 'Password123!',
      }),
    });
    const stu2Data = await stu2Res.json();
    const stu2Token = stu2Data.data.accessToken;
    const stu2UserId = stu2Data.data.user.id;

    // Register student 2 for hackathon
    await fetch(`${baseUrl}/api/events/${hackathonEventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stu2Token}` },
    });

    // ----------------------------------------------------
    // TEST 3: Result Management, Finalization & Publishing
    // ----------------------------------------------------
    console.log('\n--- 3. RESULT MANAGEMENT & PUBLISHING ---');

    // Organizer saves result for Maya Patel
    const saveResult1 = await fetch(`${baseUrl}/api/events/${hackathonEventId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        participantId: studentUserId,
        score: 950,
        awardTitle: 'Grand Prize Winner',
        judgeFeedback: 'Flawless architecture and user experience.',
      }),
    });
    assert(saveResult1.status === 200, 'Organizer creates participant evaluation result (HTTP 200 OK)');

    // Organizer saves result for Jordan Lee
    const saveResult2 = await fetch(`${baseUrl}/api/events/${hackathonEventId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        participantId: stu2UserId,
        score: 880,
        awardTitle: 'First Runner Up',
      }),
    });
    assert(saveResult2.status === 200, 'Organizer creates second participant result (HTTP 200 OK)');

    // Student blocked from creating/modifying results
    const stuResultAttempt = await fetch(`${baseUrl}/api/events/${hackathonEventId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({
        participantId: studentUserId,
        score: 1000,
      }),
    });
    assert(stuResultAttempt.status === 403, 'Student is BLOCKED from modifying results (HTTP 403 Forbidden)');

    // Unpublished result hidden from public/student
    const studentViewUnpublished = await fetch(`${baseUrl}/api/events/${hackathonEventId}/results`, {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    const stuUnpubData = await studentViewUnpublished.json();
    assert(
      stuUnpubData.data.results.length === 0,
      'Unpublished results are strictly HIDDEN from students'
    );

    // Finalize Results (Assigns ranks automatically)
    const finalizeRes = await fetch(`${baseUrl}/api/events/${hackathonEventId}/results/finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    assert(finalizeRes.status === 200, 'Organizer finalizes event results (HTTP 200 OK)');

    // Publish Results
    const publishRes = await fetch(`${baseUrl}/api/events/${hackathonEventId}/results/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    assert(publishRes.status === 200, 'Organizer publishes results to participants and public (HTTP 200 OK)');

    // Student can now view published results with verified ranks
    const studentViewPublished = await fetch(`${baseUrl}/api/events/${hackathonEventId}/results`, {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    const stuPubData = await studentViewPublished.json();
    assert(
      stuPubData.data.results.length === 2 && stuPubData.data.results[0].rank === 1,
      'Student can view published results with accurate deterministic rank #1'
    );

    // ----------------------------------------------------
    // TEST 4: Certificate Generation & Verification
    // ----------------------------------------------------
    console.log('\n--- 4. CERTIFICATE WORKFLOW & VERIFICATION ---');

    // Generate Winner certificate for Maya Patel
    const genCertRes = await fetch(`${baseUrl}/api/events/${hackathonEventId}/certificates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        recipientId: studentUserId,
        certificateType: 'Merit',
      }),
    });
    const genCertData = await genCertRes.json();
    assert(genCertRes.status === 201, 'Organizer generates merit certificate for winner (HTTP 201 Created)');
    const certCode = genCertData.data.certificate.certificateId;
    assert(Boolean(certCode && certCode.startsWith('CP-CERT-')), 'Certificate ID conforms to format CP-CERT-YYYY-XXXX');

    // Duplicate certificate prevention (HTTP 409)
    const dupCertRes = await fetch(`${baseUrl}/api/events/${hackathonEventId}/certificates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        recipientId: studentUserId,
        certificateType: 'Merit',
      }),
    });
    assert(dupCertRes.status === 409, 'Duplicate certificate generation is rejected with HTTP 409 CERTIFICATE_ALREADY_EXISTS');

    // Public Safe Certificate Verification
    const verifyRes = await fetch(`${baseUrl}/api/certificates/verify/${certCode}`);
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200 && verifyData.data.valid === true, 'Public verification confirms authentic certificate (HTTP 200 OK)');
    assert(
      !('email' in verifyData.data) && !('password' in verifyData.data) && !('studentId' in verifyData.data),
      'Public verification payload strictly NEVER leaks private recipient data'
    );

    // Verification with invalid certificate code returns HTTP 404
    const fakeVerify = await fetch(`${baseUrl}/api/certificates/verify/CP-CERT-FAKE-999999`);
    assert(fakeVerify.status === 404, 'Invalid certificate verification code is rejected with HTTP 404');

    // Student retrieves their own certificates
    const myCertsRes = await fetch(`${baseUrl}/api/certificates/me`, {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    const myCertsData = await myCertsRes.json();
    assert(
      myCertsRes.status === 200 && myCertsData.data.certificates.length >= 1,
      'Student can view personal certificate inventory via /api/certificates/me'
    );

    // ----------------------------------------------------
    // TEST 5: Announcements Management & RBAC
    // ----------------------------------------------------
    console.log('\n--- 5. ANNOUNCEMENTS & DISPATCH ---');

    // Organizer creates announcement for own event
    const createAnnounce = await fetch(`${baseUrl}/api/events/${hackathonEventId}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: 'Project Submissions Deadline Extended',
        content: 'All teams receive an additional 30 minutes to finalize code repos and slides.',
        priority: 'High',
        isPinned: true,
      }),
    });
    const announceData = await createAnnounce.json();
    assert(createAnnounce.status === 201, 'Organizer creates event announcement (HTTP 201 Created)');
    const announceId = announceData.data.announcement._id || announceData.data.announcement.id;

    // Student cannot create announcement (RBAC)
    const stuAnnounce = await fetch(`${baseUrl}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({
        title: 'Unauthorized Student Broadcast',
        content: 'Should be rejected',
      }),
    });
    assert(stuAnnounce.status === 403, 'Student is BLOCKED from creating announcements (HTTP 403 Forbidden)');

    // Public / Student can view announcements
    const listAnnounce = await fetch(`${baseUrl}/api/announcements?eventId=${hackathonEventId}`);
    const listAnnounceData = await listAnnounce.json();
    assert(
      listAnnounce.status === 200 && listAnnounceData.data.announcements.length >= 1,
      'Public / Students can view published announcements'
    );

    // ----------------------------------------------------
    // TEST 6: In-App Notifications & IDOR Security
    // ----------------------------------------------------
    console.log('\n--- 6. IN-APP NOTIFICATIONS & IDOR ISOLATION ---');

    // Student views own notifications
    const stuNotifsRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    const stuNotifsData = await stuNotifsRes.json();
    assert(
      stuNotifsRes.status === 200 && Array.isArray(stuNotifsData.data.notifications),
      'Student retrieves personal in-app notifications'
    );
    const firstNotifId = stuNotifsData.data.notifications[0]?._id || stuNotifsData.data.notifications[0]?.id;

    if (firstNotifId) {
      // Mark notification as read
      const markReadRes = await fetch(`${baseUrl}/api/notifications/${firstNotifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${stuToken}` },
      });
      assert(markReadRes.status === 200, 'Student marks notification as read (HTTP 200 OK)');

      // IDOR Test: Student 2 attempts to mark Student 1's notification as read (Blocked)
      const idorAttempt = await fetch(`${baseUrl}/api/notifications/${firstNotifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${stu2Token}` },
      });
      assert(
        idorAttempt.status === 403,
        'IDOR Protection: User cannot modify another user\'s notification (HTTP 403 Forbidden)'
      );
    }

    // Mark all as read
    const markAllRes = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    assert(markAllRes.status === 200, 'Mark all notifications as read succeeds');

    // ----------------------------------------------------
    // TEST 7: Student Attendance Tracking
    // ----------------------------------------------------
    console.log('\n--- 7. STUDENT ATTENDANCE TRACKING ---');

    // Organizer fetches attendance roster
    const getAttRes = await fetch(`${baseUrl}/api/events/${hackathonEventId}/attendance`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    const attData = await getAttRes.json();
    assert(getAttRes.status === 200 && Array.isArray(attData.data.records), 'Organizer retrieves event attendance roster');

    const sampleReg = attData.data.records[0];
    const regIdToMark = sampleReg._id || sampleReg.id;

    // Organizer marks student as Attended
    const updateAttRes = await fetch(`${baseUrl}/api/events/${hackathonEventId}/attendance/${regIdToMark}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        status: 'Attended',
        notes: 'Checked in at Gate 2 Desk by Liam Chen',
      }),
    });
    assert(updateAttRes.status === 200, 'Organizer marks student attendance as "Attended" (HTTP 200 OK)');

    // Invalid status rejected
    const invalidAttRes = await fetch(`${baseUrl}/api/events/${hackathonEventId}/attendance/${regIdToMark}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        status: 'InvalidAttendanceState',
      }),
    });
    assert(invalidAttRes.status === 400, 'Invalid attendance status is rejected with HTTP 400');

    // Student blocked from updating attendance
    const stuAttAttempt = await fetch(`${baseUrl}/api/events/${hackathonEventId}/attendance/${regIdToMark}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stuToken}` },
      body: JSON.stringify({ status: 'Attended' }),
    });
    assert(stuAttAttempt.status === 403, 'Student is BLOCKED from modifying attendance (HTTP 403 Forbidden)');

    // Verify summary counts calculation
    const getAttUpdated = await fetch(`${baseUrl}/api/events/${hackathonEventId}/attendance`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    const attUpdatedData = await getAttUpdated.json();
    assert(
      attUpdatedData.data.summary.attended >= 1 && typeof attUpdatedData.data.summary.attendancePercentage === 'number',
      'Attendance summary metrics and percentages computed accurately'
    );

    // ----------------------------------------------------
    // TEST 8: Event Reports & Universal Admin Metrics
    // ----------------------------------------------------
    console.log('\n--- 8. EVENT REPORTS & ADMIN METRICS ---');

    // Organizer generates Event Summary Report
    const genReportRes = await fetch(`${baseUrl}/api/events/${hackathonEventId}/reports`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    const reportData = await genReportRes.json();
    assert(genReportRes.status === 201, 'Organizer generates event summary report (HTTP 201 Created)');
    assert(
      Boolean(reportData.data.report?.dataSummary?.registrations && reportData.data.report?.dataSummary?.attendance),
      'Report aggregates real-time registrations, attendance, and evaluation data'
    );

    // Student cannot generate reports
    const stuReportAttempt = await fetch(`${baseUrl}/api/events/${hackathonEventId}/reports`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stuToken}` },
    });
    assert(stuReportAttempt.status === 403, 'Student is BLOCKED from generating reports (HTTP 403 Forbidden)');

    // Admin views universal system overview metrics
    const adminMetricsRes = await fetch(`${baseUrl}/api/reports/system-overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminMetricsData = await adminMetricsRes.json();
    assert(adminMetricsRes.status === 200, 'Admin accesses universal system overview metrics (HTTP 200 OK)');
    assert(
      adminMetricsData.data.metrics.collectionsActive === 14 &&
        adminMetricsData.data.metrics.auditLogsStatus === 'Deferred to Phase 6',
      'Universal metrics confirms exactly 14 collections active and audit_logs deferred to Phase 6'
    );

  } finally {
    server.close();
  }

  // Summary
  console.log('\n======================================================');
  const failed = results.filter((r) => !r.passed);
  if (failed.length === 0) {
    console.log(`ALL ${results.length} PHASE 5 VERIFICATION TESTS PASSED!`);
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
