# CampusPulse — Security Architecture & Threat Model Blueprint
**Document Version:** 1.0.0  
**Phase:** 1 (Architecture & Security Blueprint)  
**Status:** Complete & Locked  

---

## 1. Security Architecture Core Principles

CampusPulse is engineered around a defense-in-depth model tailored for multi-tier web applications deployed across decoupled frontend (Vercel) and backend (Render) architectures:
1. **Never Trust the Client:** All authorization, state transition, capacity checking, and venue collision validation occurs strictly on the server.
2. **Zero Storage of Long-Lived Secrets in Browser Storage:** Neither `localStorage` nor `sessionStorage` is ever used for JWT access tokens or refresh tokens, neutralizing DOM-based XSS token theft.
3. **Defense Against CSRF & Token Replay:** Strict Refresh Token Rotation (RTR) coupled with cryptographic SHA-256 hashing and HttpOnly, SameSite cookies.
4. **Least Privilege & Role Isolation:** Granular RBAC gates validated on every request.

---

## 2. Authentication & Token Management Lifecycle

```
[Client Application]                                            [Backend Server]
        |                                                              |
        | 1. POST /api/auth/login { email, password }                  |
        +------------------------------------------------------------->|
        |                                                              |-- Validate bcrypt hash
        |                                                              |-- Generate JWT Access Token (15m)
        |                                                              |-- Generate 64-byte random Refresh Token
        |                                                              |-- Store SHA-256(RefreshToken) in DB
        | 2. Response: Body { accessToken },                           |
        |    Header: Set-Cookie: campus_pulse_rt=... (HttpOnly)        |
        |<-------------------------------------------------------------+
        |                                                              |
[Stores accessToken in Memory]                                         |
        |                                                              |
        | 3. Authenticated API Call (Header: Bearer <accessToken>)     |
        +------------------------------------------------------------->|-- Verify JWT signature & claims
        |                                                              |
        | 4. Access Token Expires (15 mins)                            |
        |    POST /api/auth/refresh (Cookie: campus_pulse_rt)          |
        +------------------------------------------------------------->|
        |                                                              |-- Hash presented cookie
        |                                                              |-- Check DB for active session
        |                                                              |-- [IF REVOKED]: TRIGGER REUSE ALARM
        |                                                              |   Revoke ALL sessions for user!
        |                                                              |-- [IF VALID]:
        |                                                              |   Mark old session revoked
        |                                                              |   Issue new Access Token + Cookie
        | 5. Response: Body { accessToken }, New Rotated Cookie        |
        |<-------------------------------------------------------------+
```

### 2.1. Access Token Specifications
- **Lifespan:** approximately 15 minutes
- **Delivery:** returned in JSON
- **Client Storage:** client runtime memory only
- **Prohibitions:** never localStorage, never sessionStorage
- **Format:** JSON Web Token (JWT), signed with HMAC-SHA256 (`HS256`) using `JWT_ACCESS_SECRET`

```json
{
  "sub": "user_object_id_string",
  "email": "student@college.edu",
  "role": "Student",
  "iat": 1791192800,
  "exp": 1791193700
}
```

### 2.2. Refresh Token & Session Specifications
- **Lifespan:** approximately 7 days
- **Format:** cryptographically random (64 bytes generated via `crypto.randomBytes(64).toString('hex')`)
- **Delivery:** HttpOnly cookie only
- **Environment:** Secure in production
- **Response Payload:** never returned in JSON
- **Database Storage:** SHA-256 hash stored in sessions collection (raw token never stored in MongoDB)
- **Lifecycle Management:** rotation on every refresh, reuse detection, and logout revocation
- **Cookie Security Directives:**
  - `HttpOnly`: Inaccessible to JavaScript `document.cookie` (prevention of XSS extraction)
  - `Secure`: Transmitted strictly over HTTPS in production
  - `SameSite`: `None` for cross-site Vercel-to-Render communication (with `Secure: true`), or `Lax` when configured on a shared campus apex domain
  - `Path`: `/api/auth` (Restricts cookie transmission solely to authentication endpoints)

### 2.3. Refresh Token Reuse / Replay Detection
If an attacker intercepts a rotated refresh token and attempts to replay it:
1. The backend discovers the presented hash matches a session record where `isRevoked: true`.
2. This indicates either a network race condition or an active token theft event.
3. The engine activates an immediate emergency countermeasure: **All sessions linked to that `userId` are instantly revoked**.
4. The legitimate user is prompted to re-login, terminating any hijacked session.

---

## 3. Password Hashing & Credential Security

- **Algorithm:** `bcryptjs` with a work factor of **12 salt rounds**.
- **Plaintext Ban:** Passwords never touch database logs or responses.
- **Password Strength Rules (Zod Enforcement):**
  - Minimum 8 characters.
  - At least one uppercase letter.
  - At least one lowercase letter.
  - At least one numeric digit.
  - At least one special symbol.

---

## 4. HTTP Headers, CORS & Network Protection

### 4.1. Helmet Configuration
The Express backend utilizes `helmet` to apply industry-standard defensive headers:
- `Content-Security-Policy (CSP)`: Enforces trusted script/style domains.
- `Strict-Transport-Security (HSTS)`: `max-age=31536000; includeSubDomains; preload`.
- `X-Frame-Options`: `DENY` to prevent clickjacking.
- `X-Content-Type-Options`: `nosniff` to prevent MIME-sniffing exploits.

### 4.2. CORS (Cross-Origin Resource Sharing)
Because the frontend (Vercel) and backend (Render) operate on distinct domains:
- **Strict Allowed Origin:** Configured dynamically via `process.env.FRONTEND_URL`. Wildcards (`*`) are strictly prohibited on credentialed routes.
- **Credentials Allowed:** `credentials: true` enables the secure transmission of the refresh cookie.
- **Allowed Methods:** `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- **Allowed Headers:** `Content-Type, Authorization`.

### 4.3. Rate Limiting Strategy
To protect against brute-force attacks and volumetric DoS:
- **General API Limiter:** 100 requests per 15-minute window per IP.
- **Auth Endpoint Limiter (`/api/auth/*`):** 10 requests per 15-minute window per IP (prevents credential stuffing and brute-force password guessing).
- **Implementation:** In-memory token bucket for Phase 2; horizontally scalable Redis store planned for Phase 6.

---

## 5. Input Validation & Injection Prevention

- **Zod Request Gateways:** Every incoming HTTP request body, query parameter, and route parameter is validated using Zod schemas before reaching business logic controllers.
- **NoSQL Injection Neutralization:**
  - Express JSON parser sanitizes prototype pollution.
  - Mongoose strict query mode prevents injection of raw operator objects (`{ $gt: "" }`).
- **XSS Sanitization:** Event markdown and announcement contents are sanitized to strip inline JavaScript and dangerous HTML tags.

---

## 6. Safe Error Handling & Secrets Management

- **Centralized Error Middleware:** All unhandled exceptions are caught by a global Express error handler.
- **No Stack Traces in Production:** Detailed stack traces and MongoDB error messages are never returned to clients. Production errors provide generic, structured descriptions (`{ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' } }`).
- **Zero Secrets in Repository:** Credentials, private keys, database URIs, and third-party tokens are loaded strictly via environment variables defined in `.env.example`.
