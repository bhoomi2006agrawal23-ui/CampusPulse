# CampusPulse — REST API Architecture & Blueprint
**Document Version:** 1.0.0  
**Phase:** 1 (Architecture & API Blueprint)  
**Status:** Complete & Locked  
**Base URL:** `/api`

---

## 1. REST Conventions & Standards

All CampusPulse API endpoints follow strict REST architectural principles:
- **Payload Format:** JSON (`Content-Type: application/json`).
- **Standard Envelope:**
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Human-readable summary (optional)",
    "meta": { "total": 100, "page": 1, "limit": 10 }
  }
  ```
- **Standard Error Envelope:**
  ```json
  {
    "success": false,
    "error": {
      "code": "CAPACITY_EXCEEDED",
      "message": "Event has reached maximum registration capacity.",
      "details": []
    }
  }
  ```
- **Authentication Header:** `Authorization: Bearer <access_token>`
- **Session Cookie:** `campus_pulse_rt` (HttpOnly, Secure, SameSite=None/Lax)

---

## 2. Authentication & Session Endpoints (`/api/auth`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Anyone | Registers a new student account. **Strictly enforces `role: 'Student'`**. |
| `/api/auth/login` | `POST` | Public | Anyone | Authenticates email & password. Issues access token (JSON) and refresh cookie. |
| `/api/auth/refresh` | `POST` | Cookie | Anyone | Validates refresh cookie, applies token rotation, issues fresh access token & cookie. |
| `/api/auth/logout` | `POST` | Bearer/Cookie | Authenticated | Revokes session hash in `sessions` collection and clears cookie. |
| `/api/auth/me` | `GET` | Bearer | Authenticated | Returns current authenticated user profile and permissions. |

### Detail: `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex.m@college.edu",
    "password": "StrongPassword123!",
    "phoneNumber": "+1234567890",
    "bio": "CS junior passionate about distributed systems"
  }
  ```
- **Validation (Zod):** Email must be valid format, password minimum 8 chars with 1 uppercase and 1 number, bio max 300 chars, `role` cannot be specified (injected as `'Student'` by controller).
- **Responses:**
  - `201 Created`: Returns created user profile and access token.
  - `409 Conflict`: Email already exists.

### Detail: `POST /api/auth/refresh`
- **Request:** Cookie `campus_pulse_rt` must be present.
- **Validation:** Finds matching session via SHA-256 hash. If session was already marked `isRevoked: true`, triggers **Replay Detection Protocol** (revokes all sessions for user).
- **Responses:**
  - `200 OK`: Returns new access token (`{ accessToken, expiresIn: 900 }`) and sets fresh rotated cookie.
  - `401 Unauthorized`: Token invalid, expired, or reuse detected.

---

## 3. User & Privilege Management (`/api/users`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/users` | `GET` | Bearer | `Admin` | List users with pagination and search by name/email/role. |
| `/api/users/:id` | `GET` | Bearer | `Admin` or Self | Retrieve specific user profile. |
| `/api/users/:id/role` | `PATCH` | Bearer | `Admin` | Promote or reassign user role (`Student` -> `Organizer`, `Judge`, `Volunteer`, `Admin`). |
| `/api/users/:id/status`| `PATCH` | Bearer | `Admin` | Suspend or activate user account. |
| `/api/users/profile` | `PUT` | Bearer | Authenticated | Update personal profile (name, phone, bio max 300 chars). |

---

## 4. Categories & Taxonomies (`/api/categories`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/categories` | `GET` | Public | Public | List all active event categories. |
| `/api/categories` | `POST` | Bearer | `Admin` | Create new category (name, slug, colorCode, icon). |
| `/api/categories/:id`| `PUT` | Bearer | `Admin` | Update category attributes. |
| `/api/categories/:id`| `DELETE` | Bearer | `Admin` | Soft-deactivate category if not in use. |

---

