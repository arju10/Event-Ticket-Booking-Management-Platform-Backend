# Event Ticket Booking & Management Platform

**Version:** 1.0 
**Target Stack:** Node.js, TypeScript, Express.js, PostgreSQL, Prisma

> **What changed from the two earlier drafts:** this version keeps the richer feature set (coupons, notifications, waitlist, audit-action enum, organizer review responses) but fixes two structural problems found in that draft — a duplicated payment source of truth, and an unspecified concurrency mechanism for checkout — and trims two features (geospatial "nearby events" and "trending events") that added disproportionate complexity for the value they give a course project. Everything below is the single source of truth going forward.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Roles & Permissions Matrix](#2-roles--permissions-matrix)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema (Prisma)](#4-database-schema-prisma)
5. [Design Decisions & Why](#5-design-decisions--why)
6. [Global API Conventions](#6-global-api-conventions)
7. [Full API Specification](#7-full-api-specification)
8. [Core Business Logic Rules](#8-core-business-logic-rules)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Environment Variables](#10-environment-variables)
11. [Suggested Folder Structure](#11-suggested-folder-structure)
12. [Deliverables Checklist](#12-deliverables-checklist)

---

## 1. Project Overview

### 1.1 Description
A backend platform for discovering, booking, and managing event tickets. **Organizers** create events with multiple ticket tiers; **Attendees** discover events and book tickets with guaranteed inventory correctness under concurrent load; **Admins** moderate the platform. Payments, coupons, waitlists, notifications, and reviews round out a realistic product surface — all backed by atomic, race-condition-safe booking logic.

### 1.2 Objectives
- Robust REST API for event discovery and ticket booking
- Secure authentication and strict role-based access control
- Zero overselling under concurrent booking requests
- Real payment integration (bKash / Stripe / SSLCommerz) — no manual status updates
- Full audit trail for critical state changes
- Search, filter, sort, and paginate everywhere it matters

### 1.3 Roles
- **Attendee** — discovers events, books tickets, joins waitlists, leaves reviews
- **Organizer** — creates/manages own events, ticket tiers, check-ins, responds to reviews
- **Admin** — moderates events/users, manages coupons, views platform-wide analytics and audit logs

---

## 2. Roles & Permissions Matrix

| Action | Attendee | Organizer | Admin |
|---|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ (seeded only, no self-registration) |
| Browse / search events | ✅ | ✅ | ✅ |
| Create event | ❌ | ✅ (own) | ✅ |
| Update / publish / cancel event | ❌ | ✅ (own only) | ✅ (any) |
| Delete event (soft) | ❌ | ✅ (own only) | ✅ (any) |
| Create / update ticket tiers | ❌ | ✅ (own events) | ✅ |
| Book tickets | ✅ | ✅ | ❌ (admins don't buy) |
| View own bookings | ✅ | ✅ | ✅ |
| View an event's bookings (sales) | ❌ | ✅ (own events) | ✅ (any) |
| Cancel own booking | ✅ | ✅ | ✅ |
| Check in an attendee | ❌ | ✅ (own events) | ✅ |
| Join / leave waitlist | ✅ | ✅ | ❌ |
| View waitlist | ❌ | ✅ (own events) | ✅ |
| Leave a review | ✅ (attended only) | ❌ | ❌ |
| Respond to a review | ❌ | ✅ (own events) | ✅ |
| Validate a coupon | ✅ | ✅ | ✅ |
| Create a coupon | ❌ | ❌ | ✅ |
| View own notifications | ✅ | ✅ | ✅ |
| Manage users (suspend/role) | ❌ | ❌ | ✅ |
| View audit logs / dashboard stats | ❌ | ❌ (own-event stats only, via event detail) | ✅ (platform-wide) |

Enforced via `authenticate` (JWT verification) → `authorize(...roles)` → `isResourceOwner` (for organizer-scoped actions) middleware chain, in that order, on every protected route.

---

## 3. Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Runtime / Language | Node.js , TypeScript  | type-safe API development |
| Framework | Express.js  | REST routing/middleware |
| Database | PostgreSQL  | primary datastore |
| ORM | Prisma  | typed queries, migrations, transactions |
| Validation | Zod  | request-boundary schema validation |
| Auth | JWT (access + refresh) + bcrypt | stateless auth, hashed passwords |
| Caching | Redis  (optional but recommended) | event-list caching, rate-limit store |
| Payments | bKash / Stripe / SSLCommerz (pick one) | real payment processing |
| File storage | Multer + Cloudinary | banner/profile images |
| Security | helmet, cors, express-rate-limit | headers, CORS policy, abuse prevention |
| Logging | winston | structured app/error logs |
| Docs | Postman collection + this document | |
| Deployment |  Vercel serverless | |

---

## 4. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============= ENUMS =============

enum UserRole {
  ATTENDEE
  ORGANIZER
  ADMIN
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
  POSTPONED
}

enum TicketTierStatus {
  ACTIVE
  SOLD_OUT
  PAUSED
}

enum BookingStatus {
  PENDING           // reserved, awaiting payment
  CONFIRMED         // paid
  CANCELLED
  REFUNDED
  PARTIALLY_REFUNDED
  CHECKED_IN
  NO_SHOW
  EXPIRED           // PENDING hold that timed out
}

enum PaymentStatus {
  INITIATED
  SUCCESS
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum WaitlistStatus {
  WAITING
  NOTIFIED
  CONVERTED
  EXPIRED
  CANCELLED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  SOFT_DELETE
  RESTORE
  PUBLISH
  CANCEL
  CONFIRM
  REFUND
  CHECK_IN
  STATUS_CHANGE
  ROLE_CHANGE
  SUSPEND
  PAYMENT_INITIATE
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  PAYMENT_REFUND
  COUPON_CREATE
  WAITLIST_CONVERT
}

// ============= MODELS =============

model User {
  id              String      @id @default(cuid())
  email           String      @unique
  password        String
  name            String
  role            UserRole    @default(ATTENDEE)

  phone           String?
  profileImage    String?
  dateOfBirth     DateTime?
  bio             String?
  notificationPreferences Json? @default("{\"email\":true,\"sms\":false}")

  bookings        Booking[]
  ownedEvents     Event[]     @relation("Organizer")
  reviews         Review[]
  auditLogs       AuditLog[]
  waitlistEntries Waitlist[]
  notifications   Notification[]
  payments        Payment[]

  isActive        Boolean     @default(true)
  isEmailVerified Boolean     @default(false)
  lastLogin       DateTime?
  deletedAt       DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([email])
  @@index([role, isActive])
}

model Event {
  id              String      @id @default(cuid())
  title           String
  slug            String      @unique
  description     String      @db.Text
  category        String
  subCategory     String?

  venue           String
  address         String
  city            String
  country         String
  isVirtual       Boolean     @default(false)
  virtualLink     String?

  startDate       DateTime
  endDate         DateTime
  timezone        String      @default("Asia/Dhaka")

  status          EventStatus @default(DRAFT)

  organizerId     String
  organizer       User        @relation("Organizer", fields: [organizerId], references: [id])

  maxTicketsPerUser Int       @default(10)
  isWaitlistEnabled Boolean   @default(true)
  allowRefund      Boolean    @default(true)

  bannerImage     String?
  galleryImages   String[]
  ageRestriction  Int?
  additionalInfo  Json?

  ticketTiers     TicketTier[]
  bookings        Booking[]
  reviews         Review[]
  waitlistEntries Waitlist[]

  isActive        Boolean     @default(true)
  publishedAt     DateTime?
  cancelledAt     DateTime?
  deletedAt       DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([organizerId, status])
  @@index([category, status])
  @@index([startDate, status])
  @@index([city, status])
  @@index([slug])
}

model TicketTier {
  id              String      @id @default(cuid())
  eventId         String
  event           Event       @relation(fields: [eventId], references: [id])

  name            String      // "VIP", "Early Bird", "General"
  description     String?
  price           Decimal     @db.Decimal(10, 2)

  quantity        Int         // total capacity
  sold            Int         @default(0)   // confirmed (paid) count
  reserved        Int         @default(0)   // held during PENDING checkout, not yet paid

  minPurchase     Int         @default(1)
  maxPurchase     Int         @default(10)

  status          TicketTierStatus @default(ACTIVE)
  saleStartDate   DateTime?
  saleEndDate     DateTime?

  includes        String[]

  deletedAt       DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  bookings        Booking[]
  waitlistEntries Waitlist[]

  @@index([eventId])
  @@index([eventId, status])
}
// Invariant enforced in application code + a DB CHECK constraint:
//   sold + reserved <= quantity   (never oversell, never over-hold)

model Booking {
  id              String        @id @default(cuid())
  bookingNumber   String        @unique   // e.g. BK-20260901-ABCDEF

  userId          String
  user            User          @relation(fields: [userId], references: [id])
  eventId         String
  event           Event         @relation(fields: [eventId], references: [id])
  ticketTierId    String
  ticketTier      TicketTier    @relation(fields: [ticketTierId], references: [id])

  quantity        Int
  unitPrice       Decimal       @db.Decimal(10, 2)
  totalPrice      Decimal       @db.Decimal(10, 2)
  discountAmount  Decimal       @db.Decimal(10, 2) @default(0)
  finalAmount     Decimal       @db.Decimal(10, 2)
  couponCode      String?

  status          BookingStatus @default(PENDING)

  checkedInAt     DateTime?
  checkedInBy     String?

  specialRequests String?
  dietaryNeeds    String?

  cancelledAt     DateTime?
  cancellationReason String?
  refundAmount    Decimal?      @db.Decimal(10, 2)
  refundProcessedAt DateTime?

  // NOTE: payment status is intentionally NOT duplicated here.
  // Payment.status via the one-to-one `payment` relation is the single
  // source of truth for anything payment-related. Query through it.
  payment         Payment?
  review          Review?

  deletedAt       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId, status])
  @@index([eventId, status])
  @@index([bookingNumber])
}

model Payment {
  id              String        @id @default(cuid())
  bookingId       String        @unique
  booking         Booking       @relation(fields: [bookingId], references: [id])
  userId          String
  user            User          @relation(fields: [userId], references: [id])

  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("BDT")

  method          String        // "BKASH" | "STRIPE" | "SSLCOMMERZ"
  transactionId   String?       @unique
  status          PaymentStatus @default(INITIATED)
  failureReason   String?
  rawResponse     Json?

  refundedAmount  Decimal?      @db.Decimal(10, 2)
  refundReason    String?
  refundedAt      DateTime?

  deletedAt       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([bookingId])
  @@index([transactionId])
  @@index([status])
}

model Waitlist {
  id              String          @id @default(cuid())
  eventId         String
  event           Event           @relation(fields: [eventId], references: [id])
  userId          String
  user            User            @relation(fields: [userId], references: [id])
  ticketTierId    String
  ticketTier      TicketTier      @relation(fields: [ticketTierId], references: [id])

  quantity        Int
  status          WaitlistStatus  @default(WAITING)
  offerExpiresAt  DateTime?       // set when NOTIFIED — window to convert before it lapses

  notifiedAt      DateTime?
  convertedAt     DateTime?
  expiredAt        DateTime?

  deletedAt       DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([eventId, userId, ticketTierId])
  @@index([eventId, status])
  @@index([userId, status])
}

model Review {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  eventId           String
  event             Event     @relation(fields: [eventId], references: [id])
  bookingId         String    @unique
  booking           Booking   @relation(fields: [bookingId], references: [id])

  rating            Int       // 1-5
  comment           String?   @db.Text

  organizerResponse String?   @db.Text
  responseDate      DateTime?

  isHidden          Boolean   @default(false)
  hiddenReason      String?

  deletedAt         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([eventId, rating])
  @@index([userId])
}

model Coupon {
  id            String    @id @default(cuid())
  code          String    @unique
  description   String?

  discountType  String    // "PERCENTAGE" | "FIXED"
  discountValue Decimal   @db.Decimal(10, 2)
  minPurchase   Decimal?  @db.Decimal(10, 2)
  maxDiscount   Decimal?  @db.Decimal(10, 2)

  usageLimit    Int?
  usedCount     Int       @default(0)
  perUserLimit  Int       @default(1)

  startDate     DateTime
  endDate       DateTime

  isActive      Boolean   @default(true)
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([code])
  @@index([startDate, endDate])
}

model Notification {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])

  type      String    // "BOOKING_CONFIRMATION" | "EVENT_REMINDER" | "WAITLIST_OFFER" | "REFUND_PROCESSED"
  title     String
  message   String    @db.Text
  data      Json?

  isRead    Boolean   @default(false)
  readAt    DateTime?

  deletedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

model AuditLog {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])

  action      AuditAction
  entityType  String      // "User" | "Event" | "TicketTier" | "Booking" | "Payment" | "Coupon"
  entityId    String

  oldValues   Json?
  newValues   Json?
  description String?

  ipAddress   String?
  userAgent   String?

  createdAt   DateTime    @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action, createdAt])
}
```

---

## 5. Design Decisions & Why

A few choices here diverge from the earlier drafts on purpose — worth understanding before you build, since they affect how you write the checkout logic.

| Decision | Reasoning |
|---|---|
| **Payment is the single source of truth for payment state.** `Booking` has no `paymentStatus` field. | The earlier expanded draft stored payment status on both `Booking` and `Payment`, which can drift out of sync. One source of truth, always joined, never duplicated. |
| **`TicketTier.sold` + `TicketTier.reserved` (two-phase hold), not a single `remainingQuantity` counter.** | On `POST /bookings`, you *reserve* (increment `reserved`) inside the transaction, not *sell* immediately — the booking isn't paid yet. On payment success, `reserved` → `sold`. On payment failure/timeout, `reserved` is released. Available inventory at any moment = `quantity - sold - reserved`. This is more correct than decrementing on booking creation, because a `PENDING` booking that never pays would otherwise permanently lock inventory. |
| **No per-ticket QR codes; check-in is booking-level.** | Individually-coded tickets (one QR per seat) are a nice-to-have but roughly double the surface area (a `Ticket` child table, per-unit state machine) for a feature (checking in 3 people from one booking separately) that's genuinely a "future enhancement," not core to demonstrating concurrency-safe inventory. Booking-level check-in (`Booking.status = CHECKED_IN`, one QR per booking) is simpler and still fully demonstrates the pattern. |
| **Refund policy is a fixed, platform-wide tiered rule (§8.3), not a per-event configurable `refundDeadline`.** | Configurable-per-event refund windows are realistic but add a validation branch to every refund calculation for limited teaching value in this context. A single fixed policy is easier to test and reason about; `Event.allowRefund` still lets an organizer opt out entirely. |
| **Dropped "nearby events" (geospatial) and "trending events."** | Prisma has no native geospatial query support — `nearby` needs raw SQL (Haversine formula) or a PostGIS extension, which is disproportionate setup cost for one endpoint. "Trending" needs a scoring algorithm with no clear spec. Both are reasonable **future enhancements** (see note in §12) but were cut from the required 44 to keep scope realistic. |
| **Booking creation is documented as an explicit atomic transaction (§8.1)**, not left implicit. | This is the single most important technical requirement in the whole project — it gets its own worked-through algorithm, not just a request/response pair. |

---

## 6. Global API Conventions

### 6.1 Base URL & Versioning
```
https://<host>/api/v1
```

### 6.2 Standard Response Envelope

**Success (single resource):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-09-02T10:30:00Z"
}
```

**Success (paginated list):**
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2026-09-02T10:30:00Z"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human readable error message",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ],
  "code": "VALIDATION_ERROR",
  "timestamp": "2026-09-02T10:30:00Z"
}
```

### 6.3 HTTP Status Codes

| Code | Meaning | Used when |
|---|---|---|
| 200 | OK | successful GET/PATCH |
| 201 | Created | successful POST creating a resource |
| 204 | No Content | successful DELETE (soft delete) |
| 400 | Bad Request | validation error |
| 401 | Unauthorized | missing/invalid/expired token |
| 402 | Payment Required | payment processing failed |
| 403 | Forbidden | valid token, wrong role/ownership |
| 404 | Not Found | resource doesn't exist or is soft-deleted |
| 409 | Conflict | sold out, duplicate email, overlapping review, cancellation not allowed |
| 422 | Unprocessable Entity | semantically invalid state transition |
| 429 | Too Many Requests | rate limit exceeded |
| 500 | Internal Server Error | unhandled exception |

### 6.4 Error Codes Reference

| Code | Description | HTTP Status |
|---|---|---|
| VALIDATION_ERROR | Input validation failed | 400 |
| UNAUTHORIZED | Authentication required | 401 |
| INVALID_TOKEN | Invalid or expired token | 401 |
| FORBIDDEN | Insufficient permissions | 403 |
| NOT_FOUND | Resource not found | 404 |
| CONFLICT | Resource already exists | 409 |
| INSUFFICIENT_TICKETS | Not enough tickets available | 409 |
| CANCELLATION_NOT_ALLOWED | Cannot cancel booking | 409 |
| INVALID_COUPON | Coupon is invalid, expired, or limit reached | 400 |
| PAYMENT_FAILED | Payment processing failed | 402 |
| RATE_LIMIT_EXCEEDED | Too many requests | 429 |
| INTERNAL_SERVER_ERROR | Server error | 500 |

### 6.5 Authentication
- Header: `Authorization: Bearer <accessToken>`
- Access token TTL: 1 hour. Refresh token TTL: 7 days, rotated on use, stored hashed.
- Passwords hashed with bcrypt, ≥10 salt rounds.

### 6.6 Common Pagination/Filter Query Params
```
?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

