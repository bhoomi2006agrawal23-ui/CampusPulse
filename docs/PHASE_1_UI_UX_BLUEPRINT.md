# CampusPulse — UI/UX Architecture & Design System Blueprint
**Document Version:** 1.0.0  
**Phase:** 1 (Architecture & UI/UX Blueprint)  
**Status:** Complete & Locked  
**Target Viewports:** Desktop (1280px+), Tablet (768px-1024px), Mobile Web (375px-640px)

---

## 1. Visual Design Philosophy & Aesthetics

CampusPulse avoids the cluttered, dated appearance typical of legacy institutional portals. Instead, it is crafted as a sleek, professional SaaS platform:
- **Palette Discipline:** Restrained, focused color hierarchy based on deep navy foundations, crisp slate surfaces, vibrant indigo accents, and subtle violet highlights.
  - Primary Dark / Backgrounds: Deep Navy (`#0B132B`, `#1C2541`)
  - Accent / Primary Action: Electric Indigo (`#4361EE`, `#3A0CA3`)
  - Subtle Highlights / Badges: Violet (`#7209B7`, `#4CC9F0`)
  - Neutral Surfaces: Pure White (`#FFFFFF`), Light Slate (`#F8FAFC`, `#F1F5F9`)
  - Borders & Dividers: Slate Border (`#E2E8F0`, dark mode `#334155`)
- **Typography:** High legibility sans-serif (`Inter` or system-ui fallback) with strong typographic scale:
  - Display / Hero: 36px - 48px, Bold (700)
  - Page Titles (H1): 28px - 32px, Semibold (600)
  - Section Headers (H2): 20px - 24px, Semibold (600)
  - Card Titles (H3): 16px - 18px, Medium (500)
  - Body Text: 14px - 15px, Regular (400), Line height 1.6
  - Small / Badges: 12px, Medium (500)
- **Zero-Clutter Policy:** No excessive gradients, no chaotic animations, no unaligned card heights, and consistent button radii (`rounded-lg` or `rounded-xl`).

---

## 2. Core Page Inventory & Routing Structure

```
/                             -> Public Landing Page (Hero, Highlights, Categories, How It Works)
/events                       -> Public Event Catalog (Search, Category Filters, Date Range)
/events/:slug                 -> Event Detail Page (Schedule, Venue, Organizer Info, Register CTA)
/certificates/verify/:token   -> Public Certificate Verification Portal
/auth/login                   -> Unified Login (Email/Password)
/auth/register                -> Student Registration Portal

[Protected Route Groups]
/student/dashboard            -> Student Overview (Registered Events, Schedule, Tickets, Results)
/student/tickets              -> Student Digital Tickets & QR Codes
/student/certificates         -> Student Certificates Gallery

/organizer/dashboard          -> Organizer Metrics & Event Management Console
/organizer/events/new         -> Event Creation Wizard (Metadata, Venue Booking, Capacity, Schedule)
/organizer/events/:id/manage  -> Event Control Room (Participants, Attendance, Volunteers, Judges)
/organizer/events/:id/results -> Result Publication & Certificate Generation

/judge/dashboard              -> Judge Evaluation Roster & Scoring Sheets
/volunteer/dashboard          -> Volunteer Shift Schedule & Ticket Scanner / Check-in Tool

/admin/dashboard              -> Central Administrator Command Center
/admin/users                  -> User Roster & Role Assignment
/admin/venues                 -> Campus Venue Inventory & Booking Conflicts
/admin/categories             -> Event Category Configuration
/admin/reports                -> System Performance & Export Center
```

---

## 3. Global Navigation Blueprint

- **Desktop (1024px+):**
  - Sticky glassmorphic top navigation bar with CampusPulse logo, links to **Explore Events**, **Categories**, **Schedule**, and contextual role actions.
  - Guest View: Clean "Log In" button and "Get Started" (Student Signup) button.
  - Authenticated View: Role-specific dashboard link, notification bell with unread badge counter, and user profile avatar dropdown.
- **Tablet & Mobile (320px - 1023px):**
  - Compact header with logo and hamburger menu icon.
  - Slide-out accessible mobile drawer preserving complete touch targets (min 44px height).
  - Quick action floating bottom bar for common student workflows on mobile web (Explore, My Tickets, Notifications, Profile).