## 5. Venues & Conflict Management (`/api/venues`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/venues` | `GET` | Public | Public | List campus venues with capacity and amenities. |
| `/api/venues` | `POST` | Bearer | `Admin` | Register a new campus facility. |
| `/api/venues/:id` | `PUT` | Bearer | `Admin` | Update venue details or capacity. |
| `/api/venues/check-availability` | `POST` | Bearer | `Organizer`, `Admin` | Checks for overlapping bookings for a venue and time window. |

### Detail: `POST /api/venues/check-availability`
- **Request Body:**
  ```json
  {
    "venueId": "651a1b2c3d4e5f6a7b8c9d0e",
    "startDateTime": "2026-11-15T09:00:00.000Z",
    "endDateTime": "2026-11-15T17:00:00.000Z",
    "excludeEventId": "optional-event-id-during-edit"
  }
  ```
- **Venue Overlap Formula:**
  ```
  newStart < existingEnd
  AND
  newEnd > existingStart
  ```
- **Conflict Query Conditions:**
  ```
  venueId = targetVenue
  AND status != Cancelled
  AND _id != currentEventId
  ```
- **Query Acceleration vs Concurrency:**
  The compound index `{ venueId: 1, startDateTime: 1, endDateTime: 1 }` is only for query acceleration and does NOT itself prevent time-range overlap. Concurrent venue reservation protection must use MongoDB transaction/concurrency-safe logic during Phase 3.
- **Response:**
  - `200 OK`: `{ available: true }` or `{ available: false, conflictingEvent: { title, start, end } }`.

---

## 6. Events & Lifecycle Management (`/api/events`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/events` | `GET` | Public | Public | Public catalog: filter by category, search text, date, and status. |
| `/api/events/:slugOrId`| `GET`| Public | Public | Full event details with primary venue, schedule, and organizer info. |
| `/api/events` | `POST` | Bearer | `Organizer`, `Admin` | Create new event in `Draft` state. Validates venue availability. |
| `/api/events/:id` | `PUT` | Bearer | `Organizer` (Owner), `Admin` | Edit event details. Restricts field edits once ongoing. |
| `/api/events/:id/status`| `PATCH`| Bearer | `Organizer` (Owner), `Admin` | Transition lifecycle state (enforces strict transition machine). |
| `/api/events/:id/cancel`| `POST` | Bearer | `Organizer` (Owner), `Admin` | Cancels event. Only allowed from states prior to `EventOngoing`. |

**Exact Lifecycle States:**
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

**Controlled Cancellation:**
```
Draft
Published
RegistrationOpen
RegistrationClosed
EventUpcoming
→ Cancelled
```
Do not allow arbitrary status transitions.

---

## 7. Event Schedules & Tracks (`/api/schedules`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/events/:eventId/schedules` | `GET` | Public | Public | Retrieve chronological schedule and tracks. |
| `/api/events/:eventId/schedules` | `POST` | Bearer | `Organizer` (Owner), `Admin` | Add activity track or timeline entry. |
| `/api/schedules/:id` | `PUT` | Bearer | `Organizer` (Owner), `Admin` | Update schedule segment or sub-venue. |
| `/api/schedules/:id` | `DELETE` | Bearer | `Organizer` (Owner), `Admin` | Remove schedule entry. |

---

## 8. Registrations & Attendance (`/api/registrations`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/registrations` | `POST` | Bearer | `Student` | Register for an event. Enforces capacity and window checks. |
| `/api/registrations/my` | `GET` | Bearer | `Student` | List student's personal registrations with QR/ticket codes. |
| `/api/events/:eventId/participants` | `GET` | Bearer | `Organizer`, `Admin`, `Volunteer` | Roster of registered participants. |
| `/api/registrations/:id/attendance` | `PATCH` | Bearer | `Organizer`, `Volunteer`, `Admin` | Update attendance status (`Attended`, `Absent`, etc.). |
| `/api/registrations/:id/cancel` | `POST` | Bearer | `Student` (Owner), `Admin` | Cancel registration. Decrements `registeredCount` on event. |