---

## 7. Full API Specification

**44 endpoints total**, grouped below. Every mutating endpoint validates its body with Zod before reaching business logic.

### 7.1 Authentication (6)

#### `POST /api/v1/auth/register`
**Auth:** none

Request:
```json
{
  "email": "attendee@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+8801712345678",
  "role": "ATTENDEE"
}
```
Validation: `email` valid + unique; `password` min 8 chars with upper/lower/number; `name` 2–50 chars; `role` in `["ATTENDEE","ORGANIZER"]` (never `ADMIN` via this route).

Success (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "usr_123", "email": "attendee@example.com", "name": "John Doe", "role": "ATTENDEE" },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```
Errors: `409/VALIDATION_ERROR` email already exists.

---

#### `POST /api/v1/auth/login`
**Auth:** none

Request: `{ "email": "attendee@example.com", "password": "SecurePass123!" }`

Success (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "usr_123", "email": "attendee@example.com", "name": "John Doe", "role": "ATTENDEE" },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 3600
  }
}
```
Errors: `401/AUTH_ERROR` invalid credentials; `403` account suspended (`isActive: false`).

---

#### `POST /api/v1/auth/refresh-token`
**Auth:** none

Request: `{ "refreshToken": "eyJhbGciOi..." }`

Success (200): `{ "success": true, "message": "Token refreshed successfully", "data": { "accessToken": "...", "refreshToken": "...", "expiresIn": 3600 } }`
Errors: `401/INVALID_TOKEN` reused/expired refresh token.

