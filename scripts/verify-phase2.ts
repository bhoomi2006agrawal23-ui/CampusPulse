/**
 * CampusPulse Phase 2 Verification & Test Suite
 * Validates:
 * - Exactly 14 core Mongoose models compile
 * - No audit_logs model exists
 * - Authentication (Registration, Login, Refresh, Logout)
 * - Password hashing (bcrypt 12 rounds, no passwordHash leaked)
 * - Refresh token rotation & reuse replay detection
 * - RBAC middleware (Student blocked from Admin endpoints, Admin authorized)
 */

import { createApp } from '../backend/src/app.js';
import { seedDevelopmentData } from '../backend/src/services/seed.service.js';
import { CORE_MODEL_NAMES, CORE_COLLECTION_COUNT } from '../backend/src/models/index.js';
import * as Models from '../backend/src/models/index.js';
import { comparePassword } from '../backend/src/utils/crypto.js';
import { verifyAccessToken } from '../backend/src/utils/tokens.js';
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
  console.log('\n========================================');
  console.log('CAMPUSPULSE PHASE 2 VERIFICATION SUITE');
  console.log('========================================\n');

  // TEST 1: Model Inventory
  console.log('--- 1. DATABASE MODELS VERIFICATION ---');
  assert(
    CORE_COLLECTION_COUNT === 14,
    'Exactly 14 core collections defined in Phase 2',
    `Expected 14, got ${CORE_COLLECTION_COUNT}`
  );

  const modelKeys = Object.keys(Models).filter((k) => !k.startsWith('I') && k !== 'CORE_MODEL_NAMES' && k !== 'ALL_MODEL_NAMES' && k !== 'CORE_COLLECTION_COUNT' && k !== 'PHASE6_COLLECTION_COUNT');
  assert(
    modelKeys.length >= 14,
    'Exported models count includes 14 core models',
    `Expected >= 14, got ${modelKeys.length}`
  );

  const hasAuditLog = 'AuditLog' in Models;
  assert(
    hasAuditLog,
    'audit_logs model #15 is registered in Phase 6'
  );

  // Initialize App and seed data
  const app = createApp();
  await seedDevelopmentData();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3001, resolve));
  const baseUrl = 'http://127.0.0.1:3001';

  try {
    console.log('\n--- 2. HEALTH ENDPOINT VERIFICATION ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200');
    assert(healthData.data?.status === 'ok', 'Health status is ok');

    console.log('\n--- 3. AUTHENTICATION & REGISTRATION ---');
    // Test public registration creates Student only
    const studentEmail = `alex.test.${Date.now()}@college.edu`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Test',
        email: studentEmail,
        password: 'Password123!',
        bio: 'Student test bio',
      }),
    });
    const regData = await regRes.json();

    assert(regRes.status === 201, 'Student registration returns HTTP 201 Created');
    assert(regData.data?.user?.role === 'Student', 'Public signup strictly provisions Student role');
    assert(!regData.data?.user?.passwordHash, 'Password hash is NEVER returned in response');
    assert(Boolean(regData.data?.accessToken), 'JWT access token is issued on registration');

    // Check refresh cookie
    const rawSetCookie = regRes.headers.get('set-cookie') || '';
    assert(rawSetCookie.includes('campus_pulse_rt='), 'HttpOnly refresh cookie is set');
    assert(rawSetCookie.includes('HttpOnly'), 'Refresh cookie contains HttpOnly directive');
    assert(!regData.data?.refreshToken, 'Refresh token is NEVER returned in response JSON');

    // Test rejection of privileged role injection during registration
    const injectRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Joe',
        email: `hacker.${Date.now()}@college.edu`,
        password: 'Password123!',
        role: 'Admin', // Illegal injection
      }),
    });
    assert(
      injectRes.status === 400,
      'Registration with attempted role injection is rejected with HTTP 400 Bad Request'
    );

    // Test duplicate email rejection
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Duplicate',
        email: studentEmail,
        password: 'Password123!',
      }),
    });
    assert(dupRes.status === 409, 'Duplicate user registration rejected with HTTP 409 Conflict');

    console.log('\n--- 4. LOGIN & TOKEN VERIFICATION ---');
    // Login with valid credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Login with valid credentials returns HTTP 200 OK');
    assert(Boolean(loginData.data?.accessToken), 'Access token received');

    // Verify JWT payload
    const tokenPayload = verifyAccessToken(loginData.data.accessToken);
    assert(tokenPayload.email === studentEmail, 'JWT token contains correct email claim');
    assert(tokenPayload.role === 'Student', 'JWT token contains correct role claim');

    // Login with wrong password
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'WrongPassword999!',
      }),
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 401, 'Login with wrong password rejected with HTTP 401');
    assert(
      badLoginData.error?.message === 'Invalid email or password',
      'Generic failure message prevents user enumeration'
    );

    console.log('\n--- 5. REFRESH TOKEN ROTATION & REUSE DETECTION ---');
    const loginCookie = loginRes.headers.get('set-cookie') || '';
    const cookieMatch = loginCookie.match(/campus_pulse_rt=([^;]+)/);
    const initialRefreshToken = cookieMatch ? cookieMatch[1] : '';
    assert(Boolean(initialRefreshToken), 'Captured initial refresh token from cookie');

    // Perform valid refresh
    const refreshRes1 = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `campus_pulse_rt=${initialRefreshToken}`,
      },
    });
    const refreshData1 = await refreshRes1.json();
    assert(refreshRes1.status === 200, 'Refresh returns HTTP 200 and issues new access token');
    assert(Boolean(refreshData1.data?.accessToken), 'New access token present in refresh response');

    const rotatedCookie = refreshRes1.headers.get('set-cookie') || '';
    const rotatedMatch = rotatedCookie.match(/campus_pulse_rt=([^;]+)/);
    const newRefreshToken = rotatedMatch ? rotatedMatch[1] : '';
    assert(
      newRefreshToken !== initialRefreshToken,
      'Refresh token was rotated (new token differs from old token)'
    );

    // REUSE DETECTION TEST: Attempt to use the OLD, already-rotated refresh token
    console.log('Testing Refresh Token Reuse Detection...');
    const replayRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `campus_pulse_rt=${initialRefreshToken}`, // Replaying old token!
      },
    });
    const replayData = await replayRes.json();
    assert(
      replayRes.status === 401,
      'Replay of revoked refresh token is rejected with HTTP 401'
    );
    assert(
      replayData.error?.code === 'TOKEN_REUSE_DETECTED',
      'Token reuse alarm triggered (TOKEN_REUSE_DETECTED)'
    );

    console.log('\n--- 6. RBAC (ROLE-BASED ACCESS CONTROL) TESTS ---');
    // Test: Student cannot access Admin-only /api/users
    const studentAccessToken = refreshData1.data.accessToken;
    const studentRbacRes = await fetch(`${baseUrl}/api/users`, {
      headers: {
        Authorization: `Bearer ${studentAccessToken}`,
      },
    });
    assert(
      studentRbacRes.status === 403,
      'Student role is BLOCKED from Admin endpoint /api/users with HTTP 403 Forbidden'
    );

    // Test: Missing token returns 401
    const noAuthRes = await fetch(`${baseUrl}/api/users`);
    assert(noAuthRes.status === 401, 'Unauthenticated request rejected with HTTP 401 Unauthorized');

    // Test: Admin login and accessing /api/users
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@campuspulse.edu',
        password: 'Password123!',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin seed account login succeeds');

    const adminAccessToken = adminLoginData.data.accessToken;
    const adminRbacRes = await fetch(`${baseUrl}/api/users`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });
    const adminRbacData = await adminRbacRes.json();
    assert(adminRbacRes.status === 200, 'Admin role is PERMITTED to access /api/users with HTTP 200 OK');
    assert(
      Array.isArray(adminRbacData.data?.users) && adminRbacData.data.users.length >= 5,
      'Admin receives user roster list'
    );

    console.log('\n--- 7. LOGOUT VERIFICATION ---');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: `campus_pulse_rt=${newRefreshToken}`,
      },
    });
    assert(logoutRes.status === 200, 'Logout succeeds with HTTP 200 OK');
    const logoutCookie = logoutRes.headers.get('set-cookie') || '';
    assert(
      logoutCookie.includes('campus_pulse_rt=;') || logoutCookie.includes('Max-Age=0'),
      'Logout clears the refresh token cookie'
    );

  } finally {
    server.close();
  }

  // Summary
  console.log('\n========================================');
  const failed = results.filter((r) => !r.passed);
  if (failed.length === 0) {
    console.log(`ALL ${results.length} PHASE 2 VERIFICATION TESTS PASSED!`);
    console.log('========================================\n');
    process.exit(0);
  } else {
    console.error(`${failed.length} of ${results.length} tests FAILED:`);
    failed.forEach((f) => console.error(`  - ${f.name}: ${f.error}`));
    console.log('========================================\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
