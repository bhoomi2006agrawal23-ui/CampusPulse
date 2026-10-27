# CampusPulse — System Architecture & Requirements Blueprint
**Document Version:** 1.0.0  
**Phase:** 1 (System Architecture, Requirements & Blueprint)  
**Status:** Complete & Locked  
**Target Platform:** Web Application (Responsive: Desktop, Tablet, Mobile Web Browsers)

---

## 1. Executive Summary & Objective

**CampusPulse** is a centralized college event management web application engineered for higher education institutions. The platform consolidates campus events, technical competitions, workshops, seminars, cultural festivals, hackathons, sports tournaments, and student activity scheduling into a unified, secure, and intuitive web application.

### Key Objectives
- **Centralized Event Discovery & Access:** Empower students to discover, search, filter, and register for campus activities seamlessly from any browser.
- **Operational Efficiency for Organizers:** Streamline event lifecycles, schedules, venue bookings, volunteer assignments, judge evaluations, participant rosters, attendance tracking, and announcements.
- **Robust Institutional Administration:** Equip institutional administrators with global oversight over venues, categories, user roles, system metrics, and audit boundaries.
- **Strict Free-Tier Architecture:** Built purposefully with high efficiency to run seamlessly on cost-effective, free-tier cloud primitives (Vercel, Render, MongoDB Atlas Free Tier, ImgBB).

---

## 2. Platform Architecture & Technology Stack

```
+--------------------------------------------------------------------------+
|                        CAMPUSPULSE CLIENT LAYER                          |
|  - Next.js (App Router) / React / TypeScript                             |
|  - Tailwind CSS (Deep Navy, Indigo, Violet Design System)                |
|  - Runtime Memory Token Storage (No Access Token in localStorage)        |
|  - Browser Context: Desktop, Tablet, Mobile (Fully Responsive Web)       |
+-------------------------------------+------------------------------------+
                                      | HTTPS / REST API
                                      | Credentials: 'include' (Cookies)
+-------------------------------------v------------------------------------+
|                        CAMPUSPULSE SERVER LAYER                          |
|  - Node.js & Express (TypeScript)                                        |
|  - Security: Helmet, CORS (Strict Origin), Rate Limiting (In-Memory)     |
|  - Auth Middleware: JWT Access Token Verification (15-min lifetime)      |
|  - Session Engine: Refresh Token Rotation (7-day lifetime, HttpOnly)     |
|  - Validation: Zod (Request Boundary Validation)                         |
|  - Layering: Routes -> Middleware -> Controllers -> Services -> Mongoose|
|  - *Strict Rule: No Repository Layer*                                    |
+-------------------------------------+------------------------------------+
                                      | Mongoose ODM / Transactions
+-------------------------------------v------------------------------------+
|                         DATA PERSISTENCE LAYER                           |
|  - MongoDB Atlas (Replica Set / Free Tier)                               |
|  - 14 Core Application Collections                                       |
|  - Session SHA-256 Hash Storage for Refresh Token Tracking               |
|  - ACID Multi-Document Transactions for Concurrency & Overbooking Safety |
|  - (audit_logs collection explicitly DEFERRED to Phase 6)                |
+--------------------------------------------------------------------------+
```

### Frontend Stack
- **Framework:** Next.js (React 19+, App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Modern SaaS theme: Deep Navy `#0B132B`, Rich Slate `#1C2541`, Electric Indigo `#4361EE`, Accent Violet `#7209B7`)
- **State & Data Fetching:** React Hooks, Custom Fetch Client with automatic token refresh on 401
- **Icons:** Lucide Icons

### Backend Stack
- **Runtime:** Node.js (v20+ LTS)
- **Framework:** Express.js (TypeScript)
- **Data Modeling:** Mongoose ODM
- **Request Validation:** Zod
- **Security:** Helmet, CORS (credentialed, explicit frontend origin), bcryptjs, jsonwebtoken, crypto (high-entropy tokens)
- **Rate Limiting:** Express-rate-limit (in-memory token bucket for single instance)