---

#### `POST /api/v1/auth/logout`
**Auth:** Bearer

Request: `{ "refreshToken": "eyJhbGciOi..." }`
Success (200): `{ "success": true, "message": "Logged out successfully", "data": null }`

---

#### `POST /api/v1/auth/forgot-password`
**Auth:** none

Request: `{ "email": "attendee@example.com" }`
Success (200): `{ "success": true, "message": "Password reset link sent to your email", "data": null }`
(Always returns 200 regardless of whether the email exists, to avoid user enumeration.)

---

#### `POST /api/v1/auth/reset-password`
**Auth:** none

Request: `{ "token": "reset_token_123", "newPassword": "NewSecurePass123!" }`
Success (200): `{ "success": true, "message": "Password reset successfully", "data": null }`
Errors: `400/VALIDATION_ERROR` token invalid or expired.

---

### 7.2 Users / Profile (5)

#### `GET /api/v1/users/me`
**Auth:** Bearer

Success (200):
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "usr_123",
    "email": "attendee@example.com",
    "name": "John Doe",
    "phone": "+8801712345678",
    "role": "ATTENDEE",
    "profileImage": "https://cloudinary.com/image.jpg",
    "bio": "Event enthusiast",
    "isEmailVerified": true,
    "notificationPreferences": { "email": true, "sms": false },
    "createdAt": "2026-01-01T10:00:00Z"
  }
}
```

#### `PATCH /api/v1/users/me`
**Auth:** Bearer

Request (all optional): `{ "name": "John Updated", "phone": "+8801712345679", "bio": "Updated bio", "notificationPreferences": { "email": true, "sms": true } }`
Success (200): updated user object (same shape as above).

#### `POST /api/v1/users/me/profile-image`
**Auth:** Bearer — `multipart/form-data`, field `image` (jpg/png/gif, ≤5MB)

Success (200): `{ "success": true, "message": "Profile image updated successfully", "data": { "profileImage": "https://cloudinary.com/users/usr_123/image.jpg" } }`

#### `PATCH /api/v1/users/change-password`
**Auth:** Bearer

Request: `{ "currentPassword": "OldPass123!", "newPassword": "NewPass456!", "confirmNewPassword": "NewPass456!" }`
Success (200): `{ "success": true, "message": "Password changed successfully", "data": null }`
Errors: `400` current password incorrect; `400` confirmation mismatch.

#### `GET /api/v1/users/:id/profile`
**Auth:** none (public)

Success (200): `{ "success": true, "message": "User profile retrieved", "data": { "id": "usr_123", "name": "John Doe", "profileImage": "...", "bio": "...", "totalEvents": 15, "averageRating": 4.5 } }`
(Only relevant/public fields — never email/phone unless it's the caller's own profile.)

---

### 7.3 Events (6)

#### `POST /api/v1/events`
**Auth:** Bearer — `ORGANIZER`, `ADMIN`

Request:
```json
{
  "title": "Tech Conference 2026",
  "description": "Annual technology conference featuring industry leaders.",
  "category": "Conference",
  "subCategory": "Technology",
  "venue": "Bangabandhu International Conference Center",
  "address": "Agargaon, Dhaka 1207",
  "city": "Dhaka",
  "country": "Bangladesh",
  "startDate": "2026-12-15T09:00:00Z",
  "endDate": "2026-12-16T18:00:00Z",
  "timezone": "Asia/Dhaka",
  "isVirtual": false,
  "maxTicketsPerUser": 4,
  "isWaitlistEnabled": true,
  "allowRefund": true,
  "ageRestriction": 18,
  "bannerImage": "https://cloudinary.com/events/banner.jpg"
}
```
Validation: `title` 5–200 chars; `description` 50–5000 chars; `startDate` future; `endDate` after `startDate`. Created with `status: DRAFT` and a server-generated unique `slug`.

Success (201):
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": { "id": "evt_123", "title": "Tech Conference 2026", "slug": "tech-conference-2026", "status": "DRAFT", "organizerId": "usr_456", "createdAt": "2026-09-02T10:30:00Z" }
}
```