### Detail: `POST /api/registrations`
- **Architecture Rules:**
  - Individual student registration first (team registration deferred).
  - Registration window validated server-side:
    ```
    currentTime >= registrationStart
    AND
    currentTime <= registrationEnd
    ```
  - Server-side capacity enforcement using atomic transaction increment.
  - Duplicate registration prevention via unique compound index `{ eventId: 1, studentId: 1 }`.
  - Attendance remains inside registrations model (no separate attendance collection).
- **Request Body:**
  ```json
  {
    "eventId": "651a1b2c3d4e5f6a7b8c9d0e",
    "notes": "Vegetarian lunch preferred"
  }
  ```
- **Error Cases Handled:**
  - `400 Bad Request`: Current time outside registration start/end window (`currentTime < registrationStart || currentTime > registrationEnd`).
  - `409 Conflict (DUPLICATE_REGISTRATION)`: Student already registered for this event.
  - `409 Conflict (CAPACITY_EXCEEDED)`: Event capacity exhausted.
  - `400 Bad Request (INVALID_STATUS)`: Event not in `RegistrationOpen` status.

---

## 9. Judging & Evaluation (`/api/judges`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/events/:eventId/judges` | `GET` | Bearer | `Organizer`, `Judge`, `Admin` | List judges assigned to event. |
| `/api/events/:eventId/judges` | `POST` | Bearer | `Organizer` (Owner), `Admin` | Assign judge to event. |
| `/api/judges/my-assignments` | `GET` | Bearer | `Judge` | Retrieve list of events and participants assigned for scoring. |
| `/api/judges/:id` | `DELETE` | Bearer | `Organizer`, `Admin` | Remove judge assignment. |

---

## 10. Volunteer Roster & Tasks (`/api/volunteers`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/events/:eventId/volunteers` | `GET` | Bearer | `Organizer`, `Admin` | List volunteers assigned to event. |
| `/api/events/:eventId/volunteers` | `POST` | Bearer | `Organizer` (Owner), `Admin` | Assign volunteer with role and shift times. |
| `/api/volunteers/my-roster` | `GET` | Bearer | `Volunteer` | View personal volunteer assignments and shift details. |
| `/api/volunteers/:id/status` | `PATCH` | Bearer | `Volunteer`, `Organizer` | Update assignment status (`Confirmed`, `Completed`). |

---

## 11. Results & Scoring (`/api/results`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/events/:eventId/results` | `GET` | Public | Public / Auth | View results. (Public sees only when `isPublished: true`). |
| `/api/results` | `POST` | Bearer | `Judge`, `Organizer`, `Admin` | Record or update evaluation score for participant. |
| `/api/events/:eventId/results/publish` | `POST` | Bearer | `Organizer` (Owner), `Admin` | Publish results to participants and update event lifecycle. |

---

## 12. Certificates & Public Verification (`/api/certificates`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/certificates/verify/:token` | `GET` | Public | Public | Publicly verifies authenticity of a certificate. |
| `/api/certificates/my` | `GET` | Bearer | `Student` | Retrieve student's earned certificates. |
| `/api/events/:eventId/certificates/issue` | `POST` | Bearer | `Organizer`, `Admin` | Issue certificates to all attended participants. |

---

## 13. Announcements & Notifications (`/api/announcements` & `/api/notifications`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/announcements` | `GET` | Public | Public | List campus-wide or event-specific announcements. |
| `/api/announcements` | `POST` | Bearer | `Organizer`, `Admin` | Publish a new announcement. |
| `/api/notifications/my` | `GET` | Bearer | Authenticated | Retrieve user notifications. |
| `/api/notifications/:id/read` | `PATCH` | Bearer | Authenticated | Mark notification as read. |
| `/api/notifications/read-all` | `PATCH` | Bearer | Authenticated | Mark all notifications as read. |

---

## 14. Reports & System Analytics (`/api/reports`)

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/reports/event/:eventId` | `POST` | Bearer | `Organizer`, `Admin` | Compile attendance and registration report. |
| `/api/reports/system-metrics` | `GET` | Bearer | `Admin` | Global institutional metrics across events and users. |
| `/api/reports` | `GET` | Bearer | `Admin`, `Organizer` | List previously generated reports. |