### External Services & Storage
- **Database:** MongoDB Atlas (M0 Free Tier)
- **Image Storage:** ImgBB (Abstracted storage adapter for event posters, banners, and profile avatars)
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render

---

## 3. Scope & Institution Boundary

1. **Single-Institution Scope:** The initial architecture is purpose-built for a single university/college campus. Institution identifiers are not required on core collections. However, the data model preserves clean abstraction boundaries so multi-institution tenancy can be incorporated in future phases without breaking schema compatibility.
2. **Web-Only Mandate:** CampusPulse is strictly a web application. No mobile operating system wrappers, Android APKs, XML layouts, or Kotlin modules are utilized. All viewports are addressed via responsive CSS and fluid layouts.

---

## 4. User Roles & System Permissions

The system enforces Role-Based Access Control (RBAC) across five distinct personas:

| Persona | Description | Primary Capabilities | Restrictions |
|---|---|---|---|
| **Student** | Default enrolled student account | Browse events, search/filter, register for events within eligibility/capacity, view personal registrations, check schedules, view published results, view certificates, view announcements. | Cannot create/edit events, cannot manage venues, cannot access administrative APIs. |
| **Organizer** | Department or club event manager | Create events, edit owned events, manage schedules, manage venues assigned to events, track participants, manage volunteers and judges, take attendance, publish results/announcements. | Cannot modify global categories, cannot alter user roles, cannot access system-level configurations. |
| **Judge** | Evaluation panelist | Access assigned events and participant rosters, input evaluation scores, view scoring rubrics, submit finalized scores. | Cannot create events, cannot alter event schedules, cannot access administrative features. |
| **Volunteer** | Operational event staff | View assigned duties, rosters, event schedules, coordinate participant check-ins alongside organizers. | Read-only operational views, cannot modify event parameters or scoring. |
| **Admin** | System and campus administrator | Manage all users and assign roles, manage campus venues, configure categories, review system reports, override events, access global audit metrics. | Full system-level authorization enforced at backend gateway. |

### Public Registration Constraint
Public signup endpoints (`POST /api/auth/register`) **strictly provision the `Student` role**. Roles such as `Organizer`, `Judge`, `Volunteer`, and `Admin` cannot be requested or set during self-registration; they require administrative promotion via protected endpoints.

---

## 5. Event Lifecycle State Machine

Events strictly transition through deterministic lifecycle states enforced by backend validation services:

```
Draft
→ Published
→ RegistrationOpen
→ RegistrationClosed
→ EventUpcoming
→ EventOngoing
→ EventCompleted
→ ResultsPublished
→ CertificatesGenerated
→ Archived
```

### Controlled Cancellation
An event may be moved to `Cancelled` **only** from one of the following states:

```
Draft
Published
RegistrationOpen
RegistrationClosed
EventUpcoming
→ Cancelled
```

Do not allow arbitrary status transitions. Once an event reaches `EventOngoing`, `EventCompleted`, `ResultsPublished`, `CertificatesGenerated`, or `Archived`, cancellation is rejected by backend validation.

---

## 6. Registration & Capacity Engine Rules

1. **Registration Window Formula & Server-Side Enforcement:**
   Registration must be allowed only when:
   ```
   currentTime >= registrationStart
   AND
   currentTime <= registrationEnd
   ```
   Server-side validation must enforce the registration window. The event must also be in the `RegistrationOpen` lifecycle state. Do not trust frontend-only validation.

2. **Individual Student Registration & Duplicate Prevention:**
   - Registration architecture uses individual student registration initially.
   - Unique compound index `{ eventId: 1, studentId: 1 }` guarantees a student cannot have multiple active registrations for the same event.
   - Duplicate registration prevention is enforced server-side.

3. **Concurrency & Server-Side Capacity Enforcement:**
   - Capacity must be enforced server-side. Do not rely only on frontend counters.
   - Registrations are processed via atomic MongoDB transactions.
   - The transaction executes an atomic increment:
     ```typescript
     Event.findOneAndUpdate(
       { _id: eventId, registeredCount: { $lt: capacity }, status: 'RegistrationOpen' },
       { $inc: { registeredCount: 1 } },
       { new: true, session }
     );
     ```
   - If `registeredCount` reaches `capacity`, the transaction aborts with a capacity-exhausted error, eliminating race-condition overbooking.