---

## 4. Reusable Component Specifications

### 4.1. The Event Card Component
The primary visual building block utilized across public listings and student dashboards.

```
+-----------------------------------------------------------+
| [Category Badge: "Technical"]     [Status: "Open to Reg"] |
|                                                           |
|  ANNUAL INTER-COLLEGE HACKATHON 2026                      |
|                                                           |
|  📅 Nov 15, 2026 • 09:00 AM                               |
|  📍 Main Campus Auditorium & Hall B                       |
|  👥 142 / 200 Registered                                  |
|                                                           |
|  48 hours of intense hardware & software building with...  |
|                                                           |
|  [Learn More / View Details]               [Register Now] |
+-----------------------------------------------------------+
```
- **Attributes:**
  - Category pill with dynamic color accent.
  - Registration status indicator (`Open`, `Filling Fast`, `Closed`, `Ongoing`).
  - Event title (truncated to 2 lines maximum).
  - Date and time with local calendar formatting.
  - Primary venue label with building reference.
  - Real-time capacity progress meter.
  - Action buttons: Secondary "View Details" and Primary "Register".

### 4.2. Modal & Drawer Framework
- Used for ticket QR display, quick participant check-ins, and schedule item editing.
- Traps keyboard focus, supports `Escape` key dismissal, with background backdrop blur.

### 4.3. Data Tables & Lists
- Clean zebra-striped or subtle divider borders.
- Column headers with sorting arrows for participant names, registration dates, and check-in statuses.
- Sticky action buttons (Check-in, View Details, Export CSV).

---

## 5. Dashboards Architecture by Role

### 5.1. Student Dashboard
- **Metric Cards:** Registered Events, Upcoming in Next 7 Days, Certificates Earned.
- **My Schedule Timeline:** Chronological feed of sessions for registered events.
- **Active Passes:** Quick-access digital QR ticket cards ready for volunteer scanning.

### 5.2. Organizer Dashboard
- **Overview KPIs:** Active Managed Events, Total Registrations, Attendance Rate (%), Pending Scoring.
- **Action Shortcuts:** "Create New Event", "Check-in Scanner", "Publish Announcements".
- **Managed Events Table:** Direct controls to inspect participant lists and advance event states.

### 5.3. Judge Dashboard
- **Assigned Events List:** Highlighting upcoming evaluation rounds.
- **Participant Scoring Matrix:** Clean rubric input table with validation boundaries (min/max score per criterion).

### 5.4. Volunteer Dashboard
- **Shift Schedule:** Date, venue, and reporting coordinator contact.
- **Check-In Scanner Interface:** High-contrast, mobile-friendly input to enter ticket codes or camera-based QR scan to immediately record attendance.

### 5.5. Admin Dashboard
- **Institutional Health Metrics:** Total Users by Role, Active Campus Venues, Monthly Event Growth, Server & System Status.
- **Role Assignment Console:** Quick search-and-promote tool for promoting students to Organizers or Judges.

---

## 6. Feedback & State Architecture

To guarantee high user trust and visual polish across fluctuating network states:
1. **Loading Skeletons:** Animated shimmering placeholders matching card and table dimensions (never generic full-page spinners).
2. **Empty States:** Thoughtful SVG illustrations and friendly instructional copy (e.g., "No registrations yet. Explore campus events to get started!").
3. **Error Boundaries:** Clear error cards detailing the issue with a single-click "Retry" button.
4. **Form Validation Feedback:** Zod-backed inline field error messages rendered in gentle crimson (`#EF4444`) directly beneath input controls with `aria-invalid="true"`.
5. **Toast Notifications:** Ephemeral status toasts (Success, Warning, Error) anchored to bottom-right of viewport.

---

## 7. Accessibility (a11y) & Responsiveness Standards

- **Contrast Ratios:** Minimum 4.5:1 for body copy and 3:1 for large headers against all backgrounds.
- **Keyboard Navigation:** Explicit visible focus rings (`ring-2 ring-indigo-500 ring-offset-2`) across interactive elements.
- **Semantic HTML:** Strict usage of `<main>`, `<nav>`, `<header>`, `<article>`, and `<section>` tags.
- **Touch Targets:** Minimum 44px by 44px clickable area on mobile screens.
