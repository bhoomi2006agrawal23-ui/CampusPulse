# CampusPulse — Role-Based Access Control (RBAC) Matrix
**Document Version:** 1.0.0  
**Phase:** 1 (Architecture & Security Blueprint)  
**Status:** Complete & Locked  

---

## 1. Principles of CampusPulse RBAC

1. **Backend as the Absolute Boundary:** Frontend visual guards (e.g., hiding buttons or routing redirects) serve solely for user experience. The Node.js Express backend validates the JWT claims and checks role permissions on every protected endpoint via reusable middleware.
2. **Principle of Least Privilege:** Users receive strictly the permissions necessary to fulfill their roles.
3. **Immutable Self-Registration:** Public registration endpoints assign the `Student` role exclusively. Privilege escalation is impossible via the public API.
4. **Ownership Scoping:** Organizers possess write privileges **only** for events they created/own, whereas Admins maintain global oversight.

---

## 2. Global Role-Permission Matrix

| Functional Domain | Student | Organizer | Judge | Volunteer | Admin |
|---|---|---|---|---|---|
| **Public Events Catalog** | View (Published) | View (All) | View (All) | View (All) | View (All) |
| **Event Creation** | ❌ None | ✅ Create | ❌ None | ❌ None | ✅ Create |
| **Event Modification** | ❌ None | ✅ Update (Owned) | ❌ None | ❌ None | ✅ Full (Any) |
| **Event Cancellation** | ❌ None | ✅ Cancel (Owned) | ❌ None | ❌ None | ✅ Full (Any) |
| **Category Management** | View | View | View | View | ✅ Full (CRUD) |
| **Venue Registration & Management** | View (Public) | View | View | View | ✅ Full (CRUD) |
| **Venue Availability Query** | ❌ None | ✅ Check | ❌ None | ❌ None | ✅ Check |
| **Schedule Creation & Editing** | View | ✅ Manage (Owned) | View | View | ✅ Full (CRUD) |
| **Event Registration (Student)** | ✅ Create / Cancel (Own) | ❌ Disallowed | ❌ Disallowed | ❌ Disallowed | ✅ Override |
| **Participant Roster Viewing** | ❌ None | ✅ View (Owned Event) | View Assigned | View Assigned | ✅ View (All) |
| **Attendance Check-In** | ❌ None | ✅ Mark (Owned Event) | ❌ None | ✅ Mark Assigned | ✅ Mark (All) |
| **Judge Assignment** | ❌ None | ✅ Assign (Owned Event) | ❌ None | ❌ None | ✅ Assign (All) |
| **Judging & Scoring** | ❌ None | View Final | ✅ Score Assigned | ❌ None | ✅ Full Review |
| **Results Publication** | View (Published) | ✅ Publish (Owned Event) | View Draft | View Published | ✅ Publish (All) |
| **Volunteer Coordination** | ❌ None | ✅ Assign (Owned Event) | ❌ None | View Self Tasks | ✅ Manage (All) |
| **Certificates Issuance** | View / Download (Own) | ✅ Issue (Owned Event) | ❌ None | ❌ None | ✅ Issue (All) |
| **Public Certificate Verification** | ✅ Public View | ✅ Public View | ✅ Public View | ✅ Public View | ✅ Public View |
| **Announcements** | View | ✅ Create (Owned Event) | View | View | ✅ Create (All/Campus) |
| **User & Role Management** | ❌ None | ❌ None | ❌ None | ❌ None | ✅ Full (Promote/Suspend) |
| **System Reports & Analytics** | ❌ None | ✅ View (Owned Event) | ❌ None | ❌ None | ✅ Full Institutional |

---

## 3. Detailed Role Capability Profiles

### 3.1. Student Profile
- **Target User:** Enrolled college student.
- **Allowed Actions:**
  - Self-register and login.
  - Search, filter, and view details of published campus events.
  - Register for open events with available capacity before deadlines.
  - Download digital ticket / QR verification code.
  - View personal registration history and status.
  - Cancel active registrations before cancellation cutoff.
  - View published results and leaderboards.
  - Download official participation/merit certificates.
  - Receive announcements and personalized notifications.
- **Strictly Prohibited Actions:**
  - Modifying event configurations, venues, or schedules.
  - Viewing private details of other participants.
  - Scoring or altering evaluation sheets.
  - Assigning roles or altering account statuses.

### 3.2. Organizer Profile
- **Target User:** Student club heads, faculty event coordinators, department chairs.
- **Allowed Actions:**
  - Create new events in `Draft` status.
  - Check venue availability and book primary campus venues.
  - Configure multi-track schedules.
  - Transition event lifecycle (from `Draft` to `Published`, `RegistrationOpen`, etc.).
  - Review attendee rosters, export participant lists.
  - Mark attendance (check-in) during event execution.
  - Assign judges and volunteers to their own events.
  - View judge scoring submissions and compile results.
  - Publish final results and trigger certificate generation for attendees.
  - Broadcast event announcements to registrants.
  - Generate post-event attendance and demographic reports.
- **Strictly Prohibited Actions:**
  - Creating or deleting global event categories or campus venues.
  - Editing events owned by other organizers without admin delegation.
  - Modifying system-wide user credentials or roles.

### 3.3. Judge Profile
- **Target User:** Faculty judges, alumni panelists, industry guests.
- **Allowed Actions:**
  - View list of events assigned to them.
  - Access candidate rosters and submission links for evaluation.
  - Enter scoring rubrics, numerical marks, and written qualitative feedback.
  - Finalize and sign off on scoring sheets.
- **Strictly Prohibited Actions:**
  - Editing event metadata, venues, or schedules.
  - Publishing public results unilaterally.
  - Accessing administrative settings.

### 3.4. Volunteer Profile
- **Target User:** Student assistants and event crew members.
- **Allowed Actions:**
  - View assigned shifts, stations, and duties.
  - Access assigned event schedule and briefing documents.
  - Use volunteer check-in terminal to scan student tickets and mark attendance.
- **Strictly Prohibited Actions:**
  - Modifying scores, event settings, or registrations.
  - Accessing privileged financial or administrative data.

### 3.5. Admin Profile
- **Target User:** College deans, central IT administrators, campus activity directors.
- **Allowed Actions:**
  - Complete control over all 14 core system collections.
  - Promote users to `Organizer`, `Judge`, `Volunteer`, or `Admin`.
  - Suspend compromised user accounts.
  - Create, modify, and delete campus venues and capacity rules.
  - Create and manage event categories.
  - Override, modify, or cancel any campus event in the case of institutional emergencies.
  - Access institutional analytics, cross-department event metrics, and reports.

---

## 4. RBAC Middleware Implementation Pattern (Express Blueprint)

```typescript
// Conceptual middleware design for Phase 2
import { Request, Response, NextFunction } from 'express';

export type UserRole = 'Student' | 'Organizer' | 'Judge' | 'Volunteer' | 'Admin';

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    if (req.user.role === 'Admin' || allowedRoles.includes(req.user.role)) {
      return next(); // Admin has universal access or role is matched
    }
    
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Insufficient role permissions for this operation' }
    });
  };
};
```