---

#### `GET /api/v1/events`
**Auth:** none

Query: `?page=1&limit=20&category=Conference&city=Dhaka&status=PUBLISHED&sortBy=startDate&sortOrder=asc&dateFrom=2026-09-01&dateTo=2026-12-31&priceMin=100&priceMax=500&search=tech`

| Param | Type | Notes |
|---|---|---|
| page, limit | number | pagination |
| category, subCategory, city, status | string | exact-match filters |
| sortBy, sortOrder | string | e.g. `startDate`, `asc`/`desc` |
| dateFrom, dateTo | date | range on `startDate` |
| priceMin, priceMax | number | filters on lowest tier price |
| search | string | case-insensitive match on `title`, `venue`, `description` |

Public callers only ever see `status: PUBLISHED`; organizers/admins may pass `status=` to see their own `DRAFT`/`CANCELLED` events.

Success (200):
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "items": [
      {
        "id": "evt_123",
        "title": "Tech Conference 2026",
        "slug": "tech-conference-2026",
        "category": "Conference",
        "venue": "Bangabandhu International Conference Center",
        "city": "Dhaka",
        "startDate": "2026-12-15T09:00:00Z",
        "bannerImage": "https://cloudinary.com/banner.jpg",
        "organizer": { "id": "usr_456", "name": "Tech Corp" },
        "lowestPrice": 500,
        "averageRating": 4.5
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8, "hasNext": true, "hasPrev": false }
  }
}
```

---

#### `GET /api/v1/events/:id`
**Auth:** none

Success (200):
```json
{
  "success": true,
  "message": "Event details retrieved",
  "data": {
    "id": "evt_123",
    "title": "Tech Conference 2026",
    "slug": "tech-conference-2026",
    "description": "Annual technology conference featuring industry leaders.",
    "category": "Conference",
    "venue": "Bangabandhu International Conference Center",
    "city": "Dhaka",
    "startDate": "2026-12-15T09:00:00Z",
    "endDate": "2026-12-16T18:00:00Z",
    "status": "PUBLISHED",
    "organizer": { "id": "usr_456", "name": "Tech Corp", "profileImage": "..." },
    "ticketTiers": [
      { "id": "tier_123", "name": "Early Bird", "price": 500, "quantity": 50, "sold": 5, "reserved": 2, "available": 43, "status": "ACTIVE" },
      { "id": "tier_124", "name": "VIP", "price": 2000, "quantity": 20, "sold": 18, "reserved": 1, "available": 1, "status": "ACTIVE" }
    ],
    "statistics": { "totalBookings": 23, "averageRating": 4.5, "totalReviews": 23 },
    "createdAt": "2026-01-01T10:00:00Z"
  }
}
```
`available` is always computed as `quantity - sold - reserved`, never stored directly.
Errors: `404` not found / soft-deleted.

---

#### `PATCH /api/v1/events/:id`
**Auth:** Bearer — `ORGANIZER` (owner), `ADMIN`

Request (partial): `{ "description": "Updated description", "venue": "Updated Venue" }`
Success (200): updated event object.
Errors: `403` not owner; `409` cannot edit an event that has already started.

---

#### `PATCH /api/v1/events/:id/status`
**Auth:** Bearer — `ORGANIZER` (owner), `ADMIN`

Request: `{ "status": "PUBLISHED" }` — one of `DRAFT | PUBLISHED | CANCELLED | COMPLETED | POSTPONED`
Success (200): `{ "success": true, "message": "Event status updated successfully", "data": { "id": "evt_123", "status": "PUBLISHED", "publishedAt": "2026-09-02T11:30:00Z" } }`
Business rule: transitioning to `CANCELLED` triggers full refunds for all `CONFIRMED` bookings and writes an `AuditLog` per affected booking.

---

#### `DELETE /api/v1/events/:id`
**Auth:** Bearer — `ORGANIZER` (owner), `ADMIN`
Soft delete only (`deletedAt` set).

Success (204): no body.
Errors: `409` event has active `CONFIRMED` bookings less than 7 days before start — must be cancelled (with refunds) via the status endpoint instead of deleted.

---

### 7.4 Ticket Tiers (3)

#### `POST /api/v1/events/:eventId/ticket-tiers`
**Auth:** Bearer — `ORGANIZER` (owner), `ADMIN`

Request:
```json
{
  "name": "Early Bird",
  "description": "Limited early bird tickets",
  "price": 500,
  "quantity": 50,
  "minPurchase": 1,
  "maxPurchase": 4,
  "saleStartDate": "2026-09-01T00:00:00Z",
  "saleEndDate": "2026-10-01T00:00:00Z",
  "includes": ["Lunch", "Swag Bag"]
}
```
Success (201): `{ "success": true, "message": "Ticket tier added successfully", "data": { "id": "tier_123", "eventId": "evt_123", "name": "Early Bird", "price": 500, "quantity": 50, "sold": 0, "reserved": 0, "available": 50, "status": "ACTIVE" } }`

#### `PATCH /api/v1/ticket-tiers/:id`
**Auth:** Bearer — `ORGANIZER` (owner), `ADMIN`

Request (partial): `{ "price": 600, "quantity": 60, "status": "PAUSED" }`
Business rule: `quantity` may only be raised, never lowered below `sold + reserved`.
Success (200): updated tier object.
Errors: `422` attempt to lower quantity below committed count.

#### `GET /api/v1/events/:id/ticket-tiers`
**Auth:** none
Success (200): `{ "success": true, "message": "Ticket tiers retrieved", "data": { "items": [ /* tier objects, shape as above */ ] } }`

---

### 7.5 Bookings — ⭐ Concurrency-Critical (5)

#### `POST /api/v1/events/:eventId/book`
**Auth:** Bearer — `ATTENDEE`, `ORGANIZER` (buying, not for own event)

Request:
```json
{
  "ticketTierId": "tier_123",
  "quantity": 2,
  "specialRequests": "Wheelchair accessible seating",
  "dietaryNeeds": "Vegetarian",
  "couponCode": "EARLY50"
}
```

**Server-side flow — see §8.1 for the full transaction algorithm.** In short: lock the tier row, verify sale window + availability + per-user limit, apply coupon (server-validated, never trust a client-sent discount amount), increment `reserved`, create the `Booking` (`status: PENDING`), then return a payment redirect.

Success (201):
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "bkg_123",
      "bookingNumber": "BK-20260902-ABCDEF",
      "eventId": "evt_123",
      "eventTitle": "Tech Conference 2026",
      "ticketTierName": "Early Bird",
      "quantity": 2,
      "unitPrice": 500,
      "totalPrice": 1000,
      "discountAmount": 100,
      "finalAmount": 900,
      "status": "PENDING",
      "expiresAt": "2026-09-02T12:15:00Z",
      "createdAt": "2026-09-02T12:00:00Z"
    },
    "payment": { "paymentUrl": "https://checkout.example.com/pay/abc123" }
  }
}
```
Errors:
- `409/INSUFFICIENT_TICKETS` — `{ "success": false, "message": "Not enough tickets available", "errors": [{ "field": "tier_123", "message": "Only 1 ticket remaining" }], "code": "INSUFFICIENT_TICKETS" }`
- `422` — sale window closed, or `maxTicketsPerUser`/tier `maxPurchase` exceeded
- `400/INVALID_COUPON` — coupon invalid, expired, or per-user limit reached