4. **Attendance Integration (No Separate Collection):**
   - Attendance/participation tracking remains inside the `Registration` model (`attendanceStatus: 'Attended' | 'Absent' | 'Excused'`, `checkedInAt`).
   - DO NOT create a separate attendance collection.

5. **Team Registration Deferred:**
   - Team registration is NOT part of the initial architecture.
   - Team registration is deferred to future roadmap phases; use individual student registration first.

---

## 7. Venue Management & Conflict Prevention Architecture

Each event must have a **mandatory Primary Venue**. Schedules may optionally specify a track-specific venue (if unassigned, falling back conceptually to the event's primary venue).

### Venue Overlap Formula
Venue conflict detection must use:
```
newStart < existingEnd
AND
newEnd > existingStart
```

### Conflict Conditions
```
venueId = targetVenue
AND status != Cancelled
AND _id != currentEventId
```

### Conflict Query Concept
```typescript
const conflict = await Event.findOne({
  venueId: targetVenue,
  status: { $ne: 'Cancelled' },
  _id: { $ne: currentEventId }, // current event is excluded during update
  startDateTime: { $lt: requestedEndDateTime },
  endDateTime: { $gt: requestedStartDateTime }
});
```

### Indexing vs. Concurrency Protection
- The compound index:
  ```
  {
    venueId: 1,
    startDateTime: 1,
    endDateTime: 1
  }
  ```
  is only for query acceleration and does NOT itself prevent time-range overlap.
- Concurrent venue reservation protection must use MongoDB transaction/concurrency-safe logic during Phase 3.

---

## 8. Authentication & Session Architecture

CampusPulse employs a defense-in-depth token-session architecture:

### Access Token:
- approximately 15 minutes
- returned in JSON
- client runtime memory only
- never localStorage
- never sessionStorage

### Refresh Token:
- approximately 7 days
- cryptographically random
- HttpOnly cookie only
- Secure in production
- never returned in JSON
- SHA-256 hash stored in sessions
- rotation
- reuse detection
- logout revocation

Never store the raw refresh token in MongoDB. Never expose refresh tokens to JavaScript.

### Refresh Token Rotation & Reuse Detection
- Each refresh request rotates the token: the old token session is revoked and replaced with a fresh child session.
- If an expired or previously revoked refresh token is presented, the system detects a potential replay attack, immediately revokes all active sessions for that user, and requires full credential re-authentication.

---

## 9. Database Count & Collections Matrix

The complete foundational architecture contains:

**14 core application collections/models:**

1. `users` — Student, organizer, judge, volunteer, and admin profiles.
2. `sessions` — Active refresh token hashes, client device metadata, expiration dates.
3. `categories` — Event classification taxonomies (Technical, Cultural, Sports, etc.).
4. `venues` — Campus auditoriums, labs, halls, fields with capacities and locations.
5. `events` — Primary event metadata, lifecycle state, venue, capacity, schedules.
6. `schedules` — Detailed timeline segments and tracks within an event.
7. `registrations` — Student event registrations, confirmation codes, and attendance flags.
8. `judges` — Judge-to-event assignments and evaluation authorizations.
9. `volunteers` — Volunteer-to-event assignments and operational tasks.
10. `results` — Final rankings, scores, and judge evaluation tallies.
11. `certificates` — Participant certificate metadata, hashes, and verification tokens.
12. `announcements` — Event-specific or campus-wide updates and alerts.
13. `notifications` — Direct user alerts and system notifications.
14. `reports` — Summaries of attendance, feedback, and event performance.

**PLUS:**

`audit_logs` = 15th planned collection  
**STRICTLY DEFERRED TO PHASE 6.**

**Do NOT create audit_logs.** Phase 2 consists of exactly 14 core collections/models.