---

#### `GET /api/v1/users/bookings`
**Auth:** Bearer
Query: `?status=CONFIRMED&page=1&limit=20&eventId=evt_123`

Success (200): paginated list of the caller's bookings (event summary + tier + status + amounts, no need for full detail here).

---

#### `GET /api/v1/bookings/:id`
**Auth:** Bearer (booking owner, the event's organizer, or admin)

Success (200):
```json
{
  "success": true,
  "message": "Booking details retrieved",
  "data": {
    "id": "bkg_123",
    "bookingNumber": "BK-20260902-ABCDEF",
    "event": { "id": "evt_123", "title": "Tech Conference 2026", "venue": "...", "startDate": "2026-12-15T09:00:00Z" },
    "ticketTier": { "id": "tier_123", "name": "Early Bird", "price": 500 },
    "quantity": 2,
    "totalPrice": 1000,
    "discountAmount": 100,
    "finalAmount": 900,
    "status": "CONFIRMED",
    "payment": { "method": "STRIPE", "status": "SUCCESS", "transactionId": "pi_3P..." },
    "checkedInAt": null,
    "createdAt": "2026-09-02T12:00:00Z"
  }
}
```

---

#### `PATCH /api/v1/bookings/:id/cancel`
**Auth:** Bearer (owner), `ORGANIZER` (own event), `ADMIN`

Request: `{ "cancellationReason": "Schedule conflict" }`

**Server-side flow:** validate against the refund policy (§8.3) → set `status: CANCELLED` (or `PARTIALLY_REFUNDED`) → release held inventory (`sold`/`reserved` decremented back on the tier) → trigger provider refund → if `Event.isWaitlistEnabled`, offer the freed slot to the next `WAITING` waitlist entry (§8.4) → write `AuditLog`.

Success (200): `{ "success": true, "message": "Booking cancelled successfully", "data": { "id": "bkg_123", "status": "CANCELLED", "refundAmount": 900, "refundPolicy": "FULL_REFUND", "cancelledAt": "2026-09-02T13:00:00Z" } }`
Errors: `409/CANCELLATION_NOT_ALLOWED` — event started, or booking already `CHECKED_IN`.

---

#### `POST /api/v1/bookings/:id/check-in`
**Auth:** Bearer — `ORGANIZER` (own event), `ADMIN`

Request: `{ "qrCode": "scan_data_here" }` (encodes the `bookingNumber`)

Success (200): `{ "success": true, "message": "Check-in successful", "data": { "bookingId": "bkg_123", "checkedInAt": "2026-09-02T14:00:00Z", "attendeeName": "John Doe", "ticketTierName": "Early Bird", "quantity": 2 } }`
Errors: `409` already checked in; `422` booking not `CONFIRMED` (e.g., still `PENDING` or `CANCELLED`).

---

### 7.6 Payments (3)

#### `POST /api/v1/payments/initiate`
**Auth:** Bearer (booking owner)

Request: `{ "bookingId": "bkg_123", "method": "STRIPE" }`
Idempotent — calling again for the same `PENDING` booking returns/refreshes the existing session instead of creating a duplicate.

Success (201): `{ "success": true, "message": "Payment initiated successfully", "data": { "paymentId": "pay_123", "amount": 900, "method": "STRIPE", "status": "INITIATED", "paymentUrl": "https://checkout.example.com/pay/abc123", "expiresAt": "2026-09-02T12:15:00Z" } }`

---

#### `POST /api/v1/payments/webhook`
**Auth:** none — verified via provider signature header (e.g. `Stripe-Signature`)

Request (provider-shaped payload):
```json
{
  "transactionId": "pi_3P...",
  "status": "SUCCESS",
  "amount": 900,
  "metadata": { "bookingId": "bkg_123" }
}
```
**Server-side flow (transaction):** verify signature → look up `Booking` by `metadata.bookingId` → on success: `Payment.status = SUCCESS`, move the tier's `reserved` units to `sold`, `Booking.status = CONFIRMED` → on failure: `Payment.status = FAILED`, release `reserved` back to available, `Booking.status = CANCELLED` → write `AuditLog` either way.

Success (200): `{ "success": true, "message": "Webhook processed successfully", "data": null }`
Errors: `400` invalid signature (reject, log internally, don't leak details to the caller).

---

#### `GET /api/v1/payments/:id/status`
**Auth:** Bearer (booking owner or admin)

Success (200): `{ "success": true, "message": "Payment status retrieved", "data": { "paymentId": "pay_123", "status": "SUCCESS", "amount": 900, "method": "STRIPE", "transactionId": "pi_3P...", "createdAt": "2026-09-02T12:00:00Z" } }`

---

### 7.7 Waitlist (3)

#### `POST /api/v1/events/:id/waitlist`
**Auth:** Bearer — `ATTENDEE`, `ORGANIZER` (buying-side)

Request: `{ "ticketTierId": "tier_124", "quantity": 2 }`
Precondition: only allowed when the requested tier's `available` is `0` and `Event.isWaitlistEnabled`.

Success (201): `{ "success": true, "message": "Added to waitlist successfully", "data": { "id": "wlist_123", "position": 5, "status": "WAITING", "createdAt": "2026-09-02T15:00:00Z" } }`
Errors: `409` already on the waitlist for this tier (unique constraint); `422` tier isn't actually sold out.

#### `GET /api/v1/events/:id/waitlist`
**Auth:** Bearer — `ORGANIZER` (owner), `ADMIN`

Success (200): `{ "success": true, "message": "Waitlist retrieved", "data": { "items": [ { "id": "wlist_123", "user": { "id": "usr_789", "name": "Alice" }, "quantity": 2, "status": "WAITING", "position": 1, "createdAt": "2026-09-02T15:00:00Z" } ], "total": 10 } }`

#### `DELETE /api/v1/waitlist/:id`
**Auth:** Bearer (own entry)
Success (200): `{ "success": true, "message": "Removed from waitlist successfully", "data": null }`

---

### 7.8 Reviews (3)

#### `POST /api/v1/events/:eventId/review`
**Auth:** Bearer — `ATTENDEE` with a `CHECKED_IN` booking for this event

Request: `{ "bookingId": "bkg_123", "rating": 5, "comment": "Amazing experience! Great organization." }`
Success (201): `{ "success": true, "message": "Review submitted successfully", "data": { "id": "rev_123", "rating": 5, "comment": "Amazing experience! Great organization.", "createdAt": "2026-09-02T16:00:00Z" } }`
Errors: `403` no checked-in booking for this event; `409` this booking already reviewed (one review per booking, enforced by the `bookingId @unique` on `Review`).

#### `GET /api/v1/events/:id/reviews`
**Auth:** none
Query: `?page=1&limit=10&rating=5`

Success (200):
```json
{
  "success": true,
  "message": "Reviews retrieved",
  "data": {
    "items": [
      { "id": "rev_123", "user": { "id": "usr_789", "name": "Alice" }, "rating": 5, "comment": "Amazing experience!", "organizerResponse": "Thank you!", "responseDate": "2026-09-03T10:00:00Z", "createdAt": "2026-09-02T16:00:00Z" }
    ],
    "statistics": { "averageRating": 4.5, "totalReviews": 23, "ratingDistribution": { "5": 15, "4": 5, "3": 2, "2": 1, "1": 0 } },
    "pagination": { "page": 1, "limit": 10, "total": 23, "totalPages": 3 }
  }
}
```

#### `POST /api/v1/reviews/:id/respond`
**Auth:** Bearer — `ORGANIZER` (owner of the event), `ADMIN`

Request: `{ "response": "Thank you for your valuable feedback!" }`
Success (200): `{ "success": true, "message": "Response added successfully", "data": { "id": "rev_123", "organizerResponse": "Thank you for your valuable feedback!", "responseDate": "2026-09-03T10:00:00Z" } }`
Errors: `409` review already has a response (one response per review).

---

### 7.9 Coupons (2)

#### `POST /api/v1/coupons/validate`
**Auth:** Bearer

Request: `{ "code": "EARLY50", "eventId": "evt_123", "ticketTierId": "tier_123", "quantity": 2 }`
Success (200): `{ "success": true, "message": "Coupon is valid", "data": { "code": "EARLY50", "discountType": "PERCENTAGE", "discountValue": 50, "discountedAmount": 500, "finalAmount": 500 } }`
Errors: `400/INVALID_COUPON` expired, usage limit reached, per-user limit reached, or `minPurchase` not met.

#### `POST /api/v1/admin/coupons`
**Auth:** Bearer — `ADMIN`

Request:
```json
{
  "code": "EARLY50",
  "description": "50% off for early bird registration",
  "discountType": "PERCENTAGE",
  "discountValue": 50,
  "minPurchase": 500,
  "maxDiscount": 1000,
  "usageLimit": 100,
  "perUserLimit": 1,
  "startDate": "2026-09-01T00:00:00Z",
  "endDate": "2026-10-01T00:00:00Z"
}
```
Success (201): `{ "success": true, "message": "Coupon created successfully", "data": { "id": "coup_123", "code": "EARLY50", "discountValue": 50, "isActive": true, "createdAt": "2026-09-02T19:00:00Z" } }`

---

### 7.10 Notifications (3)

#### `GET /api/v1/users/notifications`
**Auth:** Bearer
Query: `?page=1&limit=20&isRead=false`

Success (200): `{ "success": true, "message": "Notifications retrieved", "data": { "items": [ { "id": "not_123", "type": "BOOKING_CONFIRMATION", "title": "Booking Confirmed", "message": "Your booking for Tech Conference 2026 has been confirmed", "isRead": false, "createdAt": "2026-09-02T12:05:00Z" } ], "unreadCount": 5, "pagination": { "page": 1, "limit": 20, "total": 25, "totalPages": 2 } } }`

#### `PATCH /api/v1/notifications/:id/read`
**Auth:** Bearer
Success (200): `{ "success": true, "message": "Notification marked as read", "data": null }`

#### `PATCH /api/v1/notifications/read-all`
**Auth:** Bearer
Success (200): `{ "success": true, "message": "All notifications marked as read", "data": null }`

---

### 7.11 Admin (5)

#### `GET /api/v1/admin/users`
**Auth:** Bearer — `ADMIN`
Query: `?role=ORGANIZER&isActive=true&page=1&limit=20&search=john`

Success (200): `{ "success": true, "message": "Users retrieved", "data": { "items": [ { "id": "usr_123", "email": "user@example.com", "name": "John Doe", "role": "ATTENDEE", "isActive": true, "createdAt": "2026-01-01T10:00:00Z", "totalBookings": 15 } ], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } } }`

#### `PATCH /api/v1/admin/users/:id/role`
**Auth:** Bearer — `ADMIN`
Request: `{ "role": "ORGANIZER" }`
Success (200): `{ "success": true, "message": "User role updated successfully", "data": { "id": "usr_123", "role": "ORGANIZER", "updatedAt": "2026-09-02T17:00:00Z" } }`
(Writes `AuditLog` with action `ROLE_CHANGE`.)

#### `PATCH /api/v1/admin/users/:id/suspend`
**Auth:** Bearer — `ADMIN`
Request: `{ "suspend": true, "reason": "Violation of terms of service" }`
Success (200): `{ "success": true, "message": "User suspended successfully", "data": { "id": "usr_123", "isActive": false, "suspensionReason": "Violation of terms of service" } }`
(A suspended user's active sessions are invalidated; login is blocked at the auth layer.)

#### `GET /api/v1/admin/dashboard-stats`
**Auth:** Bearer — `ADMIN`

Success (200):
```json
{
  "success": true,
  "message": "Dashboard statistics",
  "data": {
    "overview": { "totalUsers": 12500, "totalOrganizers": 450, "totalEvents": 345, "totalBookings": 7890, "totalRevenue": 1250000, "totalRefunds": 45000 },
    "recentActivity": { "newUsersToday": 45, "newEventsToday": 12, "newBookingsToday": 120 },
    "popularCategories": [ { "category": "Concert", "count": 1200, "revenue": 600000 } ],
    "platformHealth": { "activeUsers": 3500, "conversionRate": 15.5, "refundRate": 3.5, "averageRating": 4.2 }
  }
}
```

#### `GET /api/v1/admin/audit-logs`
**Auth:** Bearer — `ADMIN`
Query: `?entityType=Booking&action=CANCEL&userId=usr_123&from=2026-09-01&to=2026-09-30&page=1&limit=50`

Success (200): `{ "success": true, "message": "Audit logs retrieved", "data": { "items": [ { "id": "audit_123", "user": { "id": "usr_123", "name": "John Doe" }, "action": "CANCEL", "entityType": "Booking", "entityId": "bkg_123", "description": "Booking cancelled by attendee", "newValues": { "status": "CANCELLED", "refundAmount": 900 }, "createdAt": "2026-09-02T13:00:00Z" } ], "pagination": { "page": 1, "limit": 50, "total": 1000, "totalPages": 20 } } }`

---

**Endpoint count:** 6 + 5 + 6 + 3 + 5 + 3 + 3 + 3 + 2 + 3 + 5 = **44 endpoints**, every one mapping to real functionality — no filler, comfortably clearing the 20-minimum.

---

## 8. Core Business Logic Rules

### 8.1 Inventory Integrity — the checkout transaction, worked through

This is the part your grader will stress-test, so it's worth being explicit rather than leaving it to controller-level guesswork.

```
BEGIN TRANSACTION (Serializable isolation, or explicit row lock)

1. SELECT the TicketTier row FOR UPDATE (locks it against concurrent readers/writers)
2. Compute available = tier.quantity - tier.sold - tier.reserved
3. IF now < tier.saleStartDate OR now > tier.saleEndDate → ABORT (422, sale window closed)
4. IF quantity > available → ABORT (409, INSUFFICIENT_TICKETS)
5. IF quantity > tier.maxPurchase → ABORT (400, validation)
6. Count the user's existing (non-cancelled) bookings for this event;
   IF total + quantity > event.maxTicketsPerUser → ABORT (422, per-user limit)
7. IF couponCode provided: validate against Coupon rules (§8.5); compute discountAmount server-side
8. Compute totalPrice = tier.price * quantity (server-side, never trust client price)
   Compute finalAmount = totalPrice - discountAmount
9. UPDATE tier SET reserved = reserved + quantity
10. INSERT Booking (status: PENDING, expiresAt: now + 15 minutes)
11. IF coupon used: UPDATE coupon SET usedCount = usedCount + 1

COMMIT

12. (outside the transaction) create a Payment record (status: INITIATED)
    and return the provider's payment redirect URL
```

If any abort condition triggers, the entire transaction rolls back — no partial holds, no orphaned `reserved` counts.

### 8.2 Reservation Expiry
A `PENDING` booking that receives no successful payment webhook within **15 minutes** is expired by a scheduled job: `Booking.status → EXPIRED`, and the tier's `reserved` count is released back to available. This prevents abandoned checkouts from permanently locking inventory.

### 8.3 Refund Policy (platform-wide, fixed)

| Time before event start | Refund |
|---|---|
| More than 7 days | 100% |
| Between 24 hours and 7 days | 50% |
| Less than 24 hours | 0% (no refund) |
| Event already started, or booking already `CHECKED_IN` | Cancellation blocked entirely |

`Event.allowRefund = false` blocks all cancellations for that event regardless of timing (organizer opt-out, e.g. for non-refundable ticket types).

### 8.4 Waitlist Conversion
When a `CONFIRMED` booking is cancelled and frees up inventory:
1. Find the oldest `WAITING` waitlist entry for that tier where `quantity <= freed quantity`.
2. Move that entry to `NOTIFIED`, set `offerExpiresAt = now + 2 hours`, increment the tier's `reserved` by the offered quantity (holding it for them), and create a `Notification` (`type: WAITLIST_OFFER`).
3. If the user books within the window, the entry moves to `CONVERTED`. If the window lapses, a scheduled job moves it to `EXPIRED`, releases the `reserved` hold, and repeats step 1 for the next entry in line.

### 8.5 Coupon Validation Rules
- `now` must be within `[startDate, endDate]` and `isActive = true`.
- `usedCount < usageLimit` (if `usageLimit` is set).
- The requesting user's own usage count for this code < `perUserLimit`.
- `totalPrice >= minPurchase` (if set).
- Computed discount is capped at `maxDiscount` (if set) even for `PERCENTAGE` type.

### 8.6 Pricing Integrity
Total and final amounts are **always** computed server-side from the current `TicketTier.price` and validated `Coupon` at the moment of booking — client-submitted prices/discounts are never trusted.

### 8.7 Soft Deletes
`User`, `Event`, `TicketTier`, `Booking`, `Payment`, `Review`, `Waitlist`, `Coupon`, `Notification` all use `deletedAt: DateTime?`. Every read query filters `deletedAt: null` by default; hard deletes are never performed on these tables.

### 8.8 Audit Logging
Every state-changing admin/organizer action writes an `AuditLog` row using the `AuditAction` enum: event publish/cancel, ticket tier price/quantity changes, booking cancellation/refund, check-in, user role change/suspension, coupon creation, waitlist conversion.

### 8.9 Role & Ownership Enforcement
An `ORGANIZER` may only modify resources where `event.organizerId === req.user.id`, checked via a dedicated `isResourceOwner` middleware — never left to controller-level logic alone. `ADMIN` bypasses ownership checks, but every bypass is still audit-logged.

---

## 9. Non-Functional Requirements

- **Security:** helmet for headers; CORS restricted to `CLIENT_URL`; bcrypt (≥10 rounds); JWT secrets in env vars only, never in source control.
- **Rate limiting** (`express-rate-limit`):

| Scope | Window | Max requests |
|---|---|---|
| General API | 1 min | 100 |
| Auth endpoints | 1 min | 5 |
| Booking creation | 1 min | 10 |
| Payment endpoints | 1 min | 3 |

- **Validation:** every request body/query validated with Zod at the route boundary; invalid input never reaches the service layer.
- **Performance:** indexes as declared in the schema (`Event(city, status)`, `Event(startDate, status)`, `Booking(userId, status)`, `Booking(eventId, status)`, `TicketTier(eventId)`, etc.). Use Prisma `select` to avoid over-fetching on list endpoints.
- **Caching (optional):** Redis cache for `GET /events` list, 5-minute TTL, invalidated on event create/update/status-change.
- **Idempotency:** the payment webhook handler and `POST /payments/initiate` must be safe to receive/call twice without double-crediting a booking or creating duplicate payment sessions.
- **Logging:** structured logging via `winston` (`error.log`, `combined.log`, console in dev), with request IDs for tracing.
- **Documentation:** Postman collection exported to `/docs/postman_collection.json`, alongside this document.

---

## 10. Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/event_platform"

# JWT
JWT_SECRET=change_me
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=change_me_too
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateway — pick ONE
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# or
SSLCOMMERZ_STORE_ID=...
SSLCOMMERZ_STORE_PASSWORD=...
# or
BKASH_APP_KEY=...
BKASH_APP_SECRET=...
BKASH_USERNAME=...
BKASH_PASSWORD=...
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta

# Email (optional, for notifications/password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# CORS
CLIENT_URL=http://localhost:3000
```

---

## 11. Suggested Folder Structure

```
event-ticket-platform/
├── src/
│   ├── config/            # database, redis, cloudinary, payment provider clients
│   ├── middleware/         # authenticate, authorize, isResourceOwner, rateLimiter, validateRequest, errorHandler
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── event/
│   │   ├── ticketTier/
│   │   ├── booking/
│   │   ├── payment/
│   │   ├── waitlist/
│   │   ├── review/
│   │   ├── coupon/
│   │   ├── notification/
│   │   └── admin/
│   │       (each module: *.routes.ts → *.controller.ts → *.service.ts → *.validation.ts → *.type.ts → *.constant.ts)
│   ├── jobs/               # expirePendingBookings.cron.ts, expireWaitlistOffers.cron.ts
│   ├── utils/               # apiResponse.ts, apiError.ts, generateBookingNumber.ts, catchAsync.ts, logger.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docs/
│   └── postman_collection.json
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 12. Deliverables Checklist

- [ ] All 44 endpoints implemented and returning the response shapes above
- [ ] Prisma schema matches §4 exactly, migrations committed
- [ ] Role-based + ownership middleware enforced on every protected route
- [ ] Zod validation on every mutating endpoint
- [ ] Checkout transaction implemented exactly per §8.1 (row lock → validate → reserve → commit)
- [ ] Demonstrable under concurrent load — a script firing 20 simultaneous booking requests against a 5-ticket tier confirms exactly 5 succeed and the rest get `INSUFFICIENT_TICKETS`
- [ ] Reservation-expiry cron job releases abandoned `PENDING` bookings after 15 minutes
- [ ] Working payment integration with real success/failure/webhook handling — no manual status updates
- [ ] Waitlist conversion flow implemented per §8.4
- [ ] Coupon validation enforces all rules in §8.5, including per-user limits
- [ ] Soft deletes on all applicable models (§8.7)
- [ ] Audit logs written for all admin/organizer critical actions, using the `AuditAction` enum
- [ ] Rate limiting + helmet + CORS configured per §9
- [ ] Pagination, filtering, and search implemented on all list endpoints
- [ ] Postman collection exported and included in the repo
- [ ] README with setup instructions, `.env.example`, and a seed script for demo data

---

### Deferred to "Future Enhancements" (not required, noted for completeness)
Geospatial "nearby events" search (needs raw SQL/PostGIS), a "trending events" scoring algorithm, per-seat QR ticketing, real-time WebSocket notifications, multi-language support, and multi-currency support were all in the earlier expanded draft but are intentionally out of scope here — see §5 for why.
