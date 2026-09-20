

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";

// src/config/env.ts
import dotenv from "dotenv";
dotenv.config();
function required(key, fallback) {
  const value = process.env[key] ?? fallback;
  if (value === void 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return "";
  }
  return value;
}
var env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5e3),
  apiVersion: process.env.API_VERSION ?? "v1",
  databaseUrl: required("DATABASE_URL"),
  directUrl: process.env.DIRECT_URL ?? "",
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "1h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  redisUrl: process.env.REDIS_URL ?? "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? ""
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? ""
  },
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  bookingHoldMinutes: Number(process.env.BOOKING_HOLD_MINUTES ?? 15),
  waitlistOfferHours: Number(process.env.WAITLIST_OFFER_HOURS ?? 2)
};

// src/routes/index.ts
import { Router as Router12 } from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/utils/catchAsync.ts
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// src/utils/ApiResponse.ts
function sendSuccess(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function sendPaginated(res, message, items, pagination, extra = {}) {
  return res.status(200).json({
    success: true,
    message,
    data: { items, pagination, ...extra },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}

// src/generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  previewFeatures: [],
  clientVersion: "7.10.0",
  engineVersion: "0edf323efd1d98336f3f0a68684b56f689b900d3",
  activeProvider: "postgresql",
  inlineSchema: 'generator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\n// ============= ENUMS =============\n\nenum UserRole {\n  ATTENDEE\n  ORGANIZER\n  ADMIN\n}\n\nenum EventStatus {\n  DRAFT\n  PUBLISHED\n  CANCELLED\n  COMPLETED\n  POSTPONED\n}\n\nenum TicketTierStatus {\n  ACTIVE\n  SOLD_OUT\n  PAUSED\n}\n\nenum BookingStatus {\n  PENDING\n  CONFIRMED\n  CANCELLED\n  REFUNDED\n  PARTIALLY_REFUNDED\n  CHECKED_IN\n  NO_SHOW\n  EXPIRED\n}\n\nenum PaymentStatus {\n  INITIATED\n  SUCCESS\n  FAILED\n  REFUNDED\n  PARTIALLY_REFUNDED\n}\n\nenum WaitlistStatus {\n  WAITING\n  NOTIFIED\n  CONVERTED\n  EXPIRED\n  CANCELLED\n}\n\nenum AuditAction {\n  CREATE\n  UPDATE\n  DELETE\n  SOFT_DELETE\n  RESTORE\n  PUBLISH\n  CANCEL\n  CONFIRM\n  REFUND\n  CHECK_IN\n  STATUS_CHANGE\n  ROLE_CHANGE\n  SUSPEND\n  PAYMENT_INITIATE\n  PAYMENT_SUCCESS\n  PAYMENT_FAILED\n  PAYMENT_REFUND\n  COUPON_CREATE\n  WAITLIST_CONVERT\n}\n\n// ============= MODELS =============\n\nmodel User {\n  id       String   @id @default(cuid())\n  email    String   @unique\n  password String\n  name     String\n  role     UserRole @default(ATTENDEE)\n\n  phone                   String?\n  profileImage            String?\n  dateOfBirth             DateTime?\n  bio                     String?\n  notificationPreferences Json?     @default("{\\"email\\":true,\\"sms\\":false}")\n\n  bookings        Booking[]\n  ownedEvents     Event[]        @relation("Organizer")\n  reviews         Review[]\n  auditLogs       AuditLog[]\n  waitlistEntries Waitlist[]\n  notifications   Notification[]\n  payments        Payment[]\n\n  isActive        Boolean   @default(true)\n  isEmailVerified Boolean   @default(false)\n  lastLogin       DateTime?\n  deletedAt       DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([email])\n  @@index([role, isActive])\n}\n\nmodel Event {\n  id          String  @id @default(cuid())\n  title       String\n  slug        String  @unique\n  description String\n  category    String\n  subCategory String?\n\n  venue       String\n  address     String\n  city        String\n  country     String\n  isVirtual   Boolean @default(false)\n  virtualLink String?\n\n  startDate DateTime\n  endDate   DateTime\n  timezone  String   @default("Asia/Dhaka")\n\n  status EventStatus @default(DRAFT)\n\n  organizerId String\n  organizer   User   @relation("Organizer", fields: [organizerId], references: [id])\n\n  maxTicketsPerUser Int     @default(10)\n  isWaitlistEnabled Boolean @default(true)\n  allowRefund       Boolean @default(true)\n\n  bannerImage    String?\n  galleryImages  String[]\n  ageRestriction Int?\n  additionalInfo Json?\n\n  ticketTiers     TicketTier[]\n  bookings        Booking[]\n  reviews         Review[]\n  waitlistEntries Waitlist[]\n\n  isActive    Boolean   @default(true)\n  publishedAt DateTime?\n  cancelledAt DateTime?\n  deletedAt   DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([organizerId, status])\n  @@index([category, status])\n  @@index([startDate, status])\n  @@index([city, status])\n}\n\nmodel TicketTier {\n  id      String @id @default(cuid())\n  eventId String\n  event   Event  @relation(fields: [eventId], references: [id])\n\n  name        String\n  description String?\n  price       Decimal @db.Decimal(10, 2)\n\n  quantity Int\n  sold     Int @default(0)\n  reserved Int @default(0)\n\n  minPurchase Int @default(1)\n  maxPurchase Int @default(10)\n\n  status        TicketTierStatus @default(ACTIVE)\n  saleStartDate DateTime?\n  saleEndDate   DateTime?\n\n  includes String[]\n\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  bookings        Booking[]\n  waitlistEntries Waitlist[]\n\n  @@index([eventId])\n  @@index([eventId, status])\n}\n\nmodel Booking {\n  id            String @id @default(cuid())\n  bookingNumber String @unique\n\n  userId       String\n  user         User       @relation(fields: [userId], references: [id])\n  eventId      String\n  event        Event      @relation(fields: [eventId], references: [id])\n  ticketTierId String\n  ticketTier   TicketTier @relation(fields: [ticketTierId], references: [id])\n\n  quantity       Int\n  unitPrice      Decimal @db.Decimal(10, 2)\n  totalPrice     Decimal @db.Decimal(10, 2)\n  discountAmount Decimal @default(0) @db.Decimal(10, 2)\n  finalAmount    Decimal @db.Decimal(10, 2)\n  couponCode     String?\n\n  status    BookingStatus @default(PENDING)\n  expiresAt DateTime?\n\n  checkedInAt DateTime?\n  checkedInBy String?\n\n  specialRequests String?\n  dietaryNeeds    String?\n\n  cancelledAt        DateTime?\n  cancellationReason String?\n  refundAmount       Decimal?  @db.Decimal(10, 2)\n  refundProcessedAt  DateTime?\n\n  payment Payment?\n  review  Review?\n\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  @@index([userId, status])\n  @@index([eventId, status])\n  @@index([bookingNumber])\n}\n\nmodel Payment {\n  id        String  @id @default(cuid())\n  bookingId String  @unique\n  booking   Booking @relation(fields: [bookingId], references: [id])\n  userId    String\n  user      User    @relation(fields: [userId], references: [id])\n\n  amount   Decimal @db.Decimal(10, 2)\n  currency String  @default("BDT")\n\n  method        String\n  transactionId String?       @unique\n  status        PaymentStatus @default(INITIATED)\n  failureReason String?\n  rawResponse   Json?\n\n  refundedAmount Decimal?  @db.Decimal(10, 2)\n  refundReason   String?\n  refundedAt     DateTime?\n\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  @@index([bookingId])\n  @@index([transactionId])\n  @@index([status])\n}\n\nmodel Waitlist {\n  id           String     @id @default(cuid())\n  eventId      String\n  event        Event      @relation(fields: [eventId], references: [id])\n  userId       String\n  user         User       @relation(fields: [userId], references: [id])\n  ticketTierId String\n  ticketTier   TicketTier @relation(fields: [ticketTierId], references: [id])\n\n  quantity       Int\n  status         WaitlistStatus @default(WAITING)\n  offerExpiresAt DateTime?\n\n  notifiedAt  DateTime?\n  convertedAt DateTime?\n  expiredAt   DateTime?\n\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  @@unique([eventId, userId, ticketTierId])\n  @@index([eventId, status])\n  @@index([userId, status])\n}\n\nmodel Review {\n  id        String  @id @default(cuid())\n  userId    String\n  user      User    @relation(fields: [userId], references: [id])\n  eventId   String\n  event     Event   @relation(fields: [eventId], references: [id])\n  bookingId String  @unique\n  booking   Booking @relation(fields: [bookingId], references: [id])\n\n  rating  Int\n  comment String?\n\n  organizerResponse String?\n  responseDate      DateTime?\n\n  isHidden     Boolean @default(false)\n  hiddenReason String?\n\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  @@index([eventId, rating])\n  @@index([userId])\n}\n\nmodel Coupon {\n  id          String  @id @default(cuid())\n  code        String  @unique\n  description String?\n\n  discountType  String\n  discountValue Decimal  @db.Decimal(10, 2)\n  minPurchase   Decimal? @db.Decimal(10, 2)\n  maxDiscount   Decimal? @db.Decimal(10, 2)\n\n  usageLimit   Int?\n  usedCount    Int  @default(0)\n  perUserLimit Int  @default(1)\n\n  startDate DateTime\n  endDate   DateTime\n\n  isActive  Boolean   @default(true)\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  @@index([code])\n  @@index([startDate, endDate])\n}\n\nmodel Notification {\n  id     String @id @default(cuid())\n  userId String\n  user   User   @relation(fields: [userId], references: [id])\n\n  type    String\n  title   String\n  message String\n  data    Json?\n\n  isRead Boolean   @default(false)\n  readAt DateTime?\n\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n\n  @@index([userId, isRead])\n  @@index([userId, createdAt])\n}\n\nmodel AuditLog {\n  id     String @id @default(cuid())\n  userId String\n  user   User   @relation(fields: [userId], references: [id])\n\n  action     AuditAction\n  entityType String\n  entityId   String\n\n  oldValues   Json?\n  newValues   Json?\n  description String?\n\n  ipAddress String?\n  userAgent String?\n\n  createdAt DateTime @default(now())\n\n  @@index([userId])\n  @@index([entityType, entityId])\n  @@index([action, createdAt])\n}\n',
  runtimeDataModel: {
    models: {},
    enums: {},
    types: {}
  },
  parameterizationSchema: {
    strings: [],
    graph: ""
  }
};
config.runtimeDataModel = JSON.parse(
  '{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"phone","kind":"scalar","type":"String"},{"name":"profileImage","kind":"scalar","type":"String"},{"name":"dateOfBirth","kind":"scalar","type":"DateTime"},{"name":"bio","kind":"scalar","type":"String"},{"name":"notificationPreferences","kind":"scalar","type":"Json"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToUser"},{"name":"ownedEvents","kind":"object","type":"Event","relationName":"Organizer"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"auditLogs","kind":"object","type":"AuditLog","relationName":"AuditLogToUser"},{"name":"waitlistEntries","kind":"object","type":"Waitlist","relationName":"UserToWaitlist"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToUser"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isEmailVerified","kind":"scalar","type":"Boolean"},{"name":"lastLogin","kind":"scalar","type":"DateTime"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null},"Event":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"category","kind":"scalar","type":"String"},{"name":"subCategory","kind":"scalar","type":"String"},{"name":"venue","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"city","kind":"scalar","type":"String"},{"name":"country","kind":"scalar","type":"String"},{"name":"isVirtual","kind":"scalar","type":"Boolean"},{"name":"virtualLink","kind":"scalar","type":"String"},{"name":"startDate","kind":"scalar","type":"DateTime"},{"name":"endDate","kind":"scalar","type":"DateTime"},{"name":"timezone","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"EventStatus"},{"name":"organizerId","kind":"scalar","type":"String"},{"name":"organizer","kind":"object","type":"User","relationName":"Organizer"},{"name":"maxTicketsPerUser","kind":"scalar","type":"Int"},{"name":"isWaitlistEnabled","kind":"scalar","type":"Boolean"},{"name":"allowRefund","kind":"scalar","type":"Boolean"},{"name":"bannerImage","kind":"scalar","type":"String"},{"name":"galleryImages","kind":"scalar","type":"String"},{"name":"ageRestriction","kind":"scalar","type":"Int"},{"name":"additionalInfo","kind":"scalar","type":"Json"},{"name":"ticketTiers","kind":"object","type":"TicketTier","relationName":"EventToTicketTier"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToEvent"},{"name":"reviews","kind":"object","type":"Review","relationName":"EventToReview"},{"name":"waitlistEntries","kind":"object","type":"Waitlist","relationName":"EventToWaitlist"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"cancelledAt","kind":"scalar","type":"DateTime"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null},"TicketTier":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"event","kind":"object","type":"Event","relationName":"EventToTicketTier"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"sold","kind":"scalar","type":"Int"},{"name":"reserved","kind":"scalar","type":"Int"},{"name":"minPurchase","kind":"scalar","type":"Int"},{"name":"maxPurchase","kind":"scalar","type":"Int"},{"name":"status","kind":"enum","type":"TicketTierStatus"},{"name":"saleStartDate","kind":"scalar","type":"DateTime"},{"name":"saleEndDate","kind":"scalar","type":"DateTime"},{"name":"includes","kind":"scalar","type":"String"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTicketTier"},{"name":"waitlistEntries","kind":"object","type":"Waitlist","relationName":"TicketTierToWaitlist"}],"dbName":null,"schema":null},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingNumber","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"BookingToUser"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"event","kind":"object","type":"Event","relationName":"BookingToEvent"},{"name":"ticketTierId","kind":"scalar","type":"String"},{"name":"ticketTier","kind":"object","type":"TicketTier","relationName":"BookingToTicketTier"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Decimal"},{"name":"totalPrice","kind":"scalar","type":"Decimal"},{"name":"discountAmount","kind":"scalar","type":"Decimal"},{"name":"finalAmount","kind":"scalar","type":"Decimal"},{"name":"couponCode","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"checkedInAt","kind":"scalar","type":"DateTime"},{"name":"checkedInBy","kind":"scalar","type":"String"},{"name":"specialRequests","kind":"scalar","type":"String"},{"name":"dietaryNeeds","kind":"scalar","type":"String"},{"name":"cancelledAt","kind":"scalar","type":"DateTime"},{"name":"cancellationReason","kind":"scalar","type":"String"},{"name":"refundAmount","kind":"scalar","type":"Decimal"},{"name":"refundProcessedAt","kind":"scalar","type":"DateTime"},{"name":"payment","kind":"object","type":"Payment","relationName":"BookingToPayment"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToPayment"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"PaymentToUser"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"method","kind":"scalar","type":"String"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"failureReason","kind":"scalar","type":"String"},{"name":"rawResponse","kind":"scalar","type":"Json"},{"name":"refundedAmount","kind":"scalar","type":"Decimal"},{"name":"refundReason","kind":"scalar","type":"String"},{"name":"refundedAt","kind":"scalar","type":"DateTime"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null},"Waitlist":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"event","kind":"object","type":"Event","relationName":"EventToWaitlist"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"UserToWaitlist"},{"name":"ticketTierId","kind":"scalar","type":"String"},{"name":"ticketTier","kind":"object","type":"TicketTier","relationName":"TicketTierToWaitlist"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"status","kind":"enum","type":"WaitlistStatus"},{"name":"offerExpiresAt","kind":"scalar","type":"DateTime"},{"name":"notifiedAt","kind":"scalar","type":"DateTime"},{"name":"convertedAt","kind":"scalar","type":"DateTime"},{"name":"expiredAt","kind":"scalar","type":"DateTime"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"event","kind":"object","type":"Event","relationName":"EventToReview"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"organizerResponse","kind":"scalar","type":"String"},{"name":"responseDate","kind":"scalar","type":"DateTime"},{"name":"isHidden","kind":"scalar","type":"Boolean"},{"name":"hiddenReason","kind":"scalar","type":"String"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null},"Coupon":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"code","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"discountType","kind":"scalar","type":"String"},{"name":"discountValue","kind":"scalar","type":"Decimal"},{"name":"minPurchase","kind":"scalar","type":"Decimal"},{"name":"maxDiscount","kind":"scalar","type":"Decimal"},{"name":"usageLimit","kind":"scalar","type":"Int"},{"name":"usedCount","kind":"scalar","type":"Int"},{"name":"perUserLimit","kind":"scalar","type":"Int"},{"name":"startDate","kind":"scalar","type":"DateTime"},{"name":"endDate","kind":"scalar","type":"DateTime"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"},{"name":"type","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"data","kind":"scalar","type":"Json"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"readAt","kind":"scalar","type":"DateTime"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null},"AuditLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AuditLogToUser"},{"name":"action","kind":"enum","type":"AuditAction"},{"name":"entityType","kind":"scalar","type":"String"},{"name":"entityId","kind":"scalar","type":"String"},{"name":"oldValues","kind":"scalar","type":"Json"},{"name":"newValues","kind":"scalar","type":"Json"},{"name":"description","kind":"scalar","type":"String"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null}},"enums":{},"types":{}}'
);
config.parameterizationSchema = {
  strings: JSON.parse(
    '["where","orderBy","cursor","user","organizer","event","bookings","ticketTier","waitlistEntries","_count","ticketTiers","booking","reviews","payment","review","ownedEvents","auditLogs","notifications","payments","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Event.findUnique","Event.findUniqueOrThrow","Event.findFirst","Event.findFirstOrThrow","Event.findMany","Event.createOne","Event.createMany","Event.createManyAndReturn","Event.updateOne","Event.updateMany","Event.updateManyAndReturn","Event.upsertOne","Event.deleteOne","Event.deleteMany","_avg","_sum","Event.groupBy","Event.aggregate","TicketTier.findUnique","TicketTier.findUniqueOrThrow","TicketTier.findFirst","TicketTier.findFirstOrThrow","TicketTier.findMany","TicketTier.createOne","TicketTier.createMany","TicketTier.createManyAndReturn","TicketTier.updateOne","TicketTier.updateMany","TicketTier.updateManyAndReturn","TicketTier.upsertOne","TicketTier.deleteOne","TicketTier.deleteMany","TicketTier.groupBy","TicketTier.aggregate","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","Booking.groupBy","Booking.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Waitlist.findUnique","Waitlist.findUniqueOrThrow","Waitlist.findFirst","Waitlist.findFirstOrThrow","Waitlist.findMany","Waitlist.createOne","Waitlist.createMany","Waitlist.createManyAndReturn","Waitlist.updateOne","Waitlist.updateMany","Waitlist.updateManyAndReturn","Waitlist.upsertOne","Waitlist.deleteOne","Waitlist.deleteMany","Waitlist.groupBy","Waitlist.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","Coupon.findUnique","Coupon.findUniqueOrThrow","Coupon.findFirst","Coupon.findFirstOrThrow","Coupon.findMany","Coupon.createOne","Coupon.createMany","Coupon.createManyAndReturn","Coupon.updateOne","Coupon.updateMany","Coupon.updateManyAndReturn","Coupon.upsertOne","Coupon.deleteOne","Coupon.deleteMany","Coupon.groupBy","Coupon.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","AuditLog.findUnique","AuditLog.findUniqueOrThrow","AuditLog.findFirst","AuditLog.findFirstOrThrow","AuditLog.findMany","AuditLog.createOne","AuditLog.createMany","AuditLog.createManyAndReturn","AuditLog.updateOne","AuditLog.updateMany","AuditLog.updateManyAndReturn","AuditLog.upsertOne","AuditLog.deleteOne","AuditLog.deleteMany","AuditLog.groupBy","AuditLog.aggregate","AND","OR","NOT","id","userId","AuditAction","action","entityType","entityId","oldValues","newValues","description","ipAddress","userAgent","createdAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","type","title","message","isRead","readAt","deletedAt","code","discountType","discountValue","minPurchase","maxDiscount","usageLimit","usedCount","perUserLimit","startDate","endDate","isActive","updatedAt","eventId","bookingId","rating","comment","organizerResponse","responseDate","isHidden","hiddenReason","ticketTierId","quantity","WaitlistStatus","status","offerExpiresAt","notifiedAt","convertedAt","expiredAt","amount","currency","method","transactionId","PaymentStatus","failureReason","rawResponse","refundedAmount","refundReason","refundedAt","bookingNumber","unitPrice","totalPrice","discountAmount","finalAmount","couponCode","BookingStatus","expiresAt","checkedInAt","checkedInBy","specialRequests","dietaryNeeds","cancelledAt","cancellationReason","refundAmount","refundProcessedAt","name","price","sold","reserved","maxPurchase","TicketTierStatus","saleStartDate","saleEndDate","includes","has","hasEvery","hasSome","slug","category","subCategory","venue","address","city","country","isVirtual","virtualLink","timezone","EventStatus","organizerId","maxTicketsPerUser","isWaitlistEnabled","allowRefund","bannerImage","galleryImages","ageRestriction","additionalInfo","publishedAt","email","password","UserRole","role","phone","profileImage","dateOfBirth","bio","notificationPreferences","isEmailVerified","lastLogin","every","some","none","eventId_userId_ticketTierId","is","isNot","connectOrCreate","upsert","disconnect","delete","connect","createMany","set","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'
  ),
  graph: "-QVioAEaBgAA4wIAIAgAAOcCACAMAADlAgAgDwAA5AIAIBAAAOYCACARAADoAgAgEgAA6QIAILsBAADgAgAwvAEAADgAEL0BAADgAgAwvgEBAAAAAckBQADDAgAh4AFAAMUCACHrASAAxAIAIewBQADDAgAhlwIBAL0CACG3AgEAAAABuAIBAL0CACG6AgAA4QK6AiK7AgEAvgIAIbwCAQC-AgAhvQJAAMUCACG-AgEAvgIAIb8CAADiAgAgwAIgAMQCACHBAkAAxQIAIQEAAAABACAgAwAA7QIAIAUAAPUCACAHAAD5AgAgDQAA_gIAIA4AAP8CACC7AQAA_AIAMLwBAAADABC9AQAA_AIAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHtAQEAvQIAIfUBAQC9AgAh9gECAMICACH4AQAA_QKOAiKHAgEAvQIAIYgCEAC_AgAhiQIQAL8CACGKAhAAvwIAIYsCEAC_AgAhjAIBAL4CACGOAkAAxQIAIY8CQADFAgAhkAIBAL4CACGRAgEAvgIAIZICAQC-AgAhkwJAAMUCACGUAgEAvgIAIZUCEADAAgAhlgJAAMUCACEQAwAAnAUAIAUAAJ4FACAHAACfBQAgDQAAoAUAIA4AAKEFACDgAQAAgAMAIIwCAACAAwAgjgIAAIADACCPAgAAgAMAIJACAACAAwAgkQIAAIADACCSAgAAgAMAIJMCAACAAwAglAIAAIADACCVAgAAgAMAIJYCAACAAwAgIAMAAO0CACAFAAD1AgAgBwAA-QIAIA0AAP4CACAOAAD_AgAguwEAAPwCADC8AQAAAwAQvQEAAPwCADC-AQEAAAABvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHtAQEAvQIAIfUBAQC9AgAh9gECAMICACH4AQAA_QKOAiKHAgEAAAABiAIQAL8CACGJAhAAvwIAIYoCEAC_AgAhiwIQAL8CACGMAgEAvgIAIY4CQADFAgAhjwJAAMUCACGQAgEAvgIAIZECAQC-AgAhkgIBAL4CACGTAkAAxQIAIZQCAQC-AgAhlQIQAMACACGWAkAAxQIAIQMAAAADACABAAAEADACAAAFACAXBQAA9QIAIAYAAOMCACAIAADnAgAguwEAAPoCADC8AQAABwAQvQEAAPoCADC-AQEAvQIAIcYBAQC-AgAhyQFAAMMCACHgAUAAxQIAIeQBAgDCAgAh7AFAAMMCACHtAQEAvQIAIfYBAgDCAgAh-AEAAPsCnQIilwIBAL0CACGYAhAAvwIAIZkCAgDCAgAhmgICAMICACGbAgIAwgIAIZ0CQADFAgAhngJAAMUCACGfAgAA1QIAIAcFAACeBQAgBgAAlAUAIAgAAJgFACDGAQAAgAMAIOABAACAAwAgnQIAAIADACCeAgAAgAMAIBcFAAD1AgAgBgAA4wIAIAgAAOcCACC7AQAA-gIAMLwBAAAHABC9AQAA-gIAML4BAQAAAAHGAQEAvgIAIckBQADDAgAh4AFAAMUCACHkAQIAwgIAIewBQADDAgAh7QEBAL0CACH2AQIAwgIAIfgBAAD7Ap0CIpcCAQC9AgAhmAIQAL8CACGZAgIAwgIAIZoCAgDCAgAhmwICAMICACGdAkAAxQIAIZ4CQADFAgAhnwIAANUCACADAAAABwAgAQAACAAwAgAACQAgAwAAAAMAIAEAAAQAMAIAAAUAIBMDAADtAgAgBQAA9QIAIAcAAPkCACC7AQAA9wIAMLwBAAAMABC9AQAA9wIAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHtAQEAvQIAIfUBAQC9AgAh9gECAMICACH4AQAA-AL4ASL5AUAAxQIAIfoBQADFAgAh-wFAAMUCACH8AUAAxQIAIQgDAACcBQAgBQAAngUAIAcAAJ8FACDgAQAAgAMAIPkBAACAAwAg-gEAAIADACD7AQAAgAMAIPwBAACAAwAgFAMAAO0CACAFAAD1AgAgBwAA-QIAILsBAAD3AgAwvAEAAAwAEL0BAAD3AgAwvgEBAAAAAb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACH1AQEAvQIAIfYBAgDCAgAh-AEAAPgC-AEi-QFAAMUCACH6AUAAxQIAIfsBQADFAgAh_AFAAMUCACHFAgAA9gIAIAMAAAAMACABAAANADACAAAOACABAAAAAwAgAQAAAAwAIAMAAAADACABAAAEADACAAAFACATAwAA7QIAIAUAAPUCACALAADsAgAguwEAAPQCADC8AQAAEwAQvQEAAPQCADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACHuAQEAvQIAIe8BAgDCAgAh8AEBAL4CACHxAQEAvgIAIfIBQADFAgAh8wEgAMQCACH0AQEAvgIAIQgDAACcBQAgBQAAngUAIAsAAJsFACDgAQAAgAMAIPABAACAAwAg8QEAAIADACDyAQAAgAMAIPQBAACAAwAgEwMAAO0CACAFAAD1AgAgCwAA7AIAILsBAAD0AgAwvAEAABMAEL0BAAD0AgAwvgEBAAAAAb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACHuAQEAAAAB7wECAMICACHwAQEAvgIAIfEBAQC-AgAh8gFAAMUCACHzASAAxAIAIfQBAQC-AgAhAwAAABMAIAEAABQAMAIAABUAIAMAAAAMACABAAANADACAAAOACABAAAABwAgAQAAAAMAIAEAAAATACABAAAADAAgFQMAAO0CACALAADsAgAguwEAAOoCADC8AQAAHAAQvQEAAOoCADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7gEBAL0CACH4AQAA6wKCAiL9ARAAvwIAIf4BAQC9AgAh_wEBAL0CACGAAgEAvgIAIYICAQC-AgAhgwIAAOICACCEAhAAwAIAIYUCAQC-AgAhhgJAAMUCACEBAAAAHAAgAQAAABMAICYEAADtAgAgBgAA4wIAIAgAAOcCACAKAADzAgAgDAAA5QIAILsBAADxAgAwvAEAAB8AEL0BAADxAgAwvgEBAL0CACHGAQEAvQIAIckBQADDAgAh3AEBAL0CACHgAUAAxQIAIekBQADDAgAh6gFAAMMCACHrASAAxAIAIewBQADDAgAh-AEAAPICrgIikwJAAMUCACGjAgEAvQIAIaQCAQC9AgAhpQIBAL4CACGmAgEAvQIAIacCAQC9AgAhqAIBAL0CACGpAgEAvQIAIaoCIADEAgAhqwIBAL4CACGsAgEAvQIAIa4CAQC9AgAhrwICAMICACGwAiAAxAIAIbECIADEAgAhsgIBAL4CACGzAgAA1QIAILQCAgDBAgAhtQIAAOICACC2AkAAxQIAIQ0EAACcBQAgBgAAlAUAIAgAAJgFACAKAACdBQAgDAAAlgUAIOABAACAAwAgkwIAAIADACClAgAAgAMAIKsCAACAAwAgsgIAAIADACC0AgAAgAMAILUCAACAAwAgtgIAAIADACAmBAAA7QIAIAYAAOMCACAIAADnAgAgCgAA8wIAIAwAAOUCACC7AQAA8QIAMLwBAAAfABC9AQAA8QIAML4BAQAAAAHGAQEAvQIAIckBQADDAgAh3AEBAL0CACHgAUAAxQIAIekBQADDAgAh6gFAAMMCACHrASAAxAIAIewBQADDAgAh-AEAAPICrgIikwJAAMUCACGjAgEAAAABpAIBAL0CACGlAgEAvgIAIaYCAQC9AgAhpwIBAL0CACGoAgEAvQIAIakCAQC9AgAhqgIgAMQCACGrAgEAvgIAIawCAQC9AgAhrgIBAL0CACGvAgIAwgIAIbACIADEAgAhsQIgAMQCACGyAgEAvgIAIbMCAADVAgAgtAICAMECACG1AgAA4gIAILYCQADFAgAhAwAAAB8AIAEAACAAMAIAACEAIAMAAAATACABAAAUADACAAAVACAPAwAA7QIAILsBAADvAgAwvAEAACQAEL0BAADvAgAwvgEBAL0CACG_AQEAvQIAIcEBAADwAsEBIsIBAQC9AgAhwwEBAL0CACHEAQAA4gIAIMUBAADiAgAgxgEBAL4CACHHAQEAvgIAIcgBAQC-AgAhyQFAAMMCACEGAwAAnAUAIMQBAACAAwAgxQEAAIADACDGAQAAgAMAIMcBAACAAwAgyAEAAIADACAPAwAA7QIAILsBAADvAgAwvAEAACQAEL0BAADvAgAwvgEBAAAAAb8BAQC9AgAhwQEAAPACwQEiwgEBAL0CACHDAQEAvQIAIcQBAADiAgAgxQEAAOICACDGAQEAvgIAIccBAQC-AgAhyAEBAL4CACHJAUAAwwIAIQMAAAAkACABAAAlADACAAAmACADAAAADAAgAQAADQAwAgAADgAgDgMAAO0CACAYAADiAgAguwEAAO4CADC8AQAAKQAQvQEAAO4CADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHbAQEAvQIAIdwBAQC9AgAh3QEBAL0CACHeASAAxAIAId8BQADFAgAh4AFAAMUCACEEAwAAnAUAIBgAAIADACDfAQAAgAMAIOABAACAAwAgDgMAAO0CACAYAADiAgAguwEAAO4CADC8AQAAKQAQvQEAAO4CADC-AQEAAAABvwEBAL0CACHJAUAAwwIAIdsBAQC9AgAh3AEBAL0CACHdAQEAvQIAId4BIADEAgAh3wFAAMUCACHgAUAAxQIAIQMAAAApACABAAAqADACAAArACAJAwAAnAUAIAsAAJsFACDgAQAAgAMAIIACAACAAwAgggIAAIADACCDAgAAgAMAIIQCAACAAwAghQIAAIADACCGAgAAgAMAIBUDAADtAgAgCwAA7AIAILsBAADqAgAwvAEAABwAEL0BAADqAgAwvgEBAAAAAb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7gEBAAAAAfgBAADrAoICIv0BEAC_AgAh_gEBAL0CACH_AQEAvQIAIYACAQAAAAGCAgEAvgIAIYMCAADiAgAghAIQAMACACGFAgEAvgIAIYYCQADFAgAhAwAAABwAIAEAAC0AMAIAAC4AIAEAAAADACABAAAAHwAgAQAAABMAIAEAAAAkACABAAAADAAgAQAAACkAIAEAAAAcACABAAAAAQAgGgYAAOMCACAIAADnAgAgDAAA5QIAIA8AAOQCACAQAADmAgAgEQAA6AIAIBIAAOkCACC7AQAA4AIAMLwBAAA4ABC9AQAA4AIAML4BAQC9AgAhyQFAAMMCACHgAUAAxQIAIesBIADEAgAh7AFAAMMCACGXAgEAvQIAIbcCAQC9AgAhuAIBAL0CACG6AgAA4QK6AiK7AgEAvgIAIbwCAQC-AgAhvQJAAMUCACG-AgEAvgIAIb8CAADiAgAgwAIgAMQCACHBAkAAxQIAIQ4GAACUBQAgCAAAmAUAIAwAAJYFACAPAACVBQAgEAAAlwUAIBEAAJkFACASAACaBQAg4AEAAIADACC7AgAAgAMAILwCAACAAwAgvQIAAIADACC-AgAAgAMAIL8CAACAAwAgwQIAAIADACADAAAAOAAgAQAAOQAwAgAAAQAgAwAAADgAIAEAADkAMAIAAAEAIAMAAAA4ACABAAA5ADACAAABACAXBgAAjQUAIAgAAJEFACAMAACPBQAgDwAAjgUAIBAAAJAFACARAACSBQAgEgAAkwUAIL4BAQAAAAHJAUAAAAAB4AFAAAAAAesBIAAAAAHsAUAAAAABlwIBAAAAAbcCAQAAAAG4AgEAAAABugIAAAC6AgK7AgEAAAABvAIBAAAAAb0CQAAAAAG-AgEAAAABvwKAAAAAAcACIAAAAAHBAkAAAAABARgAAD0AIBC-AQEAAAAByQFAAAAAAeABQAAAAAHrASAAAAAB7AFAAAAAAZcCAQAAAAG3AgEAAAABuAIBAAAAAboCAAAAugICuwIBAAAAAbwCAQAAAAG9AkAAAAABvgIBAAAAAb8CgAAAAAHAAiAAAAABwQJAAAAAAQEYAAA_ADABGAAAPwAwFwYAALsEACAIAAC_BAAgDAAAvQQAIA8AALwEACAQAAC-BAAgEQAAwAQAIBIAAMEEACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_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-wMAICUAAP4DACAmAAD9AwAgNwAA_AMAIDgAAP8DACDgAQAAgAMAIJMCAACAAwAgpQIAAIADACCrAgAAgAMAILICAACAAwAgtAIAAIADACC1AgAAgAMAILYCAACAAwAgIbsBAADYAgAwvAEAAGEAEL0BAADYAgAwvgEBAJgCACHGAQEAmAIAIckBQACcAgAh3AEBAJgCACHgAUAAqgIAIekBQACcAgAh6gFAAJwCACHrASAAqQIAIewBQACcAgAh-AEAANkCrgIikwJAAKoCACGjAgEAmAIAIaQCAQCYAgAhpQIBAJsCACGmAgEAmAIAIacCAQCYAgAhqAIBAJgCACGpAgEAmAIAIaoCIACpAgAhqwIBAJsCACGsAgEAmAIAIa4CAQCYAgAhrwICALMCACGwAiAAqQIAIbECIACpAgAhsgIBAJsCACGzAgAA1QIAILQCAgCyAgAhtQIAAJoCACC2AkAAqgIAIQMAAAAfACABAABgADAkAABhACADAAAAHwAgAQAAIAAwAgAAIQAgAQAAAAkAIAEAAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACAUBQAA-AMAIAYAAPkDACAIAAD6AwAgvgEBAAAAAcYBAQAAAAHJAUAAAAAB4AFAAAAAAeQBAgAAAAHsAUAAAAAB7QEBAAAAAfYBAgAAAAH4AQAAAJ0CApcCAQAAAAGYAhAAAAABmQICAAAAAZoCAgAAAAGbAgIAAAABnQJAAAAAAZ4CQAAAAAGfAgAA9wMAIAEYAABpACARvgEBAAAAAcYBAQAAAAHJAUAAAAAB4AFAAAAAAeQBAgAAAAHsAUAAAAAB7QEBAAAAAfYBAgAAAAH4AQAAAJ0CApcCAQAAAAGYAhAAAAABmQICAAAAAZoCAgAAAAGbAgIAAAABnQJAAAAAAZ4CQAAAAAGfAgAA9wMAIAEYAABrADABGAAAawAwFAUAANwDACAGAADdAwAgCAAA3gMAIL4BAQCEAwAhxgEBAIYDACHJAUAAhwMAIeABQACOAwAh5AECAJkDACHsAUAAhwMAIe0BAQCEAwAh9gECAJkDACH4AQAA2gOdAiKXAgEAhAMAIZgCEACWAwAhmQICAJkDACGaAgIAmQMAIZsCAgCZAwAhnQJAAI4DACGeAkAAjgMAIZ8CAADbAwAgAgAAAAkAIBgAAG4AIBG-AQEAhAMAIcYBAQCGAwAhyQFAAIcDACHgAUAAjgMAIeQBAgCZAwAh7AFAAIcDACHtAQEAhAMAIfYBAgCZAwAh-AEAANoDnQIilwIBAIQDACGYAhAAlgMAIZkCAgCZAwAhmgICAJkDACGbAgIAmQMAIZ0CQACOAwAhngJAAI4DACGfAgAA2wMAIAIAAAAHACAYAABwACACAAAABwAgGAAAcAAgAwAAAAkAIB8AAGkAICAAAG4AIAEAAAAJACABAAAABwAgCQkAANUDACAlAADYAwAgJgAA1wMAIDcAANYDACA4AADZAwAgxgEAAIADACDgAQAAgAMAIJ0CAACAAwAgngIAAIADACAUuwEAANMCADC8AQAAdwAQvQEAANMCADC-AQEAmAIAIcYBAQCbAgAhyQFAAJwCACHgAUAAqgIAIeQBAgCzAgAh7AFAAJwCACHtAQEAmAIAIfYBAgCzAgAh-AEAANQCnQIilwIBAJgCACGYAhAAsAIAIZkCAgCzAgAhmgICALMCACGbAgIAswIAIZ0CQACqAgAhngJAAKoCACGfAgAA1QIAIAMAAAAHACABAAB2ADAkAAB3ACADAAAABwAgAQAACAAwAgAACQAgAQAAAAUAIAEAAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACAdAwAA0AMAIAUAANEDACAHAADSAwAgDQAA0wMAIA4AANQDACC-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAH1AQEAAAAB9gECAAAAAfgBAAAAjgIChwIBAAAAAYgCEAAAAAGJAhAAAAABigIQAAAAAYsCEAAAAAGMAgEAAAABjgJAAAAAAY8CQAAAAAGQAgEAAAABkQIBAAAAAZICAQAAAAGTAkAAAAABlAIBAAAAAZUCEAAAAAGWAkAAAAABARgAAH8AIBi-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAH1AQEAAAAB9gECAAAAAfgBAAAAjgIChwIBAAAAAYgCEAAAAAGJAhAAAAABigIQAAAAAYsCEAAAAAGMAgEAAAABjgJAAAAAAY8CQAAAAAGQAgEAAAABkQIBAAAAAZICAQAAAAGTAkAAAAABlAIBAAAAAZUCEAAAAAGWAkAAAAABARgAAIEBADABGAAAgQEAMB0DAADBAwAgBQAAwgMAIAcAAMMDACANAADEAwAgDgAAxQMAIL4BAQCEAwAhvwEBAIQDACHJAUAAhwMAIeABQACOAwAh7AFAAIcDACHtAQEAhAMAIfUBAQCEAwAh9gECAJkDACH4AQAAwAOOAiKHAgEAhAMAIYgCEACWAwAhiQIQAJYDACGKAhAAlgMAIYsCEACWAwAhjAIBAIYDACGOAkAAjgMAIY8CQACOAwAhkAIBAIYDACGRAgEAhgMAIZICAQCGAwAhkwJAAI4DACGUAgEAhgMAIZUCEACXAwAhlgJAAI4DACECAAAABQAgGAAAhAEAIBi-AQEAhAMAIb8BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7QEBAIQDACH1AQEAhAMAIfYBAgCZAwAh-AEAAMADjgIihwIBAIQDACGIAhAAlgMAIYkCEACWAwAhigIQAJYDACGLAhAAlgMAIYwCAQCGAwAhjgJAAI4DACGPAkAAjgMAIZACAQCGAwAhkQIBAIYDACGSAgEAhgMAIZMCQACOAwAhlAIBAIYDACGVAhAAlwMAIZYCQACOAwAhAgAAAAMAIBgAAIYBACACAAAAAwAgGAAAhgEAIAMAAAAFACAfAAB_ACAgAACEAQAgAQAAAAUAIAEAAAADACAQCQAAuwMAICUAAL4DACAmAAC9AwAgNwAAvAMAIDgAAL8DACDgAQAAgAMAIIwCAACAAwAgjgIAAIADACCPAgAAgAMAIJACAACAAwAgkQIAAIADACCSAgAAgAMAIJMCAACAAwAglAIAAIADACCVAgAAgAMAIJYCAACAAwAgG7sBAADPAgAwvAEAAI0BABC9AQAAzwIAML4BAQCYAgAhvwEBAJgCACHJAUAAnAIAIeABQACqAgAh7AFAAJwCACHtAQEAmAIAIfUBAQCYAgAh9gECALMCACH4AQAA0AKOAiKHAgEAmAIAIYgCEACwAgAhiQIQALACACGKAhAAsAIAIYsCEACwAgAhjAIBAJsCACGOAkAAqgIAIY8CQACqAgAhkAIBAJsCACGRAgEAmwIAIZICAQCbAgAhkwJAAKoCACGUAgEAmwIAIZUCEACxAgAhlgJAAKoCACEDAAAAAwAgAQAAjAEAMCQAAI0BACADAAAAAwAgAQAABAAwAgAABQAgAQAAAC4AIAEAAAAuACADAAAAHAAgAQAALQAwAgAALgAgAwAAABwAIAEAAC0AMAIAAC4AIAMAAAAcACABAAAtADACAAAuACASAwAAugMAIAsAALkDACC-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe4BAQAAAAH4AQAAAIICAv0BEAAAAAH-AQEAAAAB_wEBAAAAAYACAQAAAAGCAgEAAAABgwKAAAAAAYQCEAAAAAGFAgEAAAABhgJAAAAAAQEYAACVAQAgEL4BAQAAAAG_AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB7gEBAAAAAfgBAAAAggIC_QEQAAAAAf4BAQAAAAH_AQEAAAABgAIBAAAAAYICAQAAAAGDAoAAAAABhAIQAAAAAYUCAQAAAAGGAkAAAAABARgAAJcBADABGAAAlwEAMBIDAAC4AwAgCwAAtwMAIL4BAQCEAwAhvwEBAIQDACHJAUAAhwMAIeABQACOAwAh7AFAAIcDACHuAQEAhAMAIfgBAAC2A4ICIv0BEACWAwAh_gEBAIQDACH_AQEAhAMAIYACAQCGAwAhggIBAIYDACGDAoAAAAABhAIQAJcDACGFAgEAhgMAIYYCQACOAwAhAgAAAC4AIBgAAJoBACAQvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe4BAQCEAwAh-AEAALYDggIi_QEQAJYDACH-AQEAhAMAIf8BAQCEAwAhgAIBAIYDACGCAgEAhgMAIYMCgAAAAAGEAhAAlwMAIYUCAQCGAwAhhgJAAI4DACECAAAAHAAgGAAAnAEAIAIAAAAcACAYAACcAQAgAwAAAC4AIB8AAJUBACAgAACaAQAgAQAAAC4AIAEAAAAcACAMCQAAsQMAICUAALQDACAmAACzAwAgNwAAsgMAIDgAALUDACDgAQAAgAMAIIACAACAAwAgggIAAIADACCDAgAAgAMAIIQCAACAAwAghQIAAIADACCGAgAAgAMAIBO7AQAAywIAMLwBAACjAQAQvQEAAMsCADC-AQEAmAIAIb8BAQCYAgAhyQFAAJwCACHgAUAAqgIAIewBQACcAgAh7gEBAJgCACH4AQAAzAKCAiL9ARAAsAIAIf4BAQCYAgAh_wEBAJgCACGAAgEAmwIAIYICAQCbAgAhgwIAAJoCACCEAhAAsQIAIYUCAQCbAgAhhgJAAKoCACEDAAAAHAAgAQAAogEAMCQAAKMBACADAAAAHAAgAQAALQAwAgAALgAgAQAAAA4AIAEAAAAOACADAAAADAAgAQAADQAwAgAADgAgAwAAAAwAIAEAAA0AMAIAAA4AIAMAAAAMACABAAANADACAAAOACAQAwAArwMAIAUAAK4DACAHAACwAwAgvgEBAAAAAb8BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB9QEBAAAAAfYBAgAAAAH4AQAAAPgBAvkBQAAAAAH6AUAAAAAB-wFAAAAAAfwBQAAAAAEBGAAAqwEAIA2-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAH1AQEAAAAB9gECAAAAAfgBAAAA-AEC-QFAAAAAAfoBQAAAAAH7AUAAAAAB_AFAAAAAAQEYAACtAQAwARgAAK0BADAQAwAArAMAIAUAAKsDACAHAACtAwAgvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe0BAQCEAwAh9QEBAIQDACH2AQIAmQMAIfgBAACqA_gBIvkBQACOAwAh-gFAAI4DACH7AUAAjgMAIfwBQACOAwAhAgAAAA4AIBgAALABACANvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe0BAQCEAwAh9QEBAIQDACH2AQIAmQMAIfgBAACqA_gBIvkBQACOAwAh-gFAAI4DACH7AUAAjgMAIfwBQACOAwAhAgAAAAwAIBgAALIBACACAAAADAAgGAAAsgEAIAMAAAAOACAfAACrAQAgIAAAsAEAIAEAAAAOACABAAAADAAgCgkAAKUDACAlAACoAwAgJgAApwMAIDcAAKYDACA4AACpAwAg4AEAAIADACD5AQAAgAMAIPoBAACAAwAg-wEAAIADACD8AQAAgAMAIBC7AQAAxwIAMLwBAAC5AQAQvQEAAMcCADC-AQEAmAIAIb8BAQCYAgAhyQFAAJwCACHgAUAAqgIAIewBQACcAgAh7QEBAJgCACH1AQEAmAIAIfYBAgCzAgAh-AEAAMgC-AEi-QFAAKoCACH6AUAAqgIAIfsBQACqAgAh_AFAAKoCACEDAAAADAAgAQAAuAEAMCQAALkBACADAAAADAAgAQAADQAwAgAADgAgAQAAABUAIAEAAAAVACADAAAAEwAgAQAAFAAwAgAAFQAgAwAAABMAIAEAABQAMAIAABUAIAMAAAATACABAAAUADACAAAVACAQAwAAogMAIAUAAKMDACALAACkAwAgvgEBAAAAAb8BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB7gEBAAAAAe8BAgAAAAHwAQEAAAAB8QEBAAAAAfIBQAAAAAHzASAAAAAB9AEBAAAAAQEYAADBAQAgDb4BAQAAAAG_AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB7QEBAAAAAe4BAQAAAAHvAQIAAAAB8AEBAAAAAfEBAQAAAAHyAUAAAAAB8wEgAAAAAfQBAQAAAAEBGAAAwwEAMAEYAADDAQAwEAMAAJ8DACAFAACgAwAgCwAAoQMAIL4BAQCEAwAhvwEBAIQDACHJAUAAhwMAIeABQACOAwAh7AFAAIcDACHtAQEAhAMAIe4BAQCEAwAh7wECAJkDACHwAQEAhgMAIfEBAQCGAwAh8gFAAI4DACHzASAAjQMAIfQBAQCGAwAhAgAAABUAIBgAAMYBACANvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe0BAQCEAwAh7gEBAIQDACHvAQIAmQMAIfABAQCGAwAh8QEBAIYDACHyAUAAjgMAIfMBIACNAwAh9AEBAIYDACECAAAAEwAgGAAAyAEAIAIAAAATACAYAADIAQAgAwAAABUAIB8AAMEBACAgAADGAQAgAQAAABUAIAEAAAATACAKCQAAmgMAICUAAJ0DACAmAACcAwAgNwAAmwMAIDgAAJ4DACDgAQAAgAMAIPABAACAAwAg8QEAAIADACDyAQAAgAMAIPQBAACAAwAgELsBAADGAgAwvAEAAM8BABC9AQAAxgIAML4BAQCYAgAhvwEBAJgCACHJAUAAnAIAIeABQACqAgAh7AFAAJwCACHtAQEAmAIAIe4BAQCYAgAh7wECALMCACHwAQEAmwIAIfEBAQCbAgAh8gFAAKoCACHzASAAqQIAIfQBAQCbAgAhAwAAABMAIAEAAM4BADAkAADPAQAgAwAAABMAIAEAABQAMAIAABUAIBO7AQAAvAIAMLwBAADVAQAQvQEAALwCADC-AQEAAAABxgEBAL4CACHJAUAAwwIAIeABQADFAgAh4QEBAAAAAeIBAQC9AgAh4wEQAL8CACHkARAAwAIAIeUBEADAAgAh5gECAMECACHnAQIAwgIAIegBAgDCAgAh6QFAAMMCACHqAUAAwwIAIesBIADEAgAh7AFAAMMCACEBAAAA0gEAIAEAAADSAQAgE7sBAAC8AgAwvAEAANUBABC9AQAAvAIAML4BAQC9AgAhxgEBAL4CACHJAUAAwwIAIeABQADFAgAh4QEBAL0CACHiAQEAvQIAIeMBEAC_AgAh5AEQAMACACHlARAAwAIAIeYBAgDBAgAh5wECAMICACHoAQIAwgIAIekBQADDAgAh6gFAAMMCACHrASAAxAIAIewBQADDAgAhBcYBAACAAwAg4AEAAIADACDkAQAAgAMAIOUBAACAAwAg5gEAAIADACADAAAA1QEAIAEAANYBADACAADSAQAgAwAAANUBACABAADWAQAwAgAA0gEAIAMAAADVAQAgAQAA1gEAMAIAANIBACAQvgEBAAAAAcYBAQAAAAHJAUAAAAAB4AFAAAAAAeEBAQAAAAHiAQEAAAAB4wEQAAAAAeQBEAAAAAHlARAAAAAB5gECAAAAAecBAgAAAAHoAQIAAAAB6QFAAAAAAeoBQAAAAAHrASAAAAAB7AFAAAAAAQEYAADaAQAgEL4BAQAAAAHGAQEAAAAByQFAAAAAAeABQAAAAAHhAQEAAAAB4gEBAAAAAeMBEAAAAAHkARAAAAAB5QEQAAAAAeYBAgAAAAHnAQIAAAAB6AECAAAAAekBQAAAAAHqAUAAAAAB6wEgAAAAAewBQAAAAAEBGAAA3AEAMAEYAADcAQAwEL4BAQCEAwAhxgEBAIYDACHJAUAAhwMAIeABQACOAwAh4QEBAIQDACHiAQEAhAMAIeMBEACWAwAh5AEQAJcDACHlARAAlwMAIeYBAgCYAwAh5wECAJkDACHoAQIAmQMAIekBQACHAwAh6gFAAIcDACHrASAAjQMAIewBQACHAwAhAgAAANIBACAYAADfAQAgEL4BAQCEAwAhxgEBAIYDACHJAUAAhwMAIeABQACOAwAh4QEBAIQDACHiAQEAhAMAIeMBEACWAwAh5AEQAJcDACHlARAAlwMAIeYBAgCYAwAh5wECAJkDACHoAQIAmQMAIekBQACHAwAh6gFAAIcDACHrASAAjQMAIewBQACHAwAhAgAAANUBACAYAADhAQAgAgAAANUBACAYAADhAQAgAwAAANIBACAfAADaAQAgIAAA3wEAIAEAAADSAQAgAQAAANUBACAKCQAAkQMAICUAAJQDACAmAACTAwAgNwAAkgMAIDgAAJUDACDGAQAAgAMAIOABAACAAwAg5AEAAIADACDlAQAAgAMAIOYBAACAAwAgE7sBAACvAgAwvAEAAOgBABC9AQAArwIAML4BAQCYAgAhxgEBAJsCACHJAUAAnAIAIeABQACqAgAh4QEBAJgCACHiAQEAmAIAIeMBEACwAgAh5AEQALECACHlARAAsQIAIeYBAgCyAgAh5wECALMCACHoAQIAswIAIekBQACcAgAh6gFAAJwCACHrASAAqQIAIewBQACcAgAhAwAAANUBACABAADnAQAwJAAA6AEAIAMAAADVAQAgAQAA1gEAMAIAANIBACABAAAAKwAgAQAAACsAIAMAAAApACABAAAqADACAAArACADAAAAKQAgAQAAKgAwAgAAKwAgAwAAACkAIAEAACoAMAIAACsAIAsDAACQAwAgGIAAAAABvgEBAAAAAb8BAQAAAAHJAUAAAAAB2wEBAAAAAdwBAQAAAAHdAQEAAAAB3gEgAAAAAd8BQAAAAAHgAUAAAAABARgAAPABACAKGIAAAAABvgEBAAAAAb8BAQAAAAHJAUAAAAAB2wEBAAAAAdwBAQAAAAHdAQEAAAAB3gEgAAAAAd8BQAAAAAHgAUAAAAABARgAAPIBADABGAAA8gEAMAsDAACPAwAgGIAAAAABvgEBAIQDACG_AQEAhAMAIckBQACHAwAh2wEBAIQDACHcAQEAhAMAId0BAQCEAwAh3gEgAI0DACHfAUAAjgMAIeABQACOAwAhAgAAACsAIBgAAPUBACAKGIAAAAABvgEBAIQDACG_AQEAhAMAIckBQACHAwAh2wEBAIQDACHcAQEAhAMAId0BAQCEAwAh3gEgAI0DACHfAUAAjgMAIeABQACOAwAhAgAAACkAIBgAAPcBACACAAAAKQAgGAAA9wEAIAMAAAArACAfAADwAQAgIAAA9QEAIAEAAAArACABAAAAKQAgBgkAAIoDACAYAACAAwAgJQAAjAMAICYAAIsDACDfAQAAgAMAIOABAACAAwAgDRgAAJoCACC7AQAAqAIAMLwBAAD-AQAQvQEAAKgCADC-AQEAmAIAIb8BAQCYAgAhyQFAAJwCACHbAQEAmAIAIdwBAQCYAgAh3QEBAJgCACHeASAAqQIAId8BQACqAgAh4AFAAKoCACEDAAAAKQAgAQAA_QEAMCQAAP4BACADAAAAKQAgAQAAKgAwAgAAKwAgAQAAACYAIAEAAAAmACADAAAAJAAgAQAAJQAwAgAAJgAgAwAAACQAIAEAACUAMAIAACYAIAMAAAAkACABAAAlADACAAAmACAMAwAAiQMAIL4BAQAAAAG_AQEAAAABwQEAAADBAQLCAQEAAAABwwEBAAAAAcQBgAAAAAHFAYAAAAABxgEBAAAAAccBAQAAAAHIAQEAAAAByQFAAAAAAQEYAACGAgAgC74BAQAAAAG_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_AQEAmAIAIckBQACcAgAh4AFAAKoCACHsAUAAnAIAIe0BAQCYAgAh7gEBAJgCACHvAQIAswIAIfABAQCbAgAh8QEBAJsCACHyAUAAqgIAIfMBIACpAgAh9AEBAJsCACEQuwEAAMcCADC8AQAAuQEAEL0BAADHAgAwvgEBAJgCACG_AQEAmAIAIckBQACcAgAh4AFAAKoCACHsAUAAnAIAIe0BAQCYAgAh9QEBAJgCACH2AQIAswIAIfgBAADIAvgBIvkBQACqAgAh-gFAAKoCACH7AUAAqgIAIfwBQACqAgAhBwkAAJ4CACAlAADKAgAgJgAAygIAIMoBAAAA-AECywEAAAD4AQjMAQAAAPgBCNEBAADJAvgBIgcJAACeAgAgJQAAygIAICYAAMoCACDKAQAAAPgBAssBAAAA-AEIzAEAAAD4AQjRAQAAyQL4ASIEygEAAAD4AQLLAQAAAPgBCMwBAAAA-AEI0QEAAMoC-AEiE7sBAADLAgAwvAEAAKMBABC9AQAAywIAML4BAQCYAgAhvwEBAJgCACHJAUAAnAIAIeABQACqAgAh7AFAAJwCACHuAQEAmAIAIfgBAADMAoICIv0BEACwAgAh_gEBAJgCACH_AQEAmAIAIYACAQCbAgAhggIBAJsCACGDAgAAmgIAIIQCEACxAgAhhQIBAJsCACGGAkAAqgIAIQcJAACeAgAgJQAAzgIAICYAAM4CACDKAQAAAIICAssBAAAAggIIzAEAAACCAgjRAQAAzQKCAiIHCQAAngIAICUAAM4CACAmAADOAgAgygEAAACCAgLLAQAAAIICCMwBAAAAggII0QEAAM0CggIiBMoBAAAAggICywEAAACCAgjMAQAAAIICCNEBAADOAoICIhu7AQAAzwIAMLwBAACNAQAQvQEAAM8CADC-AQEAmAIAIb8BAQCYAgAhyQFAAJwCACHgAUAAqgIAIewBQACcAgAh7QEBAJgCACH1AQEAmAIAIfYBAgCzAgAh-AEAANACjgIihwIBAJgCACGIAhAAsAIAIYkCEACwAgAhigIQALACACGLAhAAsAIAIYwCAQCbAgAhjgJAAKoCACGPAkAAqgIAIZACAQCbAgAhkQIBAJsCACGSAgEAmwIAIZMCQACqAgAhlAIBAJsCACGVAhAAsQIAIZYCQACqAgAhBwkAAJ4CACAlAADSAgAgJgAA0gIAIMoBAAAAjgICywEAAACOAgjMAQAAAI4CCNEBAADRAo4CIgcJAACeAgAgJQAA0gIAICYAANICACDKAQAAAI4CAssBAAAAjgIIzAEAAACOAgjRAQAA0QKOAiIEygEAAACOAgLLAQAAAI4CCMwBAAAAjgII0QEAANICjgIiFLsBAADTAgAwvAEAAHcAEL0BAADTAgAwvgEBAJgCACHGAQEAmwIAIckBQACcAgAh4AFAAKoCACHkAQIAswIAIewBQACcAgAh7QEBAJgCACH2AQIAswIAIfgBAADUAp0CIpcCAQCYAgAhmAIQALACACGZAgIAswIAIZoCAgCzAgAhmwICALMCACGdAkAAqgIAIZ4CQACqAgAhnwIAANUCACAHCQAAngIAICUAANcCACAmAADXAgAgygEAAACdAgLLAQAAAJ0CCMwBAAAAnQII0QEAANYCnQIiBMoBAQAAAAWgAgEAAAABoQIBAAAABKICAQAAAAQHCQAAngIAICUAANcCACAmAADXAgAgygEAAACdAgLLAQAAAJ0CCMwBAAAAnQII0QEAANYCnQIiBMoBAAAAnQICywEAAACdAgjMAQAAAJ0CCNEBAADXAp0CIiG7AQAA2AIAMLwBAABhABC9AQAA2AIAML4BAQCYAgAhxgEBAJgCACHJAUAAnAIAIdwBAQCYAgAh4AFAAKoCACHpAUAAnAIAIeoBQACcAgAh6wEgAKkCACHsAUAAnAIAIfgBAADZAq4CIpMCQACqAgAhowIBAJgCACGkAgEAmAIAIaUCAQCbAgAhpgIBAJgCACGnAgEAmAIAIagCAQCYAgAhqQIBAJgCACGqAiAAqQIAIasCAQCbAgAhrAIBAJgCACGuAgEAmAIAIa8CAgCzAgAhsAIgAKkCACGxAiAAqQIAIbICAQCbAgAhswIAANUCACC0AgIAsgIAIbUCAACaAgAgtgJAAKoCACEHCQAAngIAICUAANsCACAmAADbAgAgygEAAACuAgLLAQAAAK4CCMwBAAAArgII0QEAANoCrgIiBwkAAJ4CACAlAADbAgAgJgAA2wIAIMoBAAAArgICywEAAACuAgjMAQAAAK4CCNEBAADaAq4CIgTKAQAAAK4CAssBAAAArgIIzAEAAACuAgjRAQAA2wKuAiITuwEAANwCADC8AQAASwAQvQEAANwCADC-AQEAmAIAIckBQACcAgAh4AFAAKoCACHrASAAqQIAIewBQACcAgAhlwIBAJgCACG3AgEAmAIAIbgCAQCYAgAhugIAAN0CugIiuwIBAJsCACG8AgEAmwIAIb0CQACqAgAhvgIBAJsCACG_AgAAmgIAIMACIACpAgAhwQJAAKoCACEHCQAAngIAICUAAN8CACAmAADfAgAgygEAAAC6AgLLAQAAALoCCMwBAAAAugII0QEAAN4CugIiBwkAAJ4CACAlAADfAgAgJgAA3wIAIMoBAAAAugICywEAAAC6AgjMAQAAALoCCNEBAADeAroCIgTKAQAAALoCAssBAAAAugIIzAEAAAC6AgjRAQAA3wK6AiIaBgAA4wIAIAgAAOcCACAMAADlAgAgDwAA5AIAIBAAAOYCACARAADoAgAgEgAA6QIAILsBAADgAgAwvAEAADgAEL0BAADgAgAwvgEBAL0CACHJAUAAwwIAIeABQADFAgAh6wEgAMQCACHsAUAAwwIAIZcCAQC9AgAhtwIBAL0CACG4AgEAvQIAIboCAADhAroCIrsCAQC-AgAhvAIBAL4CACG9AkAAxQIAIb4CAQC-AgAhvwIAAOICACDAAiAAxAIAIcECQADFAgAhBMoBAAAAugICywEAAAC6AgjMAQAAALoCCNEBAADfAroCIgzKAYAAAAABzQGAAAAAAc4BgAAAAAHPAYAAAAAB0AGAAAAAAdEBgAAAAAHVAQEAAAAB1gEBAAAAAdcBAQAAAAHYAYAAAAAB2QGAAAAAAdoBgAAAAAEDwgIAAAMAIMMCAAADACDEAgAAAwAgA8ICAAAfACDDAgAAHwAgxAIAAB8AIAPCAgAAEwAgwwIAABMAIMQCAAATACADwgIAACQAIMMCAAAkACDEAgAAJAAgA8ICAAAMACDDAgAADAAgxAIAAAwAIAPCAgAAKQAgwwIAACkAIMQCAAApACADwgIAABwAIMMCAAAcACDEAgAAHAAgFQMAAO0CACALAADsAgAguwEAAOoCADC8AQAAHAAQvQEAAOoCADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7gEBAL0CACH4AQAA6wKCAiL9ARAAvwIAIf4BAQC9AgAh_wEBAL0CACGAAgEAvgIAIYICAQC-AgAhgwIAAOICACCEAhAAwAIAIYUCAQC-AgAhhgJAAMUCACEEygEAAACCAgLLAQAAAIICCMwBAAAAggII0QEAAM4CggIiIgMAAO0CACAFAAD1AgAgBwAA-QIAIA0AAP4CACAOAAD_AgAguwEAAPwCADC8AQAAAwAQvQEAAPwCADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACH1AQEAvQIAIfYBAgDCAgAh-AEAAP0CjgIihwIBAL0CACGIAhAAvwIAIYkCEAC_AgAhigIQAL8CACGLAhAAvwIAIYwCAQC-AgAhjgJAAMUCACGPAkAAxQIAIZACAQC-AgAhkQIBAL4CACGSAgEAvgIAIZMCQADFAgAhlAIBAL4CACGVAhAAwAIAIZYCQADFAgAhxgIAAAMAIMcCAAADACAcBgAA4wIAIAgAAOcCACAMAADlAgAgDwAA5AIAIBAAAOYCACARAADoAgAgEgAA6QIAILsBAADgAgAwvAEAADgAEL0BAADgAgAwvgEBAL0CACHJAUAAwwIAIeABQADFAgAh6wEgAMQCACHsAUAAwwIAIZcCAQC9AgAhtwIBAL0CACG4AgEAvQIAIboCAADhAroCIrsCAQC-AgAhvAIBAL4CACG9AkAAxQIAIb4CAQC-AgAhvwIAAOICACDAAiAAxAIAIcECQADFAgAhxgIAADgAIMcCAAA4ACAOAwAA7QIAIBgAAOICACC7AQAA7gIAMLwBAAApABC9AQAA7gIAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIdsBAQC9AgAh3AEBAL0CACHdAQEAvQIAId4BIADEAgAh3wFAAMUCACHgAUAAxQIAIQ8DAADtAgAguwEAAO8CADC8AQAAJAAQvQEAAO8CADC-AQEAvQIAIb8BAQC9AgAhwQEAAPACwQEiwgEBAL0CACHDAQEAvQIAIcQBAADiAgAgxQEAAOICACDGAQEAvgIAIccBAQC-AgAhyAEBAL4CACHJAUAAwwIAIQTKAQAAAMEBAssBAAAAwQEIzAEAAADBAQjRAQAApQLBASImBAAA7QIAIAYAAOMCACAIAADnAgAgCgAA8wIAIAwAAOUCACC7AQAA8QIAMLwBAAAfABC9AQAA8QIAML4BAQC9AgAhxgEBAL0CACHJAUAAwwIAIdwBAQC9AgAh4AFAAMUCACHpAUAAwwIAIeoBQADDAgAh6wEgAMQCACHsAUAAwwIAIfgBAADyAq4CIpMCQADFAgAhowIBAL0CACGkAgEAvQIAIaUCAQC-AgAhpgIBAL0CACGnAgEAvQIAIagCAQC9AgAhqQIBAL0CACGqAiAAxAIAIasCAQC-AgAhrAIBAL0CACGuAgEAvQIAIa8CAgDCAgAhsAIgAMQCACGxAiAAxAIAIbICAQC-AgAhswIAANUCACC0AgIAwQIAIbUCAADiAgAgtgJAAMUCACEEygEAAACuAgLLAQAAAK4CCMwBAAAArgII0QEAANsCrgIiA8ICAAAHACDDAgAABwAgxAIAAAcAIBMDAADtAgAgBQAA9QIAIAsAAOwCACC7AQAA9AIAMLwBAAATABC9AQAA9AIAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHtAQEAvQIAIe4BAQC9AgAh7wECAMICACHwAQEAvgIAIfEBAQC-AgAh8gFAAMUCACHzASAAxAIAIfQBAQC-AgAhKAQAAO0CACAGAADjAgAgCAAA5wIAIAoAAPMCACAMAADlAgAguwEAAPECADC8AQAAHwAQvQEAAPECADC-AQEAvQIAIcYBAQC9AgAhyQFAAMMCACHcAQEAvQIAIeABQADFAgAh6QFAAMMCACHqAUAAwwIAIesBIADEAgAh7AFAAMMCACH4AQAA8gKuAiKTAkAAxQIAIaMCAQC9AgAhpAIBAL0CACGlAgEAvgIAIaYCAQC9AgAhpwIBAL0CACGoAgEAvQIAIakCAQC9AgAhqgIgAMQCACGrAgEAvgIAIawCAQC9AgAhrgIBAL0CACGvAgIAwgIAIbACIADEAgAhsQIgAMQCACGyAgEAvgIAIbMCAADVAgAgtAICAMECACG1AgAA4gIAILYCQADFAgAhxgIAAB8AIMcCAAAfACADvwEBAAAAAe0BAQAAAAH1AQEAAAABEwMAAO0CACAFAAD1AgAgBwAA-QIAILsBAAD3AgAwvAEAAAwAEL0BAAD3AgAwvgEBAL0CACG_AQEAvQIAIckBQADDAgAh4AFAAMUCACHsAUAAwwIAIe0BAQC9AgAh9QEBAL0CACH2AQIAwgIAIfgBAAD4AvgBIvkBQADFAgAh-gFAAMUCACH7AUAAxQIAIfwBQADFAgAhBMoBAAAA-AECywEAAAD4AQjMAQAAAPgBCNEBAADKAvgBIhkFAAD1AgAgBgAA4wIAIAgAAOcCACC7AQAA-gIAMLwBAAAHABC9AQAA-gIAML4BAQC9AgAhxgEBAL4CACHJAUAAwwIAIeABQADFAgAh5AECAMICACHsAUAAwwIAIe0BAQC9AgAh9gECAMICACH4AQAA-wKdAiKXAgEAvQIAIZgCEAC_AgAhmQICAMICACGaAgIAwgIAIZsCAgDCAgAhnQJAAMUCACGeAkAAxQIAIZ8CAADVAgAgxgIAAAcAIMcCAAAHACAXBQAA9QIAIAYAAOMCACAIAADnAgAguwEAAPoCADC8AQAABwAQvQEAAPoCADC-AQEAvQIAIcYBAQC-AgAhyQFAAMMCACHgAUAAxQIAIeQBAgDCAgAh7AFAAMMCACHtAQEAvQIAIfYBAgDCAgAh-AEAAPsCnQIilwIBAL0CACGYAhAAvwIAIZkCAgDCAgAhmgICAMICACGbAgIAwgIAIZ0CQADFAgAhngJAAMUCACGfAgAA1QIAIATKAQAAAJ0CAssBAAAAnQIIzAEAAACdAgjRAQAA1wKdAiIgAwAA7QIAIAUAAPUCACAHAAD5AgAgDQAA_gIAIA4AAP8CACC7AQAA_AIAMLwBAAADABC9AQAA_AIAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHtAQEAvQIAIfUBAQC9AgAh9gECAMICACH4AQAA_QKOAiKHAgEAvQIAIYgCEAC_AgAhiQIQAL8CACGKAhAAvwIAIYsCEAC_AgAhjAIBAL4CACGOAkAAxQIAIY8CQADFAgAhkAIBAL4CACGRAgEAvgIAIZICAQC-AgAhkwJAAMUCACGUAgEAvgIAIZUCEADAAgAhlgJAAMUCACEEygEAAACOAgLLAQAAAI4CCMwBAAAAjgII0QEAANICjgIiFwMAAO0CACALAADsAgAguwEAAOoCADC8AQAAHAAQvQEAAOoCADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7gEBAL0CACH4AQAA6wKCAiL9ARAAvwIAIf4BAQC9AgAh_wEBAL0CACGAAgEAvgIAIYICAQC-AgAhgwIAAOICACCEAhAAwAIAIYUCAQC-AgAhhgJAAMUCACHGAgAAHAAgxwIAABwAIBUDAADtAgAgBQAA9QIAIAsAAOwCACC7AQAA9AIAMLwBAAATABC9AQAA9AIAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHtAQEAvQIAIe4BAQC9AgAh7wECAMICACHwAQEAvgIAIfEBAQC-AgAh8gFAAMUCACHzASAAxAIAIfQBAQC-AgAhxgIAABMAIMcCAAATACAAAAAAAc4CAQAAAAEBzgIAAADBAQIBzgIBAAAAAQHOAkAAAAABBR8AAPUFACAgAAD4BQAgyAIAAPYFACDJAgAA9wUAIMwCAAABACADHwAA9QUAIMgCAAD2BQAgzAIAAAEAIAAAAAHOAiAAAAABAc4CQAAAAAEFHwAA8AUAICAAAPMFACDIAgAA8QUAIMkCAADyBQAgzAIAAAEAIAMfAADwBQAgyAIAAPEFACDMAgAAAQAgAAAAAAAFzgIQAAAAAdICEAAAAAHTAhAAAAAB1AIQAAAAAdUCEAAAAAEFzgIQAAAAAdICEAAAAAHTAhAAAAAB1AIQAAAAAdUCEAAAAAEFzgICAAAAAdICAgAAAAHTAgIAAAAB1AICAAAAAdUCAgAAAAEFzgICAAAAAdICAgAAAAHTAgIAAAAB1AICAAAAAdUCAgAAAAEAAAAAAAUfAADlBQAgIAAA7gUAIMgCAADmBQAgyQIAAO0FACDMAgAAAQAgBR8AAOMFACAgAADrBQAgyAIAAOQFACDJAgAA6gUAIMwCAAAhACAFHwAA4QUAICAAAOgFACDIAgAA4gUAIMkCAADnBQAgzAIAAAUAIAMfAADlBQAgyAIAAOYFACDMAgAAAQAgAx8AAOMFACDIAgAA5AUAIMwCAAAhACADHwAA4QUAIMgCAADiBQAgzAIAAAUAIAAAAAAAAc4CAAAA-AECBR8AANYFACAgAADfBQAgyAIAANcFACDJAgAA3gUAIMwCAAAhACAFHwAA1AUAICAAANwFACDIAgAA1QUAIMkCAADbBQAgzAIAAAEAIAUfAADSBQAgIAAA2QUAIMgCAADTBQAgyQIAANgFACDMAgAACQAgAx8AANYFACDIAgAA1wUAIMwCAAAhACADHwAA1AUAIMgCAADVBQAgzAIAAAEAIAMfAADSBQAgyAIAANMFACDMAgAACQAgAAAAAAABzgIAAACCAgIFHwAAygUAICAAANAFACDIAgAAywUAIMkCAADPBQAgzAIAAAUAIAUfAADIBQAgIAAAzQUAIMgCAADJBQAgyQIAAMwFACDMAgAAAQAgAx8AAMoFACDIAgAAywUAIMwCAAAFACADHwAAyAUAIMgCAADJBQAgzAIAAAEAIAAAAAAAAc4CAAAAjgICBR8AAL0FACAgAADGBQAgyAIAAL4FACDJAgAAxQUAIMwCAAABACAFHwAAuwUAICAAAMMFACDIAgAAvAUAIMkCAADCBQAgzAIAACEAIAUfAAC5BQAgIAAAwAUAIMgCAAC6BQAgyQIAAL8FACDMAgAACQAgBx8AAMsDACAgAADOAwAgyAIAAMwDACDJAgAAzQMAIMoCAAAcACDLAgAAHAAgzAIAAC4AIAcfAADGAwAgIAAAyQMAIMgCAADHAwAgyQIAAMgDACDKAgAAEwAgywIAABMAIMwCAAAVACAOAwAAogMAIAUAAKMDACC-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAHvAQIAAAAB8AEBAAAAAfEBAQAAAAHyAUAAAAAB8wEgAAAAAfQBAQAAAAECAAAAFQAgHwAAxgMAIAMAAAATACAfAADGAwAgIAAAygMAIBAAAAATACADAACfAwAgBQAAoAMAIBgAAMoDACC-AQEAhAMAIb8BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7QEBAIQDACHvAQIAmQMAIfABAQCGAwAh8QEBAIYDACHyAUAAjgMAIfMBIACNAwAh9AEBAIYDACEOAwAAnwMAIAUAAKADACC-AQEAhAMAIb8BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7QEBAIQDACHvAQIAmQMAIfABAQCGAwAh8QEBAIYDACHyAUAAjgMAIfMBIACNAwAh9AEBAIYDACEQAwAAugMAIL4BAQAAAAG_AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB-AEAAACCAgL9ARAAAAAB_gEBAAAAAf8BAQAAAAGAAgEAAAABggIBAAAAAYMCgAAAAAGEAhAAAAABhQIBAAAAAYYCQAAAAAECAAAALgAgHwAAywMAIAMAAAAcACAfAADLAwAgIAAAzwMAIBIAAAAcACADAAC4AwAgGAAAzwMAIL4BAQCEAwAhvwEBAIQDACHJAUAAhwMAIeABQACOAwAh7AFAAIcDACH4AQAAtgOCAiL9ARAAlgMAIf4BAQCEAwAh_wEBAIQDACGAAgEAhgMAIYICAQCGAwAhgwKAAAAAAYQCEACXAwAhhQIBAIYDACGGAkAAjgMAIRADAAC4AwAgvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIfgBAAC2A4ICIv0BEACWAwAh_gEBAIQDACH_AQEAhAMAIYACAQCGAwAhggIBAIYDACGDAoAAAAABhAIQAJcDACGFAgEAhgMAIYYCQACOAwAhAx8AAL0FACDIAgAAvgUAIMwCAAABACADHwAAuwUAIMgCAAC8BQAgzAIAACEAIAMfAAC5BQAgyAIAALoFACDMAgAACQAgAx8AAMsDACDIAgAAzAMAIMwCAAAuACADHwAAxgMAIMgCAADHAwAgzAIAABUAIAAAAAAAAc4CAAAAnQICAs4CAQAAAATRAgEAAAAFBR8AALIFACAgAAC3BQAgyAIAALMFACDJAgAAtgUAIMwCAAAhACALHwAA6wMAMCAAAPADADDIAgAA7AMAMMkCAADtAwAwygIAAO8DADDLAgAA7wMAMMwCAADvAwAwzQIAAO4DACDOAgAA7wMAMM8CAADxAwAw0AIAAPIDADALHwAA3wMAMCAAAOQDADDIAgAA4AMAMMkCAADhAwAwygIAAOMDADDLAgAA4wMAMMwCAADjAwAwzQIAAOIDACDOAgAA4wMAMM8CAADlAwAw0AIAAOYDADAOAwAArwMAIAUAAK4DACC-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAH2AQIAAAAB-AEAAAD4AQL5AUAAAAAB-gFAAAAAAfsBQAAAAAH8AUAAAAABAgAAAA4AIB8AAOoDACADAAAADgAgHwAA6gMAICAAAOkDACABGAAAtQUAMBQDAADtAgAgBQAA9QIAIAcAAPkCACC7AQAA9wIAMLwBAAAMABC9AQAA9wIAML4BAQAAAAG_AQEAvQIAIckBQADDAgAh4AFAAMUCACHsAUAAwwIAIe0BAQC9AgAh9QEBAL0CACH2AQIAwgIAIfgBAAD4AvgBIvkBQADFAgAh-gFAAMUCACH7AUAAxQIAIfwBQADFAgAhxQIAAPYCACACAAAADgAgGAAA6QMAIAIAAADnAwAgGAAA6AMAIBC7AQAA5gMAMLwBAADnAwAQvQEAAOYDADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACH1AQEAvQIAIfYBAgDCAgAh-AEAAPgC-AEi-QFAAMUCACH6AUAAxQIAIfsBQADFAgAh_AFAAMUCACEQuwEAAOYDADC8AQAA5wMAEL0BAADmAwAwvgEBAL0CACG_AQEAvQIAIckBQADDAgAh4AFAAMUCACHsAUAAwwIAIe0BAQC9AgAh9QEBAL0CACH2AQIAwgIAIfgBAAD4AvgBIvkBQADFAgAh-gFAAMUCACH7AUAAxQIAIfwBQADFAgAhDL4BAQCEAwAhvwEBAIQDACHJAUAAhwMAIeABQACOAwAh7AFAAIcDACHtAQEAhAMAIfYBAgCZAwAh-AEAAKoD-AEi-QFAAI4DACH6AUAAjgMAIfsBQACOAwAh_AFAAI4DACEOAwAArAMAIAUAAKsDACC-AQEAhAMAIb8BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7QEBAIQDACH2AQIAmQMAIfgBAACqA_gBIvkBQACOAwAh-gFAAI4DACH7AUAAjgMAIfwBQACOAwAhDgMAAK8DACAFAACuAwAgvgEBAAAAAb8BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB9gECAAAAAfgBAAAA-AEC-QFAAAAAAfoBQAAAAAH7AUAAAAAB_AFAAAAAARsDAADQAwAgBQAA0QMAIA0AANMDACAOAADUAwAgvgEBAAAAAb8BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB9gECAAAAAfgBAAAAjgIChwIBAAAAAYgCEAAAAAGJAhAAAAABigIQAAAAAYsCEAAAAAGMAgEAAAABjgJAAAAAAY8CQAAAAAGQAgEAAAABkQIBAAAAAZICAQAAAAGTAkAAAAABlAIBAAAAAZUCEAAAAAGWAkAAAAABAgAAAAUAIB8AAPYDACADAAAABQAgHwAA9gMAICAAAPUDACABGAAAtAUAMCADAADtAgAgBQAA9QIAIAcAAPkCACANAAD-AgAgDgAA_wIAILsBAAD8AgAwvAEAAAMAEL0BAAD8AgAwvgEBAAAAAb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACH1AQEAvQIAIfYBAgDCAgAh-AEAAP0CjgIihwIBAAAAAYgCEAC_AgAhiQIQAL8CACGKAhAAvwIAIYsCEAC_AgAhjAIBAL4CACGOAkAAxQIAIY8CQADFAgAhkAIBAL4CACGRAgEAvgIAIZICAQC-AgAhkwJAAMUCACGUAgEAvgIAIZUCEADAAgAhlgJAAMUCACECAAAABQAgGAAA9QMAIAIAAADzAwAgGAAA9AMAIBu7AQAA8gMAMLwBAADzAwAQvQEAAPIDADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACH1AQEAvQIAIfYBAgDCAgAh-AEAAP0CjgIihwIBAL0CACGIAhAAvwIAIYkCEAC_AgAhigIQAL8CACGLAhAAvwIAIYwCAQC-AgAhjgJAAMUCACGPAkAAxQIAIZACAQC-AgAhkQIBAL4CACGSAgEAvgIAIZMCQADFAgAhlAIBAL4CACGVAhAAwAIAIZYCQADFAgAhG7sBAADyAwAwvAEAAPMDABC9AQAA8gMAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHtAQEAvQIAIfUBAQC9AgAh9gECAMICACH4AQAA_QKOAiKHAgEAvQIAIYgCEAC_AgAhiQIQAL8CACGKAhAAvwIAIYsCEAC_AgAhjAIBAL4CACGOAkAAxQIAIY8CQADFAgAhkAIBAL4CACGRAgEAvgIAIZICAQC-AgAhkwJAAMUCACGUAgEAvgIAIZUCEADAAgAhlgJAAMUCACEXvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe0BAQCEAwAh9gECAJkDACH4AQAAwAOOAiKHAgEAhAMAIYgCEACWAwAhiQIQAJYDACGKAhAAlgMAIYsCEACWAwAhjAIBAIYDACGOAkAAjgMAIY8CQACOAwAhkAIBAIYDACGRAgEAhgMAIZICAQCGAwAhkwJAAI4DACGUAgEAhgMAIZUCEACXAwAhlgJAAI4DACEbAwAAwQMAIAUAAMIDACANAADEAwAgDgAAxQMAIL4BAQCEAwAhvwEBAIQDACHJAUAAhwMAIeABQACOAwAh7AFAAIcDACHtAQEAhAMAIfYBAgCZAwAh-AEAAMADjgIihwIBAIQDACGIAhAAlgMAIYkCEACWAwAhigIQAJYDACGLAhAAlgMAIYwCAQCGAwAhjgJAAI4DACGPAkAAjgMAIZACAQCGAwAhkQIBAIYDACGSAgEAhgMAIZMCQACOAwAhlAIBAIYDACGVAhAAlwMAIZYCQACOAwAhGwMAANADACAFAADRAwAgDQAA0wMAIA4AANQDACC-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAH2AQIAAAAB-AEAAACOAgKHAgEAAAABiAIQAAAAAYkCEAAAAAGKAhAAAAABiwIQAAAAAYwCAQAAAAGOAkAAAAABjwJAAAAAAZACAQAAAAGRAgEAAAABkgIBAAAAAZMCQAAAAAGUAgEAAAABlQIQAAAAAZYCQAAAAAEBzgIBAAAABAMfAACyBQAgyAIAALMFACDMAgAAIQAgBB8AAOsDADDIAgAA7AMAMMwCAADvAwAwzQIAAO4DACAEHwAA3wMAMMgCAADgAwAwzAIAAOMDADDNAgAA4gMAIAAAAAAAAc4CAAAArgICAs4CAQAAAATRAgEAAAAFBR8AAKkFACAgAACwBQAgyAIAAKoFACDJAgAArwUAIMwCAAABACALHwAApQQAMCAAAKoEADDIAgAApgQAMMkCAACnBAAwygIAAKkEADDLAgAAqQQAMMwCAACpBAAwzQIAAKgEACDOAgAAqQQAMM8CAACrBAAw0AIAAKwEADALHwAAnAQAMCAAAKAEADDIAgAAnQQAMMkCAACeBAAwygIAAO8DADDLAgAA7wMAMMwCAADvAwAwzQIAAJ8EACDOAgAA7wMAMM8CAAChBAAw0AIAAPIDADALHwAAkAQAMCAAAJUEADDIAgAAkQQAMMkCAACSBAAwygIAAJQEADDLAgAAlAQAMMwCAACUBAAwzQIAAJMEACDOAgAAlAQAMM8CAACWBAAw0AIAAJcEADALHwAAhwQAMCAAAIsEADDIAgAAiAQAMMkCAACJBAAwygIAAOMDADDLAgAA4wMAMMwCAADjAwAwzQIAAIoEACDOAgAA4wMAMM8CAACMBAAw0AIAAOYDADAOAwAArwMAIAcAALADACC-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAfUBAQAAAAH2AQIAAAAB-AEAAAD4AQL5AUAAAAAB-gFAAAAAAfsBQAAAAAH8AUAAAAABAgAAAA4AIB8AAI8EACADAAAADgAgHwAAjwQAICAAAI4EACABGAAArgUAMAIAAAAOACAYAACOBAAgAgAAAOcDACAYAACNBAAgDL4BAQCEAwAhvwEBAIQDACHJAUAAhwMAIeABQACOAwAh7AFAAIcDACH1AQEAhAMAIfYBAgCZAwAh-AEAAKoD-AEi-QFAAI4DACH6AUAAjgMAIfsBQACOAwAh_AFAAI4DACEOAwAArAMAIAcAAK0DACC-AQEAhAMAIb8BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh9QEBAIQDACH2AQIAmQMAIfgBAACqA_gBIvkBQACOAwAh-gFAAI4DACH7AUAAjgMAIfwBQACOAwAhDgMAAK8DACAHAACwAwAgvgEBAAAAAb8BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAH1AQEAAAAB9gECAAAAAfgBAAAA-AEC-QFAAAAAAfoBQAAAAAH7AUAAAAAB_AFAAAAAAQ4DAACiAwAgCwAApAMAIL4BAQAAAAG_AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB7gEBAAAAAe8BAgAAAAHwAQEAAAAB8QEBAAAAAfIBQAAAAAHzASAAAAAB9AEBAAAAAQIAAAAVACAfAACbBAAgAwAAABUAIB8AAJsEACAgAACaBAAgARgAAK0FADATAwAA7QIAIAUAAPUCACALAADsAgAguwEAAPQCADC8AQAAEwAQvQEAAPQCADC-AQEAAAABvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHtAQEAvQIAIe4BAQAAAAHvAQIAwgIAIfABAQC-AgAh8QEBAL4CACHyAUAAxQIAIfMBIADEAgAh9AEBAL4CACECAAAAFQAgGAAAmgQAIAIAAACYBAAgGAAAmQQAIBC7AQAAlwQAMLwBAACYBAAQvQEAAJcEADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACHuAQEAvQIAIe8BAgDCAgAh8AEBAL4CACHxAQEAvgIAIfIBQADFAgAh8wEgAMQCACH0AQEAvgIAIRC7AQAAlwQAMLwBAACYBAAQvQEAAJcEADC-AQEAvQIAIb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7QEBAL0CACHuAQEAvQIAIe8BAgDCAgAh8AEBAL4CACHxAQEAvgIAIfIBQADFAgAh8wEgAMQCACH0AQEAvgIAIQy-AQEAhAMAIb8BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7gEBAIQDACHvAQIAmQMAIfABAQCGAwAh8QEBAIYDACHyAUAAjgMAIfMBIACNAwAh9AEBAIYDACEOAwAAnwMAIAsAAKEDACC-AQEAhAMAIb8BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7gEBAIQDACHvAQIAmQMAIfABAQCGAwAh8QEBAIYDACHyAUAAjgMAIfMBIACNAwAh9AEBAIYDACEOAwAAogMAIAsAAKQDACC-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe4BAQAAAAHvAQIAAAAB8AEBAAAAAfEBAQAAAAHyAUAAAAAB8wEgAAAAAfQBAQAAAAEbAwAA0AMAIAcAANIDACANAADTAwAgDgAA1AMAIL4BAQAAAAG_AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB9QEBAAAAAfYBAgAAAAH4AQAAAI4CAocCAQAAAAGIAhAAAAABiQIQAAAAAYoCEAAAAAGLAhAAAAABjAIBAAAAAY4CQAAAAAGPAkAAAAABkAIBAAAAAZECAQAAAAGSAgEAAAABkwJAAAAAAZQCAQAAAAGVAhAAAAABlgJAAAAAAQIAAAAFACAfAACkBAAgAwAAAAUAIB8AAKQEACAgAACjBAAgARgAAKwFADACAAAABQAgGAAAowQAIAIAAADzAwAgGAAAogQAIBe-AQEAhAMAIb8BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh9QEBAIQDACH2AQIAmQMAIfgBAADAA44CIocCAQCEAwAhiAIQAJYDACGJAhAAlgMAIYoCEACWAwAhiwIQAJYDACGMAgEAhgMAIY4CQACOAwAhjwJAAI4DACGQAgEAhgMAIZECAQCGAwAhkgIBAIYDACGTAkAAjgMAIZQCAQCGAwAhlQIQAJcDACGWAkAAjgMAIRsDAADBAwAgBwAAwwMAIA0AAMQDACAOAADFAwAgvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIfUBAQCEAwAh9gECAJkDACH4AQAAwAOOAiKHAgEAhAMAIYgCEACWAwAhiQIQAJYDACGKAhAAlgMAIYsCEACWAwAhjAIBAIYDACGOAkAAjgMAIY8CQACOAwAhkAIBAIYDACGRAgEAhgMAIZICAQCGAwAhkwJAAI4DACGUAgEAhgMAIZUCEACXAwAhlgJAAI4DACEbAwAA0AMAIAcAANIDACANAADTAwAgDgAA1AMAIL4BAQAAAAG_AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB9QEBAAAAAfYBAgAAAAH4AQAAAI4CAocCAQAAAAGIAhAAAAABiQIQAAAAAYoCEAAAAAGLAhAAAAABjAIBAAAAAY4CQAAAAAGPAkAAAAABkAIBAAAAAZECAQAAAAGSAgEAAAABkwJAAAAAAZQCAQAAAAGVAhAAAAABlgJAAAAAARIGAAD5AwAgCAAA-gMAIL4BAQAAAAHGAQEAAAAByQFAAAAAAeABQAAAAAHkAQIAAAAB7AFAAAAAAfYBAgAAAAH4AQAAAJ0CApcCAQAAAAGYAhAAAAABmQICAAAAAZoCAgAAAAGbAgIAAAABnQJAAAAAAZ4CQAAAAAGfAgAA9wMAIAIAAAAJACAfAACwBAAgAwAAAAkAIB8AALAEACAgAACvBAAgARgAAKsFADAXBQAA9QIAIAYAAOMCACAIAADnAgAguwEAAPoCADC8AQAABwAQvQEAAPoCADC-AQEAAAABxgEBAL4CACHJAUAAwwIAIeABQADFAgAh5AECAMICACHsAUAAwwIAIe0BAQC9AgAh9gECAMICACH4AQAA-wKdAiKXAgEAvQIAIZgCEAC_AgAhmQICAMICACGaAgIAwgIAIZsCAgDCAgAhnQJAAMUCACGeAkAAxQIAIZ8CAADVAgAgAgAAAAkAIBgAAK8EACACAAAArQQAIBgAAK4EACAUuwEAAKwEADC8AQAArQQAEL0BAACsBAAwvgEBAL0CACHGAQEAvgIAIckBQADDAgAh4AFAAMUCACHkAQIAwgIAIewBQADDAgAh7QEBAL0CACH2AQIAwgIAIfgBAAD7Ap0CIpcCAQC9AgAhmAIQAL8CACGZAgIAwgIAIZoCAgDCAgAhmwICAMICACGdAkAAxQIAIZ4CQADFAgAhnwIAANUCACAUuwEAAKwEADC8AQAArQQAEL0BAACsBAAwvgEBAL0CACHGAQEAvgIAIckBQADDAgAh4AFAAMUCACHkAQIAwgIAIewBQADDAgAh7QEBAL0CACH2AQIAwgIAIfgBAAD7Ap0CIpcCAQC9AgAhmAIQAL8CACGZAgIAwgIAIZoCAgDCAgAhmwICAMICACGdAkAAxQIAIZ4CQADFAgAhnwIAANUCACAQvgEBAIQDACHGAQEAhgMAIckBQACHAwAh4AFAAI4DACHkAQIAmQMAIewBQACHAwAh9gECAJkDACH4AQAA2gOdAiKXAgEAhAMAIZgCEACWAwAhmQICAJkDACGaAgIAmQMAIZsCAgCZAwAhnQJAAI4DACGeAkAAjgMAIZ8CAADbAwAgEgYAAN0DACAIAADeAwAgvgEBAIQDACHGAQEAhgMAIckBQACHAwAh4AFAAI4DACHkAQIAmQMAIewBQACHAwAh9gECAJkDACH4AQAA2gOdAiKXAgEAhAMAIZgCEACWAwAhmQICAJkDACGaAgIAmQMAIZsCAgCZAwAhnQJAAI4DACGeAkAAjgMAIZ8CAADbAwAgEgYAAPkDACAIAAD6AwAgvgEBAAAAAcYBAQAAAAHJAUAAAAAB4AFAAAAAAeQBAgAAAAHsAUAAAAAB9gECAAAAAfgBAAAAnQIClwIBAAAAAZgCEAAAAAGZAgIAAAABmgICAAAAAZsCAgAAAAGdAkAAAAABngJAAAAAAZ8CAAD3AwAgAc4CAQAAAAQDHwAAqQUAIMgCAACqBQAgzAIAAAEAIAQfAAClBAAwyAIAAKYEADDMAgAAqQQAMM0CAACoBAAgBB8AAJwEADDIAgAAnQQAMMwCAADvAwAwzQIAAJ8EACAEHwAAkAQAMMgCAACRBAAwzAIAAJQEADDNAgAAkwQAIAQfAACHBAAwyAIAAIgEADDMAgAA4wMAMM0CAACKBAAgAAAAAc4CAAAAugICCx8AAIQFADAgAACIBQAwyAIAAIUFADDJAgAAhgUAMMoCAADvAwAwywIAAO8DADDMAgAA7wMAMM0CAACHBQAgzgIAAO8DADDPAgAAiQUAMNACAADyAwAwCx8AAPgEADAgAAD9BAAwyAIAAPkEADDJAgAA-gQAMMoCAAD8BAAwywIAAPwEADDMAgAA_AQAMM0CAAD7BAAgzgIAAPwEADDPAgAA_gQAMNACAAD_BAAwCx8AAO8EADAgAADzBAAwyAIAAPAEADDJAgAA8QQAMMoCAACUBAAwywIAAJQEADDMAgAAlAQAMM0CAADyBAAgzgIAAJQEADDPAgAA9AQAMNACAACXBAAwCx8AAOMEADAgAADoBAAwyAIAAOQEADDJAgAA5QQAMMoCAADnBAAwywIAAOcEADDMAgAA5wQAMM0CAADmBAAgzgIAAOcEADDPAgAA6QQAMNACAADqBAAwCx8AANoEADAgAADeBAAwyAIAANsEADDJAgAA3AQAMMoCAADjAwAwywIAAOMDADDMAgAA4wMAMM0CAADdBAAgzgIAAOMDADDPAgAA3wQAMNACAADmAwAwCx8AAM4EADAgAADTBAAwyAIAAM8EADDJAgAA0AQAMMoCAADSBAAwywIAANIEADDMAgAA0gQAMM0CAADRBAAgzgIAANIEADDPAgAA1AQAMNACAADVBAAwCx8AAMIEADAgAADHBAAwyAIAAMMEADDJAgAAxAQAMMoCAADGBAAwywIAAMYEADDMAgAAxgQAMM0CAADFBAAgzgIAAMYEADDPAgAAyAQAMNACAADJBAAwEAsAALkDACC-AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB7gEBAAAAAfgBAAAAggIC_QEQAAAAAf4BAQAAAAH_AQEAAAABgAIBAAAAAYICAQAAAAGDAoAAAAABhAIQAAAAAYUCAQAAAAGGAkAAAAABAgAAAC4AIB8AAM0EACADAAAALgAgHwAAzQQAICAAAMwEACABGAAAqAUAMBUDAADtAgAgCwAA7AIAILsBAADqAgAwvAEAABwAEL0BAADqAgAwvgEBAAAAAb8BAQC9AgAhyQFAAMMCACHgAUAAxQIAIewBQADDAgAh7gEBAAAAAfgBAADrAoICIv0BEAC_AgAh_gEBAL0CACH_AQEAvQIAIYACAQAAAAGCAgEAvgIAIYMCAADiAgAghAIQAMACACGFAgEAvgIAIYYCQADFAgAhAgAAAC4AIBgAAMwEACACAAAAygQAIBgAAMsEACATuwEAAMkEADC8AQAAygQAEL0BAADJBAAwvgEBAL0CACG_AQEAvQIAIckBQADDAgAh4AFAAMUCACHsAUAAwwIAIe4BAQC9AgAh-AEAAOsCggIi_QEQAL8CACH-AQEAvQIAIf8BAQC9AgAhgAIBAL4CACGCAgEAvgIAIYMCAADiAgAghAIQAMACACGFAgEAvgIAIYYCQADFAgAhE7sBAADJBAAwvAEAAMoEABC9AQAAyQQAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIeABQADFAgAh7AFAAMMCACHuAQEAvQIAIfgBAADrAoICIv0BEAC_AgAh_gEBAL0CACH_AQEAvQIAIYACAQC-AgAhggIBAL4CACGDAgAA4gIAIIQCEADAAgAhhQIBAL4CACGGAkAAxQIAIQ--AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe4BAQCEAwAh-AEAALYDggIi_QEQAJYDACH-AQEAhAMAIf8BAQCEAwAhgAIBAIYDACGCAgEAhgMAIYMCgAAAAAGEAhAAlwMAIYUCAQCGAwAhhgJAAI4DACEQCwAAtwMAIL4BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7gEBAIQDACH4AQAAtgOCAiL9ARAAlgMAIf4BAQCEAwAh_wEBAIQDACGAAgEAhgMAIYICAQCGAwAhgwKAAAAAAYQCEACXAwAhhQIBAIYDACGGAkAAjgMAIRALAAC5AwAgvgEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe4BAQAAAAH4AQAAAIICAv0BEAAAAAH-AQEAAAAB_wEBAAAAAYACAQAAAAGCAgEAAAABgwKAAAAAAYQCEAAAAAGFAgEAAAABhgJAAAAAAQkYgAAAAAG-AQEAAAAByQFAAAAAAdsBAQAAAAHcAQEAAAAB3QEBAAAAAd4BIAAAAAHfAUAAAAAB4AFAAAAAAQIAAAArACAfAADZBAAgAwAAACsAIB8AANkEACAgAADYBAAgARgAAKcFADAOAwAA7QIAIBgAAOICACC7AQAA7gIAMLwBAAApABC9AQAA7gIAML4BAQAAAAG_AQEAvQIAIckBQADDAgAh2wEBAL0CACHcAQEAvQIAId0BAQC9AgAh3gEgAMQCACHfAUAAxQIAIeABQADFAgAhAgAAACsAIBgAANgEACACAAAA1gQAIBgAANcEACANGAAA4gIAILsBAADVBAAwvAEAANYEABC9AQAA1QQAML4BAQC9AgAhvwEBAL0CACHJAUAAwwIAIdsBAQC9AgAh3AEBAL0CACHdAQEAvQIAId4BIADEAgAh3wFAAMUCACHgAUAAxQIAIQ0YAADiAgAguwEAANUEADC8AQAA1gQAEL0BAADVBAAwvgEBAL0CACG_AQEAvQIAIckBQADDAgAh2wEBAL0CACHcAQEAvQIAId0BAQC9AgAh3gEgAMQCACHfAUAAxQIAIeABQADFAgAhCRiAAAAAAb4BAQCEAwAhyQFAAIcDACHbAQEAhAMAIdwBAQCEAwAh3QEBAIQDACHeASAAjQMAId8BQACOAwAh4AFAAI4DACEJGIAAAAABvgEBAIQDACHJAUAAhwMAIdsBAQCEAwAh3AEBAIQDACHdAQEAhAMAId4BIACNAwAh3wFAAI4DACHgAUAAjgMAIQkYgAAAAAG-AQEAAAAByQFAAAAAAdsBAQAAAAHcAQEAAAAB3QEBAAAAAd4BIAAAAAHfAUAAAAAB4AFAAAAAAQ4FAACuAwAgBwAAsAMAIL4BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB9QEBAAAAAfYBAgAAAAH4AQAAAPgBAvkBQAAAAAH6AUAAAAAB-wFAAAAAAfwBQAAAAAECAAAADgAgHwAA4gQAIAMAAAAOACAfAADiBAAgIAAA4QQAIAEYAACmBQAwAgAAAA4AIBgAAOEEACACAAAA5wMAIBgAAOAEACAMvgEBAIQDACHJAUAAhwMAIeABQACOAwAh7AFAAIcDACHtAQEAhAMAIfUBAQCEAwAh9gECAJkDACH4AQAAqgP4ASL5AUAAjgMAIfoBQACOAwAh-wFAAI4DACH8AUAAjgMAIQ4FAACrAwAgBwAArQMAIL4BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7QEBAIQDACH1AQEAhAMAIfYBAgCZAwAh-AEAAKoD-AEi-QFAAI4DACH6AUAAjgMAIfsBQACOAwAh_AFAAI4DACEOBQAArgMAIAcAALADACC-AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB7QEBAAAAAfUBAQAAAAH2AQIAAAAB-AEAAAD4AQL5AUAAAAAB-gFAAAAAAfsBQAAAAAH8AUAAAAABCr4BAQAAAAHBAQAAAMEBAsIBAQAAAAHDAQEAAAABxAGAAAAAAcUBgAAAAAHGAQEAAAABxwEBAAAAAcgBAQAAAAHJAUAAAAABAgAAACYAIB8AAO4EACADAAAAJgAgHwAA7gQAICAAAO0EACABGAAApQUAMA8DAADtAgAguwEAAO8CADC8AQAAJAAQvQEAAO8CADC-AQEAAAABvwEBAL0CACHBAQAA8ALBASLCAQEAvQIAIcMBAQC9AgAhxAEAAOICACDFAQAA4gIAIMYBAQC-AgAhxwEBAL4CACHIAQEAvgIAIckBQADDAgAhAgAAACYAIBgAAO0EACACAAAA6wQAIBgAAOwEACAOuwEAAOoEADC8AQAA6wQAEL0BAADqBAAwvgEBAL0CACG_AQEAvQIAIcEBAADwAsEBIsIBAQC9AgAhwwEBAL0CACHEAQAA4gIAIMUBAADiAgAgxgEBAL4CACHHAQEAvgIAIcgBAQC-AgAhyQFAAMMCACEOuwEAAOoEADC8AQAA6wQAEL0BAADqBAAwvgEBAL0CACG_AQEAvQIAIcEBAADwAsEBIsIBAQC9AgAhwwEBAL0CACHEAQAA4gIAIMUBAADiAgAgxgEBAL4CACHHAQEAvgIAIcgBAQC-AgAhyQFAAMMCACEKvgEBAIQDACHBAQAAhQPBASLCAQEAhAMAIcMBAQCEAwAhxAGAAAAAAcUBgAAAAAHGAQEAhgMAIccBAQCGAwAhyAEBAIYDACHJAUAAhwMAIQq-AQEAhAMAIcEBAACFA8EBIsIBAQCEAwAhwwEBAIQDACHEAYAAAAABxQGAAAAAAcYBAQCGAwAhxwEBAIYDACHIAQEAhgMAIckBQACHAwAhCr4BAQAAAAHBAQAAAMEBAsIBAQAAAAHDAQEAAAABxAGAAAAAAcUBgAAAAAHGAQEAAAABxwEBAAAAAcgBAQAAAAHJAUAAAAABDgUAAKMDACALAACkAwAgvgEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAHuAQEAAAAB7wECAAAAAfABAQAAAAHxAQEAAAAB8gFAAAAAAfMBIAAAAAH0AQEAAAABAgAAABUAIB8AAPcEACADAAAAFQAgHwAA9wQAICAAAPYEACABGAAApAUAMAIAAAAVACAYAAD2BAAgAgAAAJgEACAYAAD1BAAgDL4BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7QEBAIQDACHuAQEAhAMAIe8BAgCZAwAh8AEBAIYDACHxAQEAhgMAIfIBQACOAwAh8wEgAI0DACH0AQEAhgMAIQ4FAACgAwAgCwAAoQMAIL4BAQCEAwAhyQFAAIcDACHgAUAAjgMAIewBQACHAwAh7QEBAIQDACHuAQEAhAMAIe8BAgCZAwAh8AEBAIYDACHxAQEAhgMAIfIBQACOAwAh8wEgAI0DACH0AQEAhgMAIQ4FAACjAwAgCwAApAMAIL4BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB7gEBAAAAAe8BAgAAAAHwAQEAAAAB8QEBAAAAAfIBQAAAAAHzASAAAAAB9AEBAAAAASEGAAC0BAAgCAAAtgQAIAoAALMEACAMAAC1BAAgvgEBAAAAAcYBAQAAAAHJAUAAAAAB3AEBAAAAAeABQAAAAAHpAUAAAAAB6gFAAAAAAesBIAAAAAHsAUAAAAAB-AEAAACuAgKTAkAAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIBAAAAAacCAQAAAAGoAgEAAAABqQIBAAAAAaoCIAAAAAGrAgEAAAABrAIBAAAAAa8CAgAAAAGwAiAAAAABsQIgAAAAAbICAQAAAAGzAgAAsQQAILQCAgAAAAG1AoAAAAABtgJAAAAAAQIAAAAhACAfAACDBQAgAwAAACEAIB8AAIMFACAgAACCBQAgARgAAKMFADAmBAAA7QIAIAYAAOMCACAIAADnAgAgCgAA8wIAIAwAAOUCACC7AQAA8QIAMLwBAAAfABC9AQAA8QIAML4BAQAAAAHGAQEAvQIAIckBQADDAgAh3AEBAL0CACHgAUAAxQIAIekBQADDAgAh6gFAAMMCACHrASAAxAIAIewBQADDAgAh-AEAAPICrgIikwJAAMUCACGjAgEAAAABpAIBAL0CACGlAgEAvgIAIaYCAQC9AgAhpwIBAL0CACGoAgEAvQIAIakCAQC9AgAhqgIgAMQCACGrAgEAvgIAIawCAQC9AgAhrgIBAL0CACGvAgIAwgIAIbACIADEAgAhsQIgAMQCACGyAgEAvgIAIbMCAADVAgAgtAICAMECACG1AgAA4gIAILYCQADFAgAhAgAAACEAIBgAAIIFACACAAAAgAUAIBgAAIEFACAhuwEAAP8EADC8AQAAgAUAEL0BAAD_BAAwvgEBAL0CACHGAQEAvQIAIckBQADDAgAh3AEBAL0CACHgAUAAxQIAIekBQADDAgAh6gFAAMMCACHrASAAxAIAIewBQADDAgAh-AEAAPICrgIikwJAAMUCACGjAgEAvQIAIaQCAQC9AgAhpQIBAL4CACGmAgEAvQIAIacCAQC9AgAhqAIBAL0CACGpAgEAvQIAIaoCIADEAgAhqwIBAL4CACGsAgEAvQIAIa4CAQC9AgAhrwICAMICACGwAiAAxAIAIbECIADEAgAhsgIBAL4CACGzAgAA1QIAILQCAgDBAgAhtQIAAOICACC2AkAAxQIAISG7AQAA_wQAMLwBAACABQAQvQEAAP8EADC-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_AgAAgAMAIMECAACAAwAgAA0EAACcBQAgBgAAlAUAIAgAAJgFACAKAACdBQAgDAAAlgUAIOABAACAAwAgkwIAAIADACClAgAAgAMAIKsCAACAAwAgsgIAAIADACC0AgAAgAMAILUCAACAAwAgtgIAAIADACAHBQAAngUAIAYAAJQFACAIAACYBQAgxgEAAIADACDgAQAAgAMAIJ0CAACAAwAgngIAAIADACAJAwAAnAUAIAsAAJsFACDgAQAAgAMAIIACAACAAwAgggIAAIADACCDAgAAgAMAIIQCAACAAwAghQIAAIADACCGAgAAgAMAIAgDAACcBQAgBQAAngUAIAsAAJsFACDgAQAAgAMAIPABAACAAwAg8QEAAIADACDyAQAAgAMAIPQBAACAAwAgF74BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB9QEBAAAAAfYBAgAAAAH4AQAAAI4CAocCAQAAAAGIAhAAAAABiQIQAAAAAYoCEAAAAAGLAhAAAAABjAIBAAAAAY4CQAAAAAGPAkAAAAABkAIBAAAAAZECAQAAAAGSAgEAAAABkwJAAAAAAZQCAQAAAAGVAhAAAAABlgJAAAAAAR2-AQEAAAABxgEBAAAAAckBQAAAAAHcAQEAAAAB4AFAAAAAAekBQAAAAAHqAUAAAAAB6wEgAAAAAewBQAAAAAH4AQAAAK4CApMCQAAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAGmAgEAAAABpwIBAAAAAagCAQAAAAGpAgEAAAABqgIgAAAAAasCAQAAAAGsAgEAAAABrwICAAAAAbACIAAAAAGxAiAAAAABsgIBAAAAAbMCAACxBAAgtAICAAAAAbUCgAAAAAG2AkAAAAABDL4BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB7gEBAAAAAe8BAgAAAAHwAQEAAAAB8QEBAAAAAfIBQAAAAAHzASAAAAAB9AEBAAAAAQq-AQEAAAABwQEAAADBAQLCAQEAAAABwwEBAAAAAcQBgAAAAAHFAYAAAAABxgEBAAAAAccBAQAAAAHIAQEAAAAByQFAAAAAAQy-AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB7QEBAAAAAfUBAQAAAAH2AQIAAAAB-AEAAAD4AQL5AUAAAAAB-gFAAAAAAfsBQAAAAAH8AUAAAAABCRiAAAAAAb4BAQAAAAHJAUAAAAAB2wEBAAAAAdwBAQAAAAHdAQEAAAAB3gEgAAAAAd8BQAAAAAHgAUAAAAABD74BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHuAQEAAAAB-AEAAACCAgL9ARAAAAAB_gEBAAAAAf8BAQAAAAGAAgEAAAABggIBAAAAAYMCgAAAAAGEAhAAAAABhQIBAAAAAYYCQAAAAAEWBgAAjQUAIAgAAJEFACAMAACPBQAgEAAAkAUAIBEAAJIFACASAACTBQAgvgEBAAAAAckBQAAAAAHgAUAAAAAB6wEgAAAAAewBQAAAAAGXAgEAAAABtwIBAAAAAbgCAQAAAAG6AgAAALoCArsCAQAAAAG8AgEAAAABvQJAAAAAAb4CAQAAAAG_AoAAAAABwAIgAAAAAcECQAAAAAECAAAAAQAgHwAAqQUAIBC-AQEAAAABxgEBAAAAAckBQAAAAAHgAUAAAAAB5AECAAAAAewBQAAAAAH2AQIAAAAB-AEAAACdAgKXAgEAAAABmAIQAAAAAZkCAgAAAAGaAgIAAAABmwICAAAAAZ0CQAAAAAGeAkAAAAABnwIAAPcDACAXvgEBAAAAAb8BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAH1AQEAAAAB9gECAAAAAfgBAAAAjgIChwIBAAAAAYgCEAAAAAGJAhAAAAABigIQAAAAAYsCEAAAAAGMAgEAAAABjgJAAAAAAY8CQAAAAAGQAgEAAAABkQIBAAAAAZICAQAAAAGTAkAAAAABlAIBAAAAAZUCEAAAAAGWAkAAAAABDL4BAQAAAAG_AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB7gEBAAAAAe8BAgAAAAHwAQEAAAAB8QEBAAAAAfIBQAAAAAHzASAAAAAB9AEBAAAAAQy-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAfUBAQAAAAH2AQIAAAAB-AEAAAD4AQL5AUAAAAAB-gFAAAAAAfsBQAAAAAH8AUAAAAABAwAAADgAIB8AAKkFACAgAACxBQAgGAAAADgAIAYAALsEACAIAAC_BAAgDAAAvQQAIBAAAL4EACARAADABAAgEgAAwQQAIBgAALEFACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAIRYGAAC7BAAgCAAAvwQAIAwAAL0EACAQAAC-BAAgEQAAwAQAIBIAAMEEACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAISIEAACyBAAgBgAAtAQAIAgAALYEACAMAAC1BAAgvgEBAAAAAcYBAQAAAAHJAUAAAAAB3AEBAAAAAeABQAAAAAHpAUAAAAAB6gFAAAAAAesBIAAAAAHsAUAAAAAB-AEAAACuAgKTAkAAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIBAAAAAacCAQAAAAGoAgEAAAABqQIBAAAAAaoCIAAAAAGrAgEAAAABrAIBAAAAAa4CAQAAAAGvAgIAAAABsAIgAAAAAbECIAAAAAGyAgEAAAABswIAALEEACC0AgIAAAABtQKAAAAAAbYCQAAAAAECAAAAIQAgHwAAsgUAIBe-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAH2AQIAAAAB-AEAAACOAgKHAgEAAAABiAIQAAAAAYkCEAAAAAGKAhAAAAABiwIQAAAAAYwCAQAAAAGOAkAAAAABjwJAAAAAAZACAQAAAAGRAgEAAAABkgIBAAAAAZMCQAAAAAGUAgEAAAABlQIQAAAAAZYCQAAAAAEMvgEBAAAAAb8BAQAAAAHJAUAAAAAB4AFAAAAAAewBQAAAAAHtAQEAAAAB9gECAAAAAfgBAAAA-AEC-QFAAAAAAfoBQAAAAAH7AUAAAAAB_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_AoAAAAABwAIgAI0DACHBAkAAjgMAIRYIAAC_BAAgDAAAvQQAIA8AALwEACAQAAC-BAAgEQAAwAQAIBIAAMEEACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAIRYGAACNBQAgCAAAkQUAIAwAAI8FACAPAACOBQAgEAAAkAUAIBEAAJIFACC-AQEAAAAByQFAAAAAAeABQAAAAAHrASAAAAAB7AFAAAAAAZcCAQAAAAG3AgEAAAABuAIBAAAAAboCAAAAugICuwIBAAAAAbwCAQAAAAG9AkAAAAABvgIBAAAAAb8CgAAAAAHAAiAAAAABwQJAAAAAAQIAAAABACAfAADIBQAgHAMAANADACAFAADRAwAgBwAA0gMAIA4AANQDACC-AQEAAAABvwEBAAAAAckBQAAAAAHgAUAAAAAB7AFAAAAAAe0BAQAAAAH1AQEAAAAB9gECAAAAAfgBAAAAjgIChwIBAAAAAYgCEAAAAAGJAhAAAAABigIQAAAAAYsCEAAAAAGMAgEAAAABjgJAAAAAAY8CQAAAAAGQAgEAAAABkQIBAAAAAZICAQAAAAGTAkAAAAABlAIBAAAAAZUCEAAAAAGWAkAAAAABAgAAAAUAIB8AAMoFACADAAAAOAAgHwAAyAUAICAAAM4FACAYAAAAOAAgBgAAuwQAIAgAAL8EACAMAAC9BAAgDwAAvAQAIBAAAL4EACARAADABAAgGAAAzgUAIL4BAQCEAwAhyQFAAIcDACHgAUAAjgMAIesBIACNAwAh7AFAAIcDACGXAgEAhAMAIbcCAQCEAwAhuAIBAIQDACG6AgAAugS6AiK7AgEAhgMAIbwCAQCGAwAhvQJAAI4DACG-AgEAhgMAIb8CgAAAAAHAAiAAjQMAIcECQACOAwAhFgYAALsEACAIAAC_BAAgDAAAvQQAIA8AALwEACAQAAC-BAAgEQAAwAQAIL4BAQCEAwAhyQFAAIcDACHgAUAAjgMAIesBIACNAwAh7AFAAIcDACGXAgEAhAMAIbcCAQCEAwAhuAIBAIQDACG6AgAAugS6AiK7AgEAhgMAIbwCAQCGAwAhvQJAAI4DACG-AgEAhgMAIb8CgAAAAAHAAiAAjQMAIcECQACOAwAhAwAAAAMAIB8AAMoFACAgAADRBQAgHgAAAAMAIAMAAMEDACAFAADCAwAgBwAAwwMAIA4AAMUDACAYAADRBQAgvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe0BAQCEAwAh9QEBAIQDACH2AQIAmQMAIfgBAADAA44CIocCAQCEAwAhiAIQAJYDACGJAhAAlgMAIYoCEACWAwAhiwIQAJYDACGMAgEAhgMAIY4CQACOAwAhjwJAAI4DACGQAgEAhgMAIZECAQCGAwAhkgIBAIYDACGTAkAAjgMAIZQCAQCGAwAhlQIQAJcDACGWAkAAjgMAIRwDAADBAwAgBQAAwgMAIAcAAMMDACAOAADFAwAgvgEBAIQDACG_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_AQEAAAAByQFAAAAAAeABQAAAAAHsAUAAAAAB7QEBAAAAAfUBAQAAAAH2AQIAAAAB-AEAAACOAgKHAgEAAAABiAIQAAAAAYkCEAAAAAGKAhAAAAABiwIQAAAAAYwCAQAAAAGOAkAAAAABjwJAAAAAAZACAQAAAAGRAgEAAAABkgIBAAAAAZMCQAAAAAGUAgEAAAABlQIQAAAAAZYCQAAAAAECAAAABQAgHwAA4QUAICIEAACyBAAgBgAAtAQAIAgAALYEACAKAACzBAAgvgEBAAAAAcYBAQAAAAHJAUAAAAAB3AEBAAAAAeABQAAAAAHpAUAAAAAB6gFAAAAAAesBIAAAAAHsAUAAAAAB-AEAAACuAgKTAkAAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIBAAAAAacCAQAAAAGoAgEAAAABqQIBAAAAAaoCIAAAAAGrAgEAAAABrAIBAAAAAa4CAQAAAAGvAgIAAAABsAIgAAAAAbECIAAAAAGyAgEAAAABswIAALEEACC0AgIAAAABtQKAAAAAAbYCQAAAAAECAAAAIQAgHwAA4wUAIBYGAACNBQAgCAAAkQUAIA8AAI4FACAQAACQBQAgEQAAkgUAIBIAAJMFACC-AQEAAAAByQFAAAAAAeABQAAAAAHrASAAAAAB7AFAAAAAAZcCAQAAAAG3AgEAAAABuAIBAAAAAboCAAAAugICuwIBAAAAAbwCAQAAAAG9AkAAAAABvgIBAAAAAb8CgAAAAAHAAiAAAAABwQJAAAAAAQIAAAABACAfAADlBQAgAwAAAAMAIB8AAOEFACAgAADpBQAgHgAAAAMAIAMAAMEDACAFAADCAwAgBwAAwwMAIA0AAMQDACAYAADpBQAgvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe0BAQCEAwAh9QEBAIQDACH2AQIAmQMAIfgBAADAA44CIocCAQCEAwAhiAIQAJYDACGJAhAAlgMAIYoCEACWAwAhiwIQAJYDACGMAgEAhgMAIY4CQACOAwAhjwJAAI4DACGQAgEAhgMAIZECAQCGAwAhkgIBAIYDACGTAkAAjgMAIZQCAQCGAwAhlQIQAJcDACGWAkAAjgMAIRwDAADBAwAgBQAAwgMAIAcAAMMDACANAADEAwAgvgEBAIQDACG_AQEAhAMAIckBQACHAwAh4AFAAI4DACHsAUAAhwMAIe0BAQCEAwAh9QEBAIQDACH2AQIAmQMAIfgBAADAA44CIocCAQCEAwAhiAIQAJYDACGJAhAAlgMAIYoCEACWAwAhiwIQAJYDACGMAgEAhgMAIY4CQACOAwAhjwJAAI4DACGQAgEAhgMAIZECAQCGAwAhkgIBAIYDACGTAkAAjgMAIZQCAQCGAwAhlQIQAJcDACGWAkAAjgMAIQMAAAAfACAfAADjBQAgIAAA7AUAICQAAAAfACAEAACCBAAgBgAAhAQAIAgAAIYEACAKAACDBAAgGAAA7AUAIL4BAQCEAwAhxgEBAIQDACHJAUAAhwMAIdwBAQCEAwAh4AFAAI4DACHpAUAAhwMAIeoBQACHAwAh6wEgAI0DACHsAUAAhwMAIfgBAACABK4CIpMCQACOAwAhowIBAIQDACGkAgEAhAMAIaUCAQCGAwAhpgIBAIQDACGnAgEAhAMAIagCAQCEAwAhqQIBAIQDACGqAiAAjQMAIasCAQCGAwAhrAIBAIQDACGuAgEAhAMAIa8CAgCZAwAhsAIgAI0DACGxAiAAjQMAIbICAQCGAwAhswIAAIEEACC0AgIAmAMAIbUCgAAAAAG2AkAAjgMAISIEAACCBAAgBgAAhAQAIAgAAIYEACAKAACDBAAgvgEBAIQDACHGAQEAhAMAIckBQACHAwAh3AEBAIQDACHgAUAAjgMAIekBQACHAwAh6gFAAIcDACHrASAAjQMAIewBQACHAwAh-AEAAIAErgIikwJAAI4DACGjAgEAhAMAIaQCAQCEAwAhpQIBAIYDACGmAgEAhAMAIacCAQCEAwAhqAIBAIQDACGpAgEAhAMAIaoCIACNAwAhqwIBAIYDACGsAgEAhAMAIa4CAQCEAwAhrwICAJkDACGwAiAAjQMAIbECIACNAwAhsgIBAIYDACGzAgAAgQQAILQCAgCYAwAhtQKAAAAAAbYCQACOAwAhAwAAADgAIB8AAOUFACAgAADvBQAgGAAAADgAIAYAALsEACAIAAC_BAAgDwAAvAQAIBAAAL4EACARAADABAAgEgAAwQQAIBgAAO8FACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAIRYGAAC7BAAgCAAAvwQAIA8AALwEACAQAAC-BAAgEQAAwAQAIBIAAMEEACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAIRYGAACNBQAgCAAAkQUAIAwAAI8FACAPAACOBQAgEAAAkAUAIBIAAJMFACC-AQEAAAAByQFAAAAAAeABQAAAAAHrASAAAAAB7AFAAAAAAZcCAQAAAAG3AgEAAAABuAIBAAAAAboCAAAAugICuwIBAAAAAbwCAQAAAAG9AkAAAAABvgIBAAAAAb8CgAAAAAHAAiAAAAABwQJAAAAAAQIAAAABACAfAADwBQAgAwAAADgAIB8AAPAFACAgAAD0BQAgGAAAADgAIAYAALsEACAIAAC_BAAgDAAAvQQAIA8AALwEACAQAAC-BAAgEgAAwQQAIBgAAPQFACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAIRYGAAC7BAAgCAAAvwQAIAwAAL0EACAPAAC8BAAgEAAAvgQAIBIAAMEEACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAIRYGAACNBQAgCAAAkQUAIAwAAI8FACAPAACOBQAgEQAAkgUAIBIAAJMFACC-AQEAAAAByQFAAAAAAeABQAAAAAHrASAAAAAB7AFAAAAAAZcCAQAAAAG3AgEAAAABuAIBAAAAAboCAAAAugICuwIBAAAAAbwCAQAAAAG9AkAAAAABvgIBAAAAAb8CgAAAAAHAAiAAAAABwQJAAAAAAQIAAAABACAfAAD1BQAgAwAAADgAIB8AAPUFACAgAAD5BQAgGAAAADgAIAYAALsEACAIAAC_BAAgDAAAvQQAIA8AALwEACARAADABAAgEgAAwQQAIBgAAPkFACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAIRYGAAC7BAAgCAAAvwQAIAwAAL0EACAPAAC8BAAgEQAAwAQAIBIAAMEEACC-AQEAhAMAIckBQACHAwAh4AFAAI4DACHrASAAjQMAIewBQACHAwAhlwIBAIQDACG3AgEAhAMAIbgCAQCEAwAhugIAALoEugIiuwIBAIYDACG8AgEAhgMAIb0CQACOAwAhvgIBAIYDACG_AoAAAAABwAIgAI0DACHBAkAAjgMAIQgGBgIIKAUJAAwMIwcPIgMQJwoRLAsSLwkFAwABBQADBwAEDR0JDh4HBgQAAQYSAggXBQkACAoKBAwWBwQFAAMGCwIIDwUJAAYDAwABBQADBwAEAgYQAAgRAAMDAAEFAAMLAAIEBhkACBsAChgADBoAAgMAAQsAAgEDAAEBAwABBwYwAAg0AAwyAA8xABAzABE1ABI2AAAAAAMJABElABImABMAAAADCQARJQASJgATAQQAAQEEAAEFCQAYJQAbJgAcNwAZOAAaAAAAAAAFCQAYJQAbJgAcNwAZOAAaAQUAAwEFAAMFCQAhJQAkJgAlNwAiOAAjAAAAAAAFCQAhJQAkJgAlNwAiOAAjAwMAAQUAAwcABAMDAAEFAAMHAAQFCQAqJQAtJgAuNwArOAAsAAAAAAAFCQAqJQAtJgAuNwArOAAsAgMAAQsAAgIDAAELAAIFCQAzJQA2JgA3NwA0OAA1AAAAAAAFCQAzJQA2JgA3NwA0OAA1AwMAAQUAAwcABAMDAAEFAAMHAAQFCQA8JQA_JgBANwA9OAA-AAAAAAAFCQA8JQA_JgBANwA9OAA-AwMAAQUAAwsAAgMDAAEFAAMLAAIFCQBFJQBIJgBJNwBGOABHAAAAAAAFCQBFJQBIJgBJNwBGOABHAAAABQkATyUAUiYAUzcAUDgAUQAAAAAABQkATyUAUiYAUzcAUDgAUQEDAAEBAwABAwkAWCUAWSYAWgAAAAMJAFglAFkmAFoBAwABAQMAAQMJAF8lAGAmAGEAAAADCQBfJQBgJgBhEwIBFDcBFToBFjsBFzwBGT4BGkANG0EOHEMBHUUNHkYPIUcBIkgBI0kNJ0wQKE0UKU4DKk8DK1ADLFEDLVIDLlQDL1YNMFcVMVkDMlsNM1wWNF0DNV4DNl8NOWIXOmMdO2QEPGUEPWYEPmcEP2gEQGoEQWwNQm0eQ28ERHENRXIfRnMER3QESHUNSXggSnkmS3oCTHsCTXwCTn0CT34CUIABAlGCAQ1SgwEnU4UBAlSHAQ1ViAEoVokBAleKAQJYiwENWY4BKVqPAS9bkAEJXJEBCV2SAQlekwEJX5QBCWCWAQlhmAENYpkBMGObAQlknQENZZ4BMWafAQlnoAEJaKEBDWmkATJqpQE4a6YBBWynAQVtqAEFbqkBBW-qAQVwrAEFca4BDXKvATlzsQEFdLMBDXW0ATp2tQEFd7YBBXi3AQ15ugE7ersBQXu8AQd8vQEHfb4BB36_AQd_wAEHgAHCAQeBAcQBDYIBxQFCgwHHAQeEAckBDYUBygFDhgHLAQeHAcwBB4gBzQENiQHQAUSKAdEBSosB0wFLjAHUAUuNAdcBS44B2AFLjwHZAUuQAdsBS5EB3QENkgHeAUyTAeABS5QB4gENlQHjAU2WAeQBS5cB5QFLmAHmAQ2ZAekBTpoB6gFUmwHrAQucAewBC50B7QELngHuAQufAe8BC6AB8QELoQHzAQ2iAfQBVaMB9gELpAH4AQ2lAfkBVqYB-gELpwH7AQuoAfwBDakB_wFXqgGAAlurAYECCqwBggIKrQGDAgquAYQCCq8BhQIKsAGHAgqxAYkCDbIBigJcswGMAgq0AY4CDbUBjwJdtgGQAgq3AZECCrgBkgINuQGVAl66AZYCYg"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AnyNull: () => AnyNull2,
  AuditLogScalarFieldEnum: () => AuditLogScalarFieldEnum,
  BookingScalarFieldEnum: () => BookingScalarFieldEnum,
  CouponScalarFieldEnum: () => CouponScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  EventScalarFieldEnum: () => EventScalarFieldEnum,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  ModelName: () => ModelName,
  NotificationScalarFieldEnum: () => NotificationScalarFieldEnum,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TicketTierScalarFieldEnum: () => TicketTierScalarFieldEnum,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  WaitlistScalarFieldEnum: () => WaitlistScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.10.0",
  engine: "0edf323efd1d98336f3f0a68684b56f689b900d3"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  User: "User",
  Event: "Event",
  TicketTier: "TicketTier",
  Booking: "Booking",
  Payment: "Payment",
  Waitlist: "Waitlist",
  Review: "Review",
  Coupon: "Coupon",
  Notification: "Notification",
  AuditLog: "AuditLog"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  email: "email",
  password: "password",
  name: "name",
  role: "role",
  phone: "phone",
  profileImage: "profileImage",
  dateOfBirth: "dateOfBirth",
  bio: "bio",
  notificationPreferences: "notificationPreferences",
  isActive: "isActive",
  isEmailVerified: "isEmailVerified",
  lastLogin: "lastLogin",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var EventScalarFieldEnum = {
  id: "id",
  title: "title",
  slug: "slug",
  description: "description",
  category: "category",
  subCategory: "subCategory",
  venue: "venue",
  address: "address",
  city: "city",
  country: "country",
  isVirtual: "isVirtual",
  virtualLink: "virtualLink",
  startDate: "startDate",
  endDate: "endDate",
  timezone: "timezone",
  status: "status",
  organizerId: "organizerId",
  maxTicketsPerUser: "maxTicketsPerUser",
  isWaitlistEnabled: "isWaitlistEnabled",
  allowRefund: "allowRefund",
  bannerImage: "bannerImage",
  galleryImages: "galleryImages",
  ageRestriction: "ageRestriction",
  additionalInfo: "additionalInfo",
  isActive: "isActive",
  publishedAt: "publishedAt",
  cancelledAt: "cancelledAt",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TicketTierScalarFieldEnum = {
  id: "id",
  eventId: "eventId",
  name: "name",
  description: "description",
  price: "price",
  quantity: "quantity",
  sold: "sold",
  reserved: "reserved",
  minPurchase: "minPurchase",
  maxPurchase: "maxPurchase",
  status: "status",
  saleStartDate: "saleStartDate",
  saleEndDate: "saleEndDate",
  includes: "includes",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BookingScalarFieldEnum = {
  id: "id",
  bookingNumber: "bookingNumber",
  userId: "userId",
  eventId: "eventId",
  ticketTierId: "ticketTierId",
  quantity: "quantity",
  unitPrice: "unitPrice",
  totalPrice: "totalPrice",
  discountAmount: "discountAmount",
  finalAmount: "finalAmount",
  couponCode: "couponCode",
  status: "status",
  expiresAt: "expiresAt",
  checkedInAt: "checkedInAt",
  checkedInBy: "checkedInBy",
  specialRequests: "specialRequests",
  dietaryNeeds: "dietaryNeeds",
  cancelledAt: "cancelledAt",
  cancellationReason: "cancellationReason",
  refundAmount: "refundAmount",
  refundProcessedAt: "refundProcessedAt",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PaymentScalarFieldEnum = {
  id: "id",
  bookingId: "bookingId",
  userId: "userId",
  amount: "amount",
  currency: "currency",
  method: "method",
  transactionId: "transactionId",
  status: "status",
  failureReason: "failureReason",
  rawResponse: "rawResponse",
  refundedAmount: "refundedAmount",
  refundReason: "refundReason",
  refundedAt: "refundedAt",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var WaitlistScalarFieldEnum = {
  id: "id",
  eventId: "eventId",
  userId: "userId",
  ticketTierId: "ticketTierId",
  quantity: "quantity",
  status: "status",
  offerExpiresAt: "offerExpiresAt",
  notifiedAt: "notifiedAt",
  convertedAt: "convertedAt",
  expiredAt: "expiredAt",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ReviewScalarFieldEnum = {
  id: "id",
  userId: "userId",
  eventId: "eventId",
  bookingId: "bookingId",
  rating: "rating",
  comment: "comment",
  organizerResponse: "organizerResponse",
  responseDate: "responseDate",
  isHidden: "isHidden",
  hiddenReason: "hiddenReason",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CouponScalarFieldEnum = {
  id: "id",
  code: "code",
  description: "description",
  discountType: "discountType",
  discountValue: "discountValue",
  minPurchase: "minPurchase",
  maxDiscount: "maxDiscount",
  usageLimit: "usageLimit",
  usedCount: "usedCount",
  perUserLimit: "perUserLimit",
  startDate: "startDate",
  endDate: "endDate",
  isActive: "isActive",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var NotificationScalarFieldEnum = {
  id: "id",
  userId: "userId",
  type: "type",
  title: "title",
  message: "message",
  data: "data",
  isRead: "isRead",
  readAt: "readAt",
  deletedAt: "deletedAt",
  createdAt: "createdAt"
};
var AuditLogScalarFieldEnum = {
  id: "id",
  userId: "userId",
  action: "action",
  entityType: "entityType",
  entityId: "entityId",
  oldValues: "oldValues",
  newValues: "newValues",
  description: "description",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  createdAt: "createdAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/config/db.ts
import { PrismaPg } from "@prisma/adapter-pg";
var adapter = new PrismaPg({ connectionString: env.databaseUrl });
var prisma = global.__prisma ?? new PrismaClient({
  adapter,
  log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"]
});
if (env.nodeEnv !== "production") {
  global.__prisma = prisma;
}

// src/utils/ApiError.ts
var ApiError = class _ApiError extends Error {
  statusCode;
  code;
  errors;
  constructor(statusCode, message, code = "ERROR", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, _ApiError.prototype);
  }
  static badRequest(message, errors = []) {
    return new _ApiError(400, message, "VALIDATION_ERROR", errors);
  }
  static unauthorized(message = "Authentication required") {
    return new _ApiError(401, message, "UNAUTHORIZED");
  }
  static invalidToken(message = "Invalid or expired token") {
    return new _ApiError(401, message, "INVALID_TOKEN");
  }
  static forbidden(message = "Insufficient permissions") {
    return new _ApiError(403, message, "FORBIDDEN");
  }
  static notFound(message = "Resource not found") {
    return new _ApiError(404, message, "NOT_FOUND");
  }
  static conflict(message, code = "CONFLICT") {
    return new _ApiError(409, message, code);
  }
  static unprocessable(message, code = "UNPROCESSABLE") {
    return new _ApiError(422, message, code);
  }
  static paymentFailed(message = "Payment processing failed") {
    return new _ApiError(402, message, "PAYMENT_FAILED");
  }
  static internal(message = "Something went wrong") {
    return new _ApiError(500, message, "INTERNAL_SERVER_ERROR");
  }
};

// src/utils/password.ts
import bcrypt from "bcrypt";
async function hashPassword(plain) {
  return bcrypt.hash(plain, env.bcryptSaltRounds);
}
async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
function signAccessToken(payload) {
  const options = {
    expiresIn: env.jwt.accessExpiresIn
  };
  return jwt.sign(payload, env.jwt.accessSecret, options);
}
function signRefreshToken(payload) {
  const options = {
    expiresIn: env.jwt.refreshExpiresIn
  };
  return jwt.sign(payload, env.jwt.refreshSecret, options);
}
function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}
function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

// src/modules/auth/auth.service.ts
import jwt2 from "jsonwebtoken";

// src/utils/logger.ts
import winston from "winston";
var logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    ...env.nodeEnv !== "production" ? [new winston.transports.Console({ format: winston.format.simple() })] : []
  ]
});

// src/modules/auth/auth.service.ts
function toAuthUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
async function register(input) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email }
  });
  if (existing) {
    throw ApiError.badRequest("Validation failed", [
      { field: "email", message: "Email already exists" }
    ]);
  }
  const hashed = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashed,
      name: input.name,
      phone: input.phone,
      role: input.role
    }
  });
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  return {
    user: toAuthUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}
async function login(input) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null }
  });
  if (!user) throw new ApiError(401, "Invalid credentials", "AUTH_ERROR");
  const valid = await comparePassword(input.password, user.password);
  if (!valid) throw new ApiError(401, "Invalid credentials", "AUTH_ERROR");
  if (!user.isActive) throw ApiError.forbidden("Account has been suspended");
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: /* @__PURE__ */ new Date() }
  });
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  return {
    user: toAuthUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 3600
  };
}
async function refreshToken(token) {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.invalidToken();
  }
  const user = await prisma.user.findFirst({
    where: { id: decoded.id, deletedAt: null }
  });
  if (!user || !user.isActive) throw ApiError.invalidToken();
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 3600
  };
}
async function forgotPassword(email) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null }
  });
  if (!user) {
    logger.info(`Password reset requested for unknown email: ${email}`);
    return;
  }
  const resetToken = jwt2.sign(
    { id: user.id, purpose: "password_reset" },
    env.jwt.refreshSecret,
    {
      expiresIn: "15m"
    }
  );
  logger.info(`Password reset token for ${email}: ${resetToken}`);
}
async function resetPassword(token, newPassword) {
  let decoded;
  try {
    decoded = jwt2.verify(token, env.jwt.refreshSecret);
  } catch {
    throw ApiError.badRequest("Reset token is invalid or expired");
  }
  if (decoded.purpose !== "password_reset")
    throw ApiError.badRequest("Invalid reset token");
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: decoded.id },
    data: { password: hashed }
  });
}
var authService = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword
};

// src/modules/auth/auth.controller.ts
var register2 = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  sendSuccess(res, 201, "User registered successfully", result);
});
var login2 = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  sendSuccess(res, 200, "Login successful", result);
});
var refreshToken2 = catchAsync(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  sendSuccess(res, 200, "Token refreshed successfully", result);
});
var logout = catchAsync(async (_req, res) => {
  sendSuccess(res, 200, "Logged out successfully", null);
});
var forgotPassword2 = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, 200, "Password reset link sent to your email", null);
});
var resetPassword2 = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  sendSuccess(res, 200, "Password reset successfully", null);
});
var authController = {
  register: register2,
  login: login2,
  refreshToken: refreshToken2,
  logout,
  forgotPassword: forgotPassword2,
  resetPassword: resetPassword2
};

// src/middlewares/validateRequest.ts
import { ZodError } from "zod";
function validateRequest(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join(".") || "unknown",
          message: e.message
        }));
        return next(ApiError.badRequest("Validation failed", errors));
      }
      next(err);
    }
  };
}

// src/middlewares/authenticate.ts
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized();
    }
    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
      select: { id: true, email: true, role: true, isActive: true }
    });
    if (!user) throw ApiError.invalidToken();
    if (!user.isActive) throw ApiError.forbidden("Account has been suspended");
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.invalidToken());
  }
}

// src/middlewares/rateLimiter.ts
import rateLimit from "express-rate-limit";
function makeLimiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message,
        code: "RATE_LIMIT_EXCEEDED",
        errors: []
      });
    }
  });
}
var generalLimiter = makeLimiter(
  60 * 1e3,
  100,
  "Too many requests, please try again later"
);
var authLimiter = makeLimiter(
  60 * 1e3,
  5,
  "Too many authentication attempts, please try again later"
);
var bookingLimiter = makeLimiter(
  60 * 1e3,
  10,
  "Too many booking attempts, please slow down"
);
var paymentLimiter = makeLimiter(
  60 * 1e3,
  3,
  "Too many payment attempts, please try again later"
);

// src/modules/auth/auth.validation.ts
import { z } from "zod";
var registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[a-z]/, "Must contain at least one lowercase letter").regex(/[0-9]/, "Must contain at least one number"),
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    phone: z.string().optional(),
    role: z.enum(["ATTENDEE", "ORGANIZER"]).default("ATTENDEE")
  })
});
var loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required")
  })
});
var refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
  })
});
var forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});
var resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[a-z]/, "Must contain at least one lowercase letter").regex(/[0-9]/, "Must contain at least one number")
  })
});

// src/modules/auth/auth.route.ts
var router = Router();
router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  authController.register
);
router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  authController.login
);
router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);
router.post("/logout", authenticate, authController.logout);
router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);
var authRoutes = router;

// src/modules/user/user.route.ts
import { Router as Router2 } from "express";
import multer from "multer";

// src/config/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret
});

// src/modules/user/user.service.ts
var PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  profileImage: true,
  bio: true,
  dateOfBirth: true,
  isEmailVerified: true,
  notificationPreferences: true,
  createdAt: true
};
async function getMe(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: PROFILE_SELECT
  });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}
async function updateMe(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      notificationPreferences: data.notificationPreferences
    },
    select: PROFILE_SELECT
  });
  return user;
}
async function uploadProfileImage(userId, fileBuffer) {
  const uploaded = await new Promise(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `users/${userId}`, resource_type: "image" },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve(result);
        }
      );
      stream.end(fileBuffer);
    }
  );
  await prisma.user.update({
    where: { id: userId },
    data: { profileImage: uploaded.secure_url }
  });
  return uploaded.secure_url;
}
async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await comparePassword(currentPassword, user.password);
  if (!valid)
    throw ApiError.badRequest("Current password is incorrect", [
      { field: "currentPassword", message: "Incorrect password" }
    ]);
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed }
  });
}
async function getPublicProfile(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, name: true, profileImage: true, bio: true, role: true }
  });
  if (!user) throw ApiError.notFound("User not found");
  const [totalEvents, ratingAgg] = await Promise.all([
    user.role === "ORGANIZER" ? prisma.event.count({ where: { organizerId: userId, deletedAt: null } }) : 0,
    prisma.review.aggregate({
      where: { event: { organizerId: userId }, deletedAt: null },
      _avg: { rating: true }
    })
  ]);
  return {
    ...user,
    totalEvents,
    averageRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : null
  };
}
var userService = {
  getMe,
  updateMe,
  uploadProfileImage,
  changePassword,
  getPublicProfile
};

// src/modules/user/user.controller.ts
var getMe2 = catchAsync(async (req, res) => {
  const user = await userService.getMe(req.user.id);
  sendSuccess(res, 200, "Profile retrieved successfully", user);
});
var updateMe2 = catchAsync(async (req, res) => {
  const user = await userService.updateMe(req.user.id, req.body);
  sendSuccess(res, 200, "Profile updated successfully", user);
});
var uploadProfileImage2 = catchAsync(async (req, res) => {
  if (!req.file)
    throw ApiError.badRequest("No image file provided", [
      { field: "image", message: "Image is required" }
    ]);
  const profileImage = await userService.uploadProfileImage(
    req.user.id,
    req.file.buffer
  );
  sendSuccess(res, 200, "Profile image updated successfully", { profileImage });
});
var changePassword2 = catchAsync(async (req, res) => {
  await userService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword
  );
  sendSuccess(res, 200, "Password changed successfully", null);
});
var getPublicProfile2 = catchAsync(async (req, res) => {
  const user = await userService.getPublicProfile(req.params.id);
  sendSuccess(res, 200, "User profile retrieved", user);
});
var userController = {
  getMe: getMe2,
  updateMe: updateMe2,
  uploadProfileImage: uploadProfileImage2,
  changePassword: changePassword2,
  getPublicProfile: getPublicProfile2
};

// src/modules/user/user.validation.ts
import { z as z2 } from "zod";
var updateMeSchema = z2.object({
  body: z2.object({
    name: z2.string().min(2).max(50).optional(),
    phone: z2.string().optional(),
    bio: z2.string().max(500).optional(),
    dateOfBirth: z2.coerce.date().optional(),
    notificationPreferences: z2.object({ email: z2.boolean().optional(), sms: z2.boolean().optional() }).optional()
  })
});
var changePasswordSchema = z2.object({
  body: z2.object({
    currentPassword: z2.string().min(1),
    newPassword: z2.string().min(8).regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[a-z]/, "Must contain at least one lowercase letter").regex(/[0-9]/, "Must contain at least one number"),
    confirmNewPassword: z2.string().min(1)
  }).refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"]
  })
});

// src/modules/user/user.route.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});
var router2 = Router2();
router2.get("/me", authenticate, userController.getMe);
router2.patch(
  "/me",
  authenticate,
  validateRequest(updateMeSchema),
  userController.updateMe
);
router2.post(
  "/me/profile-image",
  authenticate,
  upload.single("image"),
  userController.uploadProfileImage
);
router2.patch(
  "/change-password",
  authenticate,
  validateRequest(changePasswordSchema),
  userController.changePassword
);
router2.get("/:id/profile", userController.getPublicProfile);
var userRoutes = router2;

// src/modules/event/event.route.ts
import { Router as Router7 } from "express";

// src/utils/generateCodes.ts
import { customAlphabet } from "nanoid";
var alphanumeric = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
function generateBookingNumber() {
  const datePart = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
  return `BK-${datePart}-${alphanumeric()}`;
}
function generateSlug(title) {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}-${alphanumeric().toLowerCase()}`;
}

// src/types/common.types.ts
function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}
function parsePagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

// src/lib/audit.ts
async function writeAuditLog(input, client = prisma) {
  await client.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: input.oldValues,
      newValues: input.newValues,
      description: input.description,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}

// src/modules/event/event.service.ts
var EVENT_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  category: true,
  venue: true,
  city: true,
  startDate: true,
  bannerImage: true,
  status: true,
  organizer: { select: { id: true, name: true, profileImage: true } },
  ticketTiers: { select: { price: true }, where: { deletedAt: null } }
};
async function getOrganizerId(eventId) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: { organizerId: true }
  });
  return event?.organizerId ?? null;
}
async function createEvent(organizerId, data) {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      subCategory: data.subCategory,
      venue: data.venue,
      address: data.address,
      city: data.city,
      country: data.country,
      isVirtual: data.isVirtual,
      virtualLink: data.virtualLink,
      startDate: data.startDate,
      endDate: data.endDate,
      timezone: data.timezone,
      maxTicketsPerUser: data.maxTicketsPerUser,
      isWaitlistEnabled: data.isWaitlistEnabled,
      allowRefund: data.allowRefund,
      ageRestriction: data.ageRestriction,
      bannerImage: data.bannerImage,
      galleryImages: data.galleryImages,
      additionalInfo: data.additionalInfo,
      slug: generateSlug(data.title),
      organizerId,
      status: "DRAFT"
    }
  });
  await writeAuditLog({
    userId: organizerId,
    action: "CREATE",
    entityType: "Event",
    entityId: event.id,
    newValues: { title: event.title, status: event.status }
  });
  return event;
}
async function listEvents(filters) {
  const { page, limit, skip } = parsePagination(
    filters
  );
  const where = { deletedAt: null };
  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = "PUBLISHED";
  }
  if (filters.category) where.category = filters.category;
  if (filters.subCategory) where.subCategory = filters.subCategory;
  if (filters.city) where.city = { equals: filters.city, mode: "insensitive" };
  if (filters.dateFrom || filters.dateTo) {
    where.startDate = {
      ...filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {},
      ...filters.dateTo ? { lte: new Date(filters.dateTo) } : {}
    };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { venue: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } }
    ];
  }
  const sortBy = filters.sortBy ?? "startDate";
  const sortOrder = filters.sortOrder ?? "asc";
  const [total, events] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      select: EVENT_CARD_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    })
  ]);
  let items = events.map((e) => ({
    ...e,
    lowestPrice: e.ticketTiers.length ? Math.min(...e.ticketTiers.map((t) => Number(t.price))) : null,
    ticketTiers: void 0
  }));
  if (filters.priceMin !== void 0) {
    items = items.filter(
      (e) => e.lowestPrice !== null && e.lowestPrice >= filters.priceMin
    );
  }
  if (filters.priceMax !== void 0) {
    items = items.filter(
      (e) => e.lowestPrice !== null && e.lowestPrice <= filters.priceMax
    );
  }
  return { items, pagination: buildPaginationMeta(total, page, limit) };
}
async function getEventById(id) {
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: {
      organizer: {
        select: { id: true, name: true, profileImage: true, email: true }
      },
      ticketTiers: { where: { deletedAt: null } }
    }
  });
  if (!event) throw ApiError.notFound("Event not found");
  const [bookingCount, reviewAgg] = await Promise.all([
    prisma.booking.count({
      where: { eventId: id, status: { in: ["CONFIRMED", "CHECKED_IN"] } }
    }),
    prisma.review.aggregate({
      where: { eventId: id, deletedAt: null },
      _avg: { rating: true },
      _count: true
    })
  ]);
  const ticketTiers = event.ticketTiers.map((t) => ({
    ...t,
    available: t.quantity - t.sold - t.reserved
  }));
  return {
    ...event,
    ticketTiers,
    statistics: {
      totalBookings: bookingCount,
      averageRating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null,
      totalReviews: reviewAgg._count
    }
  };
}
async function updateEvent(id, data) {
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null }
  });
  if (!event) throw ApiError.notFound("Event not found");
  if (event.startDate.getTime() <= Date.now()) {
    throw ApiError.conflict("Cannot edit an event that has already started");
  }
  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...data,
      additionalInfo: data.additionalInfo
    }
  });
  return updated;
}
async function updateEventStatus(id, status, actorId) {
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null }
  });
  if (!event) throw ApiError.notFound("Event not found");
  const data = {
    status
  };
  if (status === "PUBLISHED") data.publishedAt = /* @__PURE__ */ new Date();
  if (status === "CANCELLED") data.cancelledAt = /* @__PURE__ */ new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.update({ where: { id }, data });
    if (status === "CANCELLED") {
      const affected = await tx.booking.findMany({
        where: { eventId: id, status: { in: ["CONFIRMED", "CHECKED_IN"] } }
      });
      for (const booking of affected) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "REFUNDED",
            refundAmount: booking.finalAmount,
            refundProcessedAt: /* @__PURE__ */ new Date(),
            cancellationReason: "Event cancelled by organizer"
          }
        });
        await writeAuditLog(
          {
            userId: actorId,
            action: "REFUND",
            entityType: "Booking",
            entityId: booking.id,
            newValues: {
              status: "REFUNDED",
              refundAmount: booking.finalAmount
            },
            description: "Auto-refunded due to event cancellation"
          },
          tx
        );
      }
    }
    await writeAuditLog(
      {
        userId: actorId,
        action: "STATUS_CHANGE",
        entityType: "Event",
        entityId: id,
        oldValues: { status: event.status },
        newValues: { status }
      },
      tx
    );
    return ev;
  });
  return updated;
}
async function deleteEvent(id, actorId) {
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null }
  });
  if (!event) throw ApiError.notFound("Event not found");
  const soon = event.startDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1e3;
  const hasActiveBookings = await prisma.booking.count({
    where: {
      eventId: id,
      status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] }
    }
  });
  if (soon && hasActiveBookings > 0) {
    throw ApiError.conflict(
      "Cannot delete an event with active bookings less than 7 days before start \u2014 cancel it instead to trigger refunds",
      "CANCELLATION_NOT_ALLOWED"
    );
  }
  await prisma.event.update({
    where: { id },
    data: { deletedAt: /* @__PURE__ */ new Date(), isActive: false }
  });
  await writeAuditLog({
    userId: actorId,
    action: "SOFT_DELETE",
    entityType: "Event",
    entityId: id
  });
}
var eventService = {
  getOrganizerId,
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent
};

// src/modules/event/event.controller.ts
var createEvent2 = catchAsync(async (req, res) => {
  const event = await eventService.createEvent(req.user.id, req.body);
  sendSuccess(res, 201, "Event created successfully", event);
});
var listEvents2 = catchAsync(async (req, res) => {
  const q = req.query;
  const { items, pagination } = await eventService.listEvents({
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    category: q.category,
    subCategory: q.subCategory,
    city: q.city,
    status: q.status,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    priceMin: q.priceMin ? Number(q.priceMin) : void 0,
    priceMax: q.priceMax ? Number(q.priceMax) : void 0,
    search: q.search
  });
  sendPaginated(res, "Events retrieved successfully", items, pagination);
});
var getEvent = catchAsync(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  sendSuccess(res, 200, "Event details retrieved", event);
});
var updateEvent2 = catchAsync(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body);
  sendSuccess(res, 200, "Event updated successfully", event);
});
var updateEventStatus2 = catchAsync(async (req, res) => {
  const event = await eventService.updateEventStatus(
    req.params.id,
    req.body.status,
    req.user.id
  );
  sendSuccess(res, 200, "Event status updated successfully", event);
});
var deleteEvent2 = catchAsync(async (req, res) => {
  await eventService.deleteEvent(req.params.id, req.user.id);
  res.status(204).send();
});
var eventController = {
  createEvent: createEvent2,
  listEvents: listEvents2,
  getEvent,
  updateEvent: updateEvent2,
  updateEventStatus: updateEventStatus2,
  deleteEvent: deleteEvent2
};

// src/middlewares/authorize.ts
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}

// src/middlewares/isResourceOwner.ts
function isResourceOwner(getOwnerId) {
  return catchAsync(
    async (req, _res, next) => {
      if (!req.user) return next(ApiError.unauthorized());
      if (req.user.role === "ADMIN") return next();
      const ownerId = await getOwnerId(req);
      if (!ownerId) return next(ApiError.notFound());
      if (ownerId !== req.user.id)
        return next(ApiError.forbidden("You do not own this resource"));
      next();
    }
  );
}

// src/modules/event/event.validation.ts
import { z as z3 } from "zod";
var eventStatuses = [
  "DRAFT",
  "PUBLISHED",
  "CANCELLED",
  "COMPLETED",
  "POSTPONED"
];
var createEventSchema = z3.object({
  body: z3.object({
    title: z3.string().min(5).max(200),
    description: z3.string().min(50).max(5e3),
    category: z3.string().min(2),
    subCategory: z3.string().optional(),
    venue: z3.string().min(2),
    address: z3.string().min(2),
    city: z3.string().min(2),
    country: z3.string().min(2),
    isVirtual: z3.boolean().optional().default(false),
    virtualLink: z3.string().url().optional(),
    startDate: z3.coerce.date(),
    endDate: z3.coerce.date(),
    timezone: z3.string().optional(),
    maxTicketsPerUser: z3.number().int().positive().optional(),
    isWaitlistEnabled: z3.boolean().optional(),
    allowRefund: z3.boolean().optional(),
    ageRestriction: z3.number().int().positive().optional(),
    bannerImage: z3.string().url().optional(),
    galleryImages: z3.array(z3.string().url()).optional(),
    additionalInfo: z3.record(z3.unknown()).optional()
  }).refine((d) => d.startDate.getTime() > Date.now(), {
    message: "startDate must be in the future",
    path: ["startDate"]
  }).refine((d) => d.endDate.getTime() > d.startDate.getTime(), {
    message: "endDate must be after startDate",
    path: ["endDate"]
  })
});
var updateEventSchema = z3.object({
  body: z3.object({
    title: z3.string().min(5).max(200).optional(),
    description: z3.string().min(50).max(5e3).optional(),
    category: z3.string().min(2).optional(),
    subCategory: z3.string().optional(),
    venue: z3.string().min(2).optional(),
    address: z3.string().min(2).optional(),
    city: z3.string().min(2).optional(),
    country: z3.string().min(2).optional(),
    startDate: z3.coerce.date().optional(),
    endDate: z3.coerce.date().optional(),
    allowRefund: z3.boolean().optional(),
    bannerImage: z3.string().url().optional(),
    galleryImages: z3.array(z3.string().url()).optional(),
    additionalInfo: z3.record(z3.unknown()).optional()
  })
});
var updateEventStatusSchema = z3.object({
  body: z3.object({
    status: z3.enum(eventStatuses)
  })
});
var listEventsQuerySchema = z3.object({
  query: z3.object({
    page: z3.string().optional(),
    limit: z3.string().optional(),
    category: z3.string().optional(),
    subCategory: z3.string().optional(),
    city: z3.string().optional(),
    status: z3.enum(eventStatuses).optional(),
    sortBy: z3.string().optional(),
    sortOrder: z3.enum(["asc", "desc"]).optional(),
    dateFrom: z3.string().optional(),
    dateTo: z3.string().optional(),
    priceMin: z3.string().optional(),
    priceMax: z3.string().optional(),
    search: z3.string().optional()
  })
});

// src/modules/ticketTier/ticketTier.route.ts
import { Router as Router3 } from "express";

// src/modules/ticketTier/ticketTier.service.ts
function withAvailable(tier) {
  return { ...tier, available: tier.quantity - tier.sold - tier.reserved };
}
async function getEventOwnerId(eventId) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: { organizerId: true }
  });
  return event?.organizerId ?? null;
}
async function getTierOwnerId(tierId) {
  const tier = await prisma.ticketTier.findFirst({
    where: { id: tierId, deletedAt: null },
    select: { event: { select: { organizerId: true } } }
  });
  return tier?.event.organizerId ?? null;
}
async function createTicketTier(eventId, actorId, data) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null }
  });
  if (!event) throw ApiError.notFound("Event not found");
  const tier = await prisma.ticketTier.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      quantity: data.quantity,
      minPurchase: data.minPurchase,
      maxPurchase: data.maxPurchase,
      saleStartDate: data.saleStartDate,
      saleEndDate: data.saleEndDate,
      includes: data.includes,
      eventId
    }
  });
  await writeAuditLog({
    userId: actorId,
    action: "CREATE",
    entityType: "TicketTier",
    entityId: tier.id,
    newValues: data
  });
  return withAvailable(tier);
}
async function listTicketTiers(eventId) {
  const tiers = await prisma.ticketTier.findMany({
    where: { eventId, deletedAt: null },
    orderBy: { createdAt: "asc" }
  });
  return tiers.map(withAvailable);
}
async function updateTicketTier(tierId, actorId, data) {
  const tier = await prisma.ticketTier.findFirst({
    where: { id: tierId, deletedAt: null }
  });
  if (!tier) throw ApiError.notFound("Ticket tier not found");
  if (data.quantity !== void 0) {
    const committed = tier.sold + tier.reserved;
    if (data.quantity < committed) {
      throw ApiError.unprocessable(
        `Cannot reduce quantity below ${committed} tickets already sold or reserved`,
        "QUANTITY_BELOW_COMMITTED"
      );
    }
  }
  const updated = await prisma.ticketTier.update({
    where: { id: tierId },
    data
  });
  await writeAuditLog({
    userId: actorId,
    action: "UPDATE",
    entityType: "TicketTier",
    entityId: tierId,
    oldValues: tier,
    newValues: data
  });
  return withAvailable(updated);
}
var ticketTierService = {
  getEventOwnerId,
  getTierOwnerId,
  createTicketTier,
  listTicketTiers,
  updateTicketTier
};

// src/modules/ticketTier/ticketTier.controller.ts
var createTicketTier2 = catchAsync(async (req, res) => {
  const tier = await ticketTierService.createTicketTier(
    req.params.eventId,
    req.user.id,
    req.body
  );
  sendSuccess(res, 201, "Ticket tier added successfully", tier);
});
var listTicketTiers2 = catchAsync(async (req, res) => {
  const tiers = await ticketTierService.listTicketTiers(req.params.eventId);
  sendSuccess(res, 200, "Ticket tiers retrieved", { items: tiers });
});
var updateTicketTier2 = catchAsync(async (req, res) => {
  const tier = await ticketTierService.updateTicketTier(
    req.params.id,
    req.user.id,
    req.body
  );
  sendSuccess(res, 200, "Ticket tier updated successfully", tier);
});
var ticketTierController = {
  createTicketTier: createTicketTier2,
  listTicketTiers: listTicketTiers2,
  updateTicketTier: updateTicketTier2
};

// src/modules/ticketTier/ticketTier.validation.ts
import { z as z4 } from "zod";
var createTicketTierSchema = z4.object({
  body: z4.object({
    name: z4.string().min(2).max(50),
    description: z4.string().max(500).optional(),
    price: z4.number().nonnegative(),
    quantity: z4.number().int().positive(),
    minPurchase: z4.number().int().positive().optional(),
    maxPurchase: z4.number().int().positive().optional(),
    saleStartDate: z4.coerce.date().optional(),
    saleEndDate: z4.coerce.date().optional(),
    includes: z4.array(z4.string()).optional()
  })
});
var updateTicketTierSchema = z4.object({
  body: z4.object({
    name: z4.string().min(2).max(50).optional(),
    description: z4.string().max(500).optional(),
    price: z4.number().nonnegative().optional(),
    quantity: z4.number().int().positive().optional(),
    minPurchase: z4.number().int().positive().optional(),
    maxPurchase: z4.number().int().positive().optional(),
    saleStartDate: z4.coerce.date().optional(),
    saleEndDate: z4.coerce.date().optional(),
    status: z4.enum(["ACTIVE", "SOLD_OUT", "PAUSED"]).optional(),
    includes: z4.array(z4.string()).optional()
  })
});

// src/modules/ticketTier/ticketTier.route.ts
var router3 = Router3({ mergeParams: true });
var ownsEvent = isResourceOwner(
  (req) => ticketTierService.getEventOwnerId(req.params.eventId)
);
var ownsTier = isResourceOwner(
  (req) => ticketTierService.getTierOwnerId(req.params.id)
);
router3.post(
  "/",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsEvent,
  validateRequest(createTicketTierSchema),
  ticketTierController.createTicketTier
);
router3.get("/", ticketTierController.listTicketTiers);
var ticketTierRoutes = router3;
var flatRouter = Router3();
flatRouter.patch(
  "/:id",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsTier,
  validateRequest(updateTicketTierSchema),
  ticketTierController.updateTicketTier
);
var ticketTierFlatRoutes = flatRouter;

// src/modules/waitlist/waitlist.route.ts
import { Router as Router4 } from "express";

// src/modules/waitlist/waitlist.service.ts
async function getEventOwnerId2(eventId) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: { organizerId: true }
  });
  return event?.organizerId ?? null;
}
async function getWaitlistOwnerId(waitlistId) {
  const entry = await prisma.waitlist.findFirst({
    where: { id: waitlistId, deletedAt: null },
    select: { userId: true }
  });
  return entry?.userId ?? null;
}
async function joinWaitlist(eventId, userId, ticketTierId, quantity) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null }
  });
  if (!event) throw ApiError.notFound("Event not found");
  if (!event.isWaitlistEnabled)
    throw ApiError.unprocessable("Waitlist is not enabled for this event");
  const tier = await prisma.ticketTier.findFirst({
    where: { id: ticketTierId, eventId, deletedAt: null }
  });
  if (!tier) throw ApiError.notFound("Ticket tier not found");
  const available = tier.quantity - tier.sold - tier.reserved;
  if (available > 0)
    throw ApiError.unprocessable(
      "This tier is not sold out \u2014 book directly instead",
      "TIER_NOT_SOLD_OUT"
    );
  const position = await prisma.waitlist.count({
    where: { eventId, ticketTierId, status: "WAITING" }
  }) + 1;
  const entry = await prisma.waitlist.create({
    data: { eventId, userId, ticketTierId, quantity, status: "WAITING" }
  });
  await writeAuditLog({
    userId,
    action: "CREATE",
    entityType: "Waitlist",
    entityId: entry.id
  });
  return {
    id: entry.id,
    position,
    status: entry.status,
    createdAt: entry.createdAt
  };
}
async function getEventWaitlist(eventId) {
  const entries = await prisma.waitlist.findMany({
    where: { eventId, deletedAt: null },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" }
  });
  let position = 0;
  const items = entries.map((e) => ({
    id: e.id,
    user: e.user,
    quantity: e.quantity,
    status: e.status,
    position: e.status === "WAITING" ? ++position : null,
    createdAt: e.createdAt
  }));
  return { items, total: items.length };
}
async function leaveWaitlist(waitlistId, userId) {
  const entry = await prisma.waitlist.findFirst({
    where: { id: waitlistId, deletedAt: null }
  });
  if (!entry) throw ApiError.notFound("Waitlist entry not found");
  if (entry.userId !== userId) throw ApiError.forbidden();
  await prisma.waitlist.update({
    where: { id: waitlistId },
    data: { status: "CANCELLED", deletedAt: /* @__PURE__ */ new Date() }
  });
}
async function offerNextWaitlistEntry(eventId, ticketTierId, freedQuantity) {
  const candidate = await prisma.waitlist.findFirst({
    where: {
      eventId,
      ticketTierId,
      status: "WAITING",
      quantity: { lte: freedQuantity }
    },
    orderBy: { createdAt: "asc" }
  });
  if (!candidate) return;
  const offerExpiresAt = new Date(
    Date.now() + env.waitlistOfferHours * 60 * 60 * 1e3
  );
  await prisma.$transaction(async (tx) => {
    await tx.ticketTier.update({
      where: { id: ticketTierId },
      data: { reserved: { increment: candidate.quantity } }
    });
    await tx.waitlist.update({
      where: { id: candidate.id },
      data: { status: "NOTIFIED", notifiedAt: /* @__PURE__ */ new Date(), offerExpiresAt }
    });
    await tx.notification.create({
      data: {
        userId: candidate.userId,
        type: "WAITLIST_OFFER",
        title: "A ticket just opened up!",
        message: `A spot is available for your waitlisted event. You have ${env.waitlistOfferHours} hour(s) to book before it is offered to the next person in line.`,
        data: { eventId, ticketTierId, waitlistId: candidate.id }
      }
    });
  });
}
async function expireLapsedWaitlistOffers() {
  const lapsed = await prisma.waitlist.findMany({
    where: { status: "NOTIFIED", offerExpiresAt: { lt: /* @__PURE__ */ new Date() } }
  });
  for (const entry of lapsed) {
    await prisma.$transaction(async (tx) => {
      await tx.ticketTier.update({
        where: { id: entry.ticketTierId },
        data: { reserved: { decrement: entry.quantity } }
      });
      await tx.waitlist.update({
        where: { id: entry.id },
        data: { status: "EXPIRED", expiredAt: /* @__PURE__ */ new Date() }
      });
    });
    await offerNextWaitlistEntry(
      entry.eventId,
      entry.ticketTierId,
      entry.quantity
    );
  }
  return lapsed.length;
}
var waitlistService = {
  getEventOwnerId: getEventOwnerId2,
  getWaitlistOwnerId,
  joinWaitlist,
  getEventWaitlist,
  leaveWaitlist,
  offerNextWaitlistEntry,
  expireLapsedWaitlistOffers
};

// src/modules/waitlist/waitlist.controller.ts
var joinWaitlist2 = catchAsync(async (req, res) => {
  const result = await waitlistService.joinWaitlist(
    req.params.eventId,
    req.user.id,
    req.body.ticketTierId,
    req.body.quantity
  );
  sendSuccess(res, 201, "Added to waitlist successfully", result);
});
var getEventWaitlist2 = catchAsync(async (req, res) => {
  const result = await waitlistService.getEventWaitlist(req.params.eventId);
  sendSuccess(res, 200, "Waitlist retrieved", result);
});
var leaveWaitlist2 = catchAsync(async (req, res) => {
  await waitlistService.leaveWaitlist(req.params.id, req.user.id);
  sendSuccess(res, 200, "Removed from waitlist successfully", null);
});
var waitlistController = {
  joinWaitlist: joinWaitlist2,
  getEventWaitlist: getEventWaitlist2,
  leaveWaitlist: leaveWaitlist2
};

// src/modules/waitlist/waitlist.validation.ts
import { z as z5 } from "zod";
var joinWaitlistSchema = z5.object({
  body: z5.object({
    ticketTierId: z5.string().min(1),
    quantity: z5.number().int().positive().max(20)
  })
});

// src/modules/waitlist/waitlist.route.ts
var router4 = Router4({ mergeParams: true });
var ownsEvent2 = isResourceOwner(
  (req) => waitlistService.getEventOwnerId(req.params.eventId)
);
router4.post(
  "/",
  authenticate,
  authorize("ATTENDEE", "ORGANIZER"),
  validateRequest(joinWaitlistSchema),
  waitlistController.joinWaitlist
);
router4.get(
  "/",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsEvent2,
  waitlistController.getEventWaitlist
);
var waitlistRoutes = router4;
var flatRouter2 = Router4();
flatRouter2.delete("/:id", authenticate, waitlistController.leaveWaitlist);
var waitlistFlatRoutes = flatRouter2;

// src/modules/review/review.route.ts
import { Router as Router5 } from "express";

// src/modules/review/review.service.ts
async function getReviewEventOwnerId(reviewId) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, deletedAt: null },
    select: { event: { select: { organizerId: true } } }
  });
  return review?.event.organizerId ?? null;
}
async function createReview(eventId, userId, bookingId, rating, comment) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null }
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.userId !== userId)
    throw ApiError.forbidden("This is not your booking");
  if (booking.eventId !== eventId)
    throw ApiError.badRequest("Booking does not belong to this event");
  if (booking.status !== "CHECKED_IN") {
    throw ApiError.forbidden(
      "You can only review an event after checking in to it"
    );
  }
  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing)
    throw ApiError.conflict("This booking has already been reviewed");
  const review = await prisma.review.create({
    data: { userId, eventId, bookingId, rating, comment }
  });
  await writeAuditLog({
    userId,
    action: "CREATE",
    entityType: "Review",
    entityId: review.id
  });
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt
  };
}
async function getEventReviews(eventId, filters) {
  const { page, limit, skip } = parsePagination(
    filters
  );
  const where = {
    eventId,
    deletedAt: null,
    isHidden: false
  };
  if (filters.rating) where.rating = filters.rating;
  const [total, reviews, statsAgg, distribution] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, profileImage: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.review.aggregate({
      where: { eventId, deletedAt: null, isHidden: false },
      _avg: { rating: true },
      _count: true
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { eventId, deletedAt: null, isHidden: false },
      _count: true
    })
  ]);
  const ratingDistribution = {
    "5": 0,
    "4": 0,
    "3": 0,
    "2": 0,
    "1": 0
  };
  for (const row of distribution)
    ratingDistribution[String(row.rating)] = row._count;
  return {
    items: reviews,
    statistics: {
      averageRating: statsAgg._avg.rating ? Number(statsAgg._avg.rating.toFixed(1)) : null,
      totalReviews: statsAgg._count,
      ratingDistribution
    },
    pagination: buildPaginationMeta(total, page, limit)
  };
}
async function respondToReview(reviewId, response) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, deletedAt: null }
  });
  if (!review) throw ApiError.notFound("Review not found");
  if (review.organizerResponse)
    throw ApiError.conflict("This review already has a response");
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { organizerResponse: response, responseDate: /* @__PURE__ */ new Date() }
  });
  return {
    id: updated.id,
    organizerResponse: updated.organizerResponse,
    responseDate: updated.responseDate
  };
}
var reviewService = {
  getReviewEventOwnerId,
  createReview,
  getEventReviews,
  respondToReview
};

// src/modules/review/review.controller.ts
var createReview2 = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(
    req.params.eventId,
    req.user.id,
    req.body.bookingId,
    req.body.rating,
    req.body.comment
  );
  sendSuccess(res, 201, "Review submitted successfully", review);
});
var getEventReviews2 = catchAsync(async (req, res) => {
  const q = req.query;
  const { items, statistics, pagination } = await reviewService.getEventReviews(
    req.params.eventId,
    {
      page: Number(q.page) || 1,
      limit: Number(q.limit) || 10,
      rating: q.rating ? Number(q.rating) : void 0
    }
  );
  sendPaginated(res, "Reviews retrieved", items, pagination, { statistics });
});
var respondToReview2 = catchAsync(async (req, res) => {
  const result = await reviewService.respondToReview(
    req.params.id,
    req.body.response
  );
  sendSuccess(res, 200, "Response added successfully", result);
});
var reviewController = {
  createReview: createReview2,
  getEventReviews: getEventReviews2,
  respondToReview: respondToReview2
};

// src/modules/review/review.validation.ts
import { z as z6 } from "zod";
var createReviewSchema = z6.object({
  body: z6.object({
    bookingId: z6.string().min(1),
    rating: z6.number().int().min(1).max(5),
    comment: z6.string().max(2e3).optional()
  })
});
var respondToReviewSchema = z6.object({
  body: z6.object({
    response: z6.string().min(2).max(1e3)
  })
});
var listReviewsQuerySchema = z6.object({
  query: z6.object({
    page: z6.string().optional(),
    limit: z6.string().optional(),
    rating: z6.string().optional()
  })
});

// src/modules/review/review.route.ts
var router5 = Router5({ mergeParams: true });
router5.post(
  "/",
  authenticate,
  authorize("ATTENDEE"),
  validateRequest(createReviewSchema),
  reviewController.createReview
);
router5.get("/", reviewController.getEventReviews);
var reviewRoutes = router5;
var flatRouter3 = Router5();
var ownsReviewEvent = isResourceOwner(
  (req) => reviewService.getReviewEventOwnerId(req.params.id)
);
flatRouter3.post(
  "/:id/respond",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsReviewEvent,
  validateRequest(respondToReviewSchema),
  reviewController.respondToReview
);
var reviewFlatRoutes = flatRouter3;

// src/modules/booking/booking.route.ts
import { Router as Router6 } from "express";

// src/modules/coupon/coupon.service.ts
async function validateAndPriceCoupon(tx, code, userId, totalPrice) {
  const coupon = await tx.coupon.findFirst({
    where: { code, deletedAt: null }
  });
  if (!coupon || !coupon.isActive)
    throw ApiError.badRequest("Coupon is invalid or expired", [
      { field: "couponCode", message: "Invalid coupon" }
    ]);
  const now = /* @__PURE__ */ new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new ApiError(400, "Coupon is expired or invalid", "INVALID_COUPON");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached", "INVALID_COUPON");
  }
  if (coupon.minPurchase && totalPrice < Number(coupon.minPurchase)) {
    throw new ApiError(
      400,
      `Coupon requires a minimum purchase of ${coupon.minPurchase}`,
      "INVALID_COUPON"
    );
  }
  const priorUses = await tx.booking.count({
    where: {
      userId,
      couponCode: code,
      status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] }
    }
  });
  if (priorUses >= coupon.perUserLimit) {
    throw new ApiError(
      400,
      "You have already used this coupon",
      "INVALID_COUPON"
    );
  }
  let discountAmount = coupon.discountType === "PERCENTAGE" ? totalPrice * Number(coupon.discountValue) / 100 : Number(coupon.discountValue);
  if (coupon.maxDiscount)
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
  discountAmount = Math.min(discountAmount, totalPrice);
  return { coupon, discountAmount };
}
async function previewCoupon(code, userId, eventId, ticketTierId, quantity) {
  const tier = await prisma.ticketTier.findFirst({
    where: { id: ticketTierId, eventId, deletedAt: null }
  });
  if (!tier) throw ApiError.notFound("Ticket tier not found");
  const totalPrice = Number(tier.price) * quantity;
  const { coupon, discountAmount } = await validateAndPriceCoupon(
    prisma,
    code,
    userId,
    totalPrice
  );
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    discountedAmount: discountAmount,
    finalAmount: totalPrice - discountAmount
  };
}
async function createCoupon(actorId, data) {
  const coupon = await prisma.coupon.create({ data });
  await writeAuditLog({
    userId: actorId,
    action: "COUPON_CREATE",
    entityType: "Coupon",
    entityId: coupon.id,
    newValues: data
  });
  return {
    id: coupon.id,
    code: coupon.code,
    discountValue: Number(coupon.discountValue),
    isActive: coupon.isActive,
    createdAt: coupon.createdAt
  };
}
var couponService = {
  validateAndPriceCoupon,
  previewCoupon,
  createCoupon
};

// src/modules/booking/booking.constant.ts
var REFUND_POLICY = [
  { minHoursBeforeStart: 24 * 7, refundPercent: 100 },
  { minHoursBeforeStart: 24, refundPercent: 50 },
  { minHoursBeforeStart: 0, refundPercent: 0 }
];
function getRefundPercent(hoursUntilStart) {
  for (const tier of REFUND_POLICY) {
    if (hoursUntilStart >= tier.minHoursBeforeStart) return tier.refundPercent;
  }
  return 0;
}
var BOOKING_INCLUDE = {
  event: {
    select: {
      id: true,
      title: true,
      venue: true,
      startDate: true,
      endDate: true,
      bannerImage: true,
      organizerId: true,
      allowRefund: true,
      isWaitlistEnabled: true
    }
  },
  ticketTier: { select: { id: true, name: true, price: true } },
  payment: { select: { method: true, status: true, transactionId: true } }
};

// src/modules/booking/booking.service.ts
async function getBookingOwnerId(bookingId) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    select: { userId: true }
  });
  return booking?.userId ?? null;
}
async function getBookingEventOwnerId(bookingId) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    select: { event: { select: { organizerId: true } } }
  });
  return booking?.event.organizerId ?? null;
}
async function createBooking(eventId, userId, input) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null }
  });
  if (!event) throw ApiError.notFound("Event not found");
  if (event.status !== "PUBLISHED")
    throw ApiError.unprocessable("Event is not open for booking");
  const booking = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      UPDATE "TicketTier"
      SET reserved = reserved + ${input.quantity}
      WHERE id = ${input.ticketTierId}
        AND "deletedAt" IS NULL
        AND (quantity - sold - reserved) >= ${input.quantity}
      RETURNING id, "eventId", price, quantity, sold, reserved, "minPurchase", "maxPurchase", "saleStartDate", "saleEndDate", status
    `;
    if (rows.length === 0) {
      const tier2 = await tx.ticketTier.findFirst({
        where: { id: input.ticketTierId, deletedAt: null }
      });
      if (!tier2) throw ApiError.notFound("Ticket tier not found");
      const available = tier2.quantity - tier2.sold - tier2.reserved;
      throw new ApiError(
        409,
        "Not enough tickets available",
        "INSUFFICIENT_TICKETS",
        [
          {
            field: input.ticketTierId,
            message: `Only ${available} ticket(s) remaining`
          }
        ]
      );
    }
    const tier = rows[0];
    if (tier.eventId !== eventId)
      throw ApiError.badRequest("Ticket tier does not belong to this event");
    const now = /* @__PURE__ */ new Date();
    if (tier.saleStartDate && now < tier.saleStartDate || tier.saleEndDate && now > tier.saleEndDate) {
      throw ApiError.unprocessable(
        "Ticket sales are not currently open for this tier",
        "SALES_CLOSED"
      );
    }
    if (input.quantity < tier.minPurchase || input.quantity > tier.maxPurchase) {
      throw ApiError.badRequest(
        `Quantity must be between ${tier.minPurchase} and ${tier.maxPurchase} for this tier`
      );
    }
    const existingAgg = await tx.booking.aggregate({
      where: {
        userId,
        eventId,
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] }
      },
      _sum: { quantity: true }
    });
    const alreadyHeld = existingAgg._sum.quantity ?? 0;
    if (alreadyHeld + input.quantity > event.maxTicketsPerUser) {
      throw ApiError.unprocessable(
        `You can book at most ${event.maxTicketsPerUser} tickets for this event`,
        "MAX_TICKETS_EXCEEDED"
      );
    }
    const unitPrice = Number(tier.price);
    const totalPrice = unitPrice * input.quantity;
    let discountAmount = 0;
    if (input.couponCode) {
      const couponResult = await validateAndPriceCoupon(
        tx,
        input.couponCode,
        userId,
        totalPrice
      );
      discountAmount = couponResult.discountAmount;
      await tx.coupon.update({
        where: { id: couponResult.coupon.id },
        data: { usedCount: { increment: 1 } }
      });
    }
    const finalAmount = totalPrice - discountAmount;
    const expiresAt = new Date(Date.now() + env.bookingHoldMinutes * 60 * 1e3);
    const created = await tx.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId,
        eventId,
        ticketTierId: input.ticketTierId,
        quantity: input.quantity,
        unitPrice,
        totalPrice,
        discountAmount,
        finalAmount,
        couponCode: input.couponCode,
        specialRequests: input.specialRequests,
        dietaryNeeds: input.dietaryNeeds,
        status: "PENDING",
        expiresAt
      }
    });
    await writeAuditLog(
      {
        userId,
        action: "CREATE",
        entityType: "Booking",
        entityId: created.id,
        newValues: { quantity: input.quantity, finalAmount }
      },
      tx
    );
    return created;
  });
  return booking;
}
async function listMyBookings(userId, filters) {
  const { page, limit, skip } = parsePagination(
    filters
  );
  const where = { userId, deletedAt: null };
  if (filters.status)
    where.status = filters.status;
  if (filters.eventId) where.eventId = filters.eventId;
  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: BOOKING_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);
  return {
    items: bookings,
    pagination: buildPaginationMeta(total, page, limit)
  };
}
function assertCanAccessBooking(booking, actor) {
  if (actor.role === "ADMIN") return;
  if (booking.userId === actor.id) return;
  if (booking.event.organizerId === actor.id) return;
  throw ApiError.forbidden("You do not have access to this booking");
}
async function getBookingById(bookingId, actor) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: BOOKING_INCLUDE
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  assertCanAccessBooking(booking, actor);
  return booking;
}
async function cancelBooking(bookingId, actor, reason) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: { event: true }
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  assertCanAccessBooking(booking, actor);
  const actorId = actor.id;
  if (booking.status === "CHECKED_IN") {
    throw new ApiError(
      409,
      "Cannot cancel a booking that has already been checked in",
      "CANCELLATION_NOT_ALLOWED"
    );
  }
  if (["CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED", "EXPIRED"].includes(
    booking.status
  )) {
    throw new ApiError(
      409,
      "Booking is already cancelled",
      "CANCELLATION_NOT_ALLOWED"
    );
  }
  if (booking.event.startDate.getTime() <= Date.now()) {
    throw new ApiError(
      409,
      "Cannot cancel \u2014 the event has already started",
      "CANCELLATION_NOT_ALLOWED"
    );
  }
  let refundPercent = 100;
  if (!booking.event.allowRefund) {
    refundPercent = 0;
  } else {
    const hoursUntilStart = (booking.event.startDate.getTime() - Date.now()) / (1e3 * 60 * 60);
    refundPercent = getRefundPercent(hoursUntilStart);
  }
  const refundAmount = Number(booking.finalAmount) * (refundPercent / 100);
  const newStatus = refundPercent === 100 ? "REFUNDED" : refundPercent > 0 ? "PARTIALLY_REFUNDED" : "CANCELLED";
  const wasConfirmed = booking.status === "CONFIRMED";
  const wasPending = booking.status === "PENDING";
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        cancelledAt: /* @__PURE__ */ new Date(),
        cancellationReason: reason,
        refundAmount,
        refundProcessedAt: refundAmount > 0 ? /* @__PURE__ */ new Date() : null
      }
    });
    if (wasPending) {
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: { reserved: { decrement: booking.quantity } }
      });
    } else if (wasConfirmed) {
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: { sold: { decrement: booking.quantity } }
      });
    }
    await writeAuditLog(
      {
        userId: actorId,
        action: "CANCEL",
        entityType: "Booking",
        entityId: bookingId,
        newValues: { status: newStatus, refundAmount }
      },
      tx
    );
  });
  if (booking.event.isWaitlistEnabled && (wasConfirmed || wasPending)) {
    await offerNextWaitlistEntry(
      booking.eventId,
      booking.ticketTierId,
      booking.quantity
    ).catch(() => void 0);
  }
  return {
    id: bookingId,
    status: newStatus,
    refundAmount,
    refundPolicy: refundPercent === 100 ? "FULL_REFUND" : refundPercent > 0 ? "PARTIAL_REFUND" : "NO_REFUND",
    cancelledAt: /* @__PURE__ */ new Date()
  };
}
async function checkIn(bookingId, actorId, qrCode) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: {
      user: { select: { name: true } },
      ticketTier: { select: { name: true } }
    }
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.bookingNumber !== qrCode) {
    throw ApiError.badRequest("QR code does not match this booking");
  }
  if (booking.status === "CHECKED_IN") {
    throw new ApiError(
      409,
      `Ticket already checked in at ${booking.checkedInAt?.toISOString()}`,
      "ALREADY_CHECKED_IN"
    );
  }
  if (booking.status !== "CONFIRMED") {
    throw ApiError.unprocessable(
      "Booking is not in a confirmed state and cannot be checked in"
    );
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CHECKED_IN",
      checkedInAt: /* @__PURE__ */ new Date(),
      checkedInBy: actorId
    }
  });
  await writeAuditLog({
    userId: actorId,
    action: "CHECK_IN",
    entityType: "Booking",
    entityId: bookingId
  });
  return {
    bookingId: updated.id,
    checkedInAt: updated.checkedInAt,
    attendeeName: booking.user.name,
    ticketTierName: booking.ticketTier.name,
    quantity: updated.quantity
  };
}
async function expireStalePendingBookings() {
  const stale = await prisma.booking.findMany({
    where: { status: "PENDING", expiresAt: { lt: /* @__PURE__ */ new Date() } }
  });
  for (const booking of stale) {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "EXPIRED" }
      });
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: { reserved: { decrement: booking.quantity } }
      });
    });
  }
  return stale.length;
}
var bookingService = {
  getBookingOwnerId,
  getBookingEventOwnerId,
  createBooking,
  listMyBookings,
  getBookingById,
  cancelBooking,
  checkIn,
  expireStalePendingBookings
};

// src/config/stripe.ts
import Stripe from "stripe";
var stripe = env.stripe.secretKey ? new Stripe(env.stripe.secretKey, { apiVersion: "2024-06-20" }) : null;

// src/modules/payment/payment.service.ts
function buildMockPaymentUrl(bookingId) {
  return `http://localhost:${env.port}/api/${env.apiVersion}/payments/mock-confirm/${bookingId}`;
}
async function initiatePayment(bookingId, userId, method) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: { payment: true }
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.userId !== userId)
    throw ApiError.forbidden("You do not own this booking");
  if (booking.status !== "PENDING")
    throw ApiError.unprocessable("This booking is not awaiting payment");
  if (booking.payment && booking.payment.status === "INITIATED") {
    const raw4 = booking.payment.rawResponse;
    return {
      paymentId: booking.payment.id,
      amount: Number(booking.payment.amount),
      method: booking.payment.method,
      status: booking.payment.status,
      paymentUrl: raw4?.paymentUrl ?? buildMockPaymentUrl(bookingId),
      expiresAt: booking.expiresAt
    };
  }
  let paymentUrl;
  let transactionId;
  let rawResponse = {};
  if (env.stripe.secretKey && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Booking ${booking.bookingNumber}` },
            unit_amount: Math.round(Number(booking.finalAmount) * 100)
          },
          quantity: 1
        }
      ],
      metadata: { bookingId: booking.id },
      success_url: `${env.clientUrl}/payment/success?bookingId=${booking.id}`,
      cancel_url: `${env.clientUrl}/payment/cancel?bookingId=${booking.id}`
    });
    paymentUrl = session.url ?? "";
    transactionId = session.id;
    rawResponse = { sessionId: session.id, paymentUrl };
  } else {
    paymentUrl = buildMockPaymentUrl(bookingId);
    rawResponse = { mock: true, paymentUrl };
  }
  const payment = await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      userId,
      amount: booking.finalAmount,
      method,
      transactionId,
      status: "INITIATED",
      rawResponse
    },
    update: { method, transactionId, status: "INITIATED", rawResponse }
  });
  await writeAuditLog({
    userId,
    action: "PAYMENT_INITIATE",
    entityType: "Payment",
    entityId: payment.id
  });
  return {
    paymentId: payment.id,
    amount: Number(payment.amount),
    method: payment.method,
    status: payment.status,
    paymentUrl,
    expiresAt: booking.expiresAt
  };
}
async function processPaymentOutcome(bookingId, success, transactionId, rawResponse) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    include: { payment: true }
  });
  if (!booking || !booking.payment)
    throw ApiError.notFound("Booking or payment not found");
  if (booking.status !== "PENDING") return;
  await prisma.$transaction(async (tx) => {
    if (success) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "SUCCESS",
          transactionId,
          rawResponse
        }
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" }
      });
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: {
          reserved: { decrement: booking.quantity },
          sold: { increment: booking.quantity }
        }
      });
      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_CONFIRMATION",
          title: "Booking Confirmed",
          message: `Your booking ${booking.bookingNumber} has been confirmed.`,
          data: { bookingId }
        }
      });
      await writeAuditLog(
        {
          userId: booking.userId,
          action: "PAYMENT_SUCCESS",
          entityType: "Payment",
          entityId: booking.payment.id
        },
        tx
      );
    } else {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "FAILED",
          failureReason: "Payment failed or was cancelled"
        }
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED", cancellationReason: "Payment failed" }
      });
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: { reserved: { decrement: booking.quantity } }
      });
      await writeAuditLog(
        {
          userId: booking.userId,
          action: "PAYMENT_FAILED",
          entityType: "Payment",
          entityId: booking.payment.id
        },
        tx
      );
    }
  });
}
async function handleStripeWebhook(rawBody, signature) {
  if (!stripe || !env.stripe.webhookSecret) {
    throw ApiError.badRequest("Stripe is not configured on this server");
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.stripe.webhookSecret
    );
  } catch {
    throw ApiError.badRequest("Invalid webhook signature");
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    if (bookingId)
      await processPaymentOutcome(
        bookingId,
        true,
        session.payment_intent ?? session.id,
        session
      );
  } else if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
    const obj = event.data.object;
    const bookingId = obj.metadata?.bookingId;
    if (bookingId)
      await processPaymentOutcome(bookingId, false, void 0, obj);
  }
}
async function mockConfirmPayment(bookingId) {
  if (env.stripe.secretKey) {
    throw ApiError.badRequest(
      "Mock confirmation is disabled when Stripe is configured"
    );
  }
  await processPaymentOutcome(bookingId, true, `mock_${bookingId}`, {
    mock: true
  });
}
async function getPaymentStatus(paymentId, actor) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, deletedAt: null }
  });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (actor.role !== "ADMIN" && payment.userId !== actor.id)
    throw ApiError.forbidden();
  return payment;
}
async function refundPayment(bookingId, amount, reason) {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment || payment.status !== "SUCCESS") return;
  await prisma.payment.update({
    where: { bookingId },
    data: {
      status: amount >= Number(payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED",
      refundedAmount: amount,
      refundReason: reason,
      refundedAt: /* @__PURE__ */ new Date()
    }
  });
}
var paymentService = {
  initiatePayment,
  handleStripeWebhook,
  mockConfirmPayment,
  getPaymentStatus,
  refundPayment
};

// src/modules/booking/booking.controller.ts
var createBooking2 = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(
    req.params.eventId,
    req.user.id,
    req.body
  );
  const payment = await paymentService.initiatePayment(
    booking.id,
    req.user.id,
    "STRIPE"
  );
  sendSuccess(res, 201, "Booking created successfully", {
    booking: {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      eventId: booking.eventId,
      quantity: booking.quantity,
      unitPrice: booking.unitPrice,
      totalPrice: booking.totalPrice,
      discountAmount: booking.discountAmount,
      finalAmount: booking.finalAmount,
      status: booking.status,
      expiresAt: booking.expiresAt,
      createdAt: booking.createdAt
    },
    payment: { paymentUrl: payment.paymentUrl }
  });
});
var listMyBookings2 = catchAsync(async (req, res) => {
  const q = req.query;
  const { items, pagination } = await bookingService.listMyBookings(
    req.user.id,
    {
      status: q.status,
      page: Number(q.page) || 1,
      limit: Number(q.limit) || 20,
      eventId: q.eventId
    }
  );
  sendPaginated(res, "Bookings retrieved", items, pagination);
});
var getBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  sendSuccess(res, 200, "Booking details retrieved", booking);
});
var cancelBooking2 = catchAsync(async (req, res) => {
  const result = await bookingService.cancelBooking(
    req.params.id,
    req.user,
    req.body.cancellationReason
  );
  sendSuccess(res, 200, "Booking cancelled successfully", result);
});
var checkIn2 = catchAsync(async (req, res) => {
  const result = await bookingService.checkIn(
    req.params.id,
    req.user.id,
    req.body.qrCode
  );
  sendSuccess(res, 200, "Check-in successful", result);
});
var bookingController = {
  createBooking: createBooking2,
  listMyBookings: listMyBookings2,
  getBooking,
  cancelBooking: cancelBooking2,
  checkIn: checkIn2
};

// src/modules/booking/booking.validation.ts
import { z as z7 } from "zod";
var createBookingSchema = z7.object({
  body: z7.object({
    ticketTierId: z7.string().min(1),
    quantity: z7.number().int().positive().max(20),
    specialRequests: z7.string().max(500).optional(),
    dietaryNeeds: z7.string().max(200).optional(),
    couponCode: z7.string().optional()
  })
});
var cancelBookingSchema = z7.object({
  body: z7.object({
    cancellationReason: z7.string().min(2).max(300)
  })
});
var checkInSchema = z7.object({
  body: z7.object({
    qrCode: z7.string().min(1)
  })
});
var listMyBookingsQuerySchema = z7.object({
  query: z7.object({
    status: z7.string().optional(),
    page: z7.string().optional(),
    limit: z7.string().optional(),
    eventId: z7.string().optional()
  })
});

// src/modules/booking/booking.route.ts
var router6 = Router6({ mergeParams: true });
router6.post(
  "/",
  authenticate,
  authorize("ATTENDEE", "ORGANIZER"),
  bookingLimiter,
  validateRequest(createBookingSchema),
  bookingController.createBooking
);
var bookingRoutes = router6;
var myBookingsRouter = Router6();
myBookingsRouter.get("/", authenticate, bookingController.listMyBookings);
var bookingMyRoutes = myBookingsRouter;
var flatRouter4 = Router6();
flatRouter4.get("/:id", authenticate, bookingController.getBooking);
flatRouter4.patch(
  "/:id/cancel",
  authenticate,
  validateRequest(cancelBookingSchema),
  bookingController.cancelBooking
);
flatRouter4.post(
  "/:id/check-in",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  validateRequest(checkInSchema),
  bookingController.checkIn
);
var bookingFlatRoutes = flatRouter4;

// src/modules/event/event.route.ts
var router7 = Router7();
var ownsEvent3 = isResourceOwner(
  (req) => eventService.getOrganizerId(req.params.id)
);
router7.post(
  "/",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  validateRequest(createEventSchema),
  eventController.createEvent
);
router7.get("/", eventController.listEvents);
router7.get("/:id", eventController.getEvent);
router7.patch(
  "/:id",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsEvent3,
  validateRequest(updateEventSchema),
  eventController.updateEvent
);
router7.patch(
  "/:id/status",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsEvent3,
  validateRequest(updateEventStatusSchema),
  eventController.updateEventStatus
);
router7.delete(
  "/:id",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsEvent3,
  eventController.deleteEvent
);
router7.use("/:eventId/ticket-tiers", ticketTierRoutes);
router7.use("/:eventId/waitlist", waitlistRoutes);
router7.use("/:eventId/review", reviewRoutes);
router7.use("/:eventId/reviews", reviewRoutes);
router7.use("/:eventId/book", bookingRoutes);
var eventRoutes = router7;

// src/modules/payment/payment.route.ts
import { Router as Router8, raw as raw3 } from "express";

// src/modules/payment/payment.controller.ts
var initiatePayment2 = catchAsync(async (req, res) => {
  const result = await paymentService.initiatePayment(
    req.body.bookingId,
    req.user.id,
    req.body.method
  );
  sendSuccess(res, 201, "Payment initiated successfully", result);
});
var webhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  await paymentService.handleStripeWebhook(req.body, signature);
  sendSuccess(res, 200, "Webhook processed successfully", null);
});
var mockConfirm = catchAsync(async (req, res) => {
  await paymentService.mockConfirmPayment(req.params.bookingId);
  sendSuccess(res, 200, "Payment mock-confirmed (development only)", null);
});
var getPaymentStatus2 = catchAsync(async (req, res) => {
  const payment = await paymentService.getPaymentStatus(
    req.params.id,
    req.user
  );
  sendSuccess(res, 200, "Payment status retrieved", payment);
});
var paymentController = {
  initiatePayment: initiatePayment2,
  webhook,
  mockConfirm,
  getPaymentStatus: getPaymentStatus2
};

// src/modules/payment/payment.validation.ts
import { z as z8 } from "zod";
var initiatePaymentSchema = z8.object({
  body: z8.object({
    bookingId: z8.string().min(1),
    method: z8.enum(["STRIPE", "SSLCOMMERZ", "BKASH"]).default("STRIPE")
  })
});

// src/modules/payment/payment.route.ts
var router8 = Router8();
router8.post(
  "/initiate",
  authenticate,
  paymentLimiter,
  validateRequest(initiatePaymentSchema),
  paymentController.initiatePayment
);
var paymentWebhookRoute = Router8();
paymentWebhookRoute.post(
  "/webhook",
  raw3({ type: "application/json" }),
  paymentController.webhook
);
router8.post(
  "/mock-confirm/:bookingId",
  authenticate,
  paymentController.mockConfirm
);
router8.get("/:id/status", authenticate, paymentController.getPaymentStatus);
var paymentRoutes = router8;

// src/modules/coupon/coupon.route.ts
import { Router as Router9 } from "express";

// src/modules/coupon/coupon.controller.ts
var validateCoupon = catchAsync(async (req, res) => {
  const result = await couponService.previewCoupon(
    req.body.code,
    req.user.id,
    req.body.eventId,
    req.body.ticketTierId,
    req.body.quantity
  );
  sendSuccess(res, 200, "Coupon is valid", result);
});
var createCoupon2 = catchAsync(async (req, res) => {
  const coupon = await couponService.createCoupon(req.user.id, req.body);
  sendSuccess(res, 201, "Coupon created successfully", coupon);
});
var couponController = { validateCoupon, createCoupon: createCoupon2 };

// src/modules/coupon/coupon.validation.ts
import { z as z9 } from "zod";
var validateCouponSchema = z9.object({
  body: z9.object({
    code: z9.string().min(1),
    eventId: z9.string().min(1),
    ticketTierId: z9.string().min(1),
    quantity: z9.number().int().positive()
  })
});
var createCouponSchema = z9.object({
  body: z9.object({
    code: z9.string().min(3).max(30).toUpperCase(),
    description: z9.string().max(300).optional(),
    discountType: z9.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z9.number().positive(),
    minPurchase: z9.number().nonnegative().optional(),
    maxDiscount: z9.number().positive().optional(),
    usageLimit: z9.number().int().positive().optional(),
    perUserLimit: z9.number().int().positive().optional(),
    startDate: z9.coerce.date(),
    endDate: z9.coerce.date()
  }).refine((d) => d.endDate.getTime() > d.startDate.getTime(), {
    message: "endDate must be after startDate",
    path: ["endDate"]
  }).refine((d) => d.discountType !== "PERCENTAGE" || d.discountValue <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["discountValue"]
  })
});

// src/modules/coupon/coupon.route.ts
var router9 = Router9();
router9.post(
  "/validate",
  authenticate,
  validateRequest(validateCouponSchema),
  couponController.validateCoupon
);
var couponRoutes = router9;
var adminRouter = Router9();
adminRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateRequest(createCouponSchema),
  couponController.createCoupon
);
var couponAdminRoutes = adminRouter;

// src/modules/notification/notification.route.ts
import { Router as Router10 } from "express";

// src/modules/notification/notification.service.ts
async function listNotifications(userId, filters) {
  const { page, limit, skip } = parsePagination(
    filters
  );
  const where = { userId, deletedAt: null };
  if (filters.isRead !== void 0) where.isRead = filters.isRead;
  const [total, items, unreadCount] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.notification.count({
      where: { userId, deletedAt: null, isRead: false }
    })
  ]);
  return {
    items,
    unreadCount,
    pagination: buildPaginationMeta(total, page, limit)
  };
}
async function markAsRead(notificationId, userId) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: /* @__PURE__ */ new Date() }
  });
}
async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: /* @__PURE__ */ new Date() }
  });
}
var notificationService = {
  listNotifications,
  markAsRead,
  markAllAsRead
};

// src/modules/notification/notification.controller.ts
var listNotifications2 = catchAsync(async (req, res) => {
  const q = req.query;
  const { items, unreadCount, pagination } = await notificationService.listNotifications(req.user.id, {
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    isRead: q.isRead !== void 0 ? q.isRead === "true" : void 0
  });
  sendPaginated(res, "Notifications retrieved", items, pagination, {
    unreadCount
  });
});
var markAsRead2 = catchAsync(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user.id);
  sendSuccess(res, 200, "Notification marked as read", null);
});
var markAllAsRead2 = catchAsync(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  sendSuccess(res, 200, "All notifications marked as read", null);
});
var notificationController = {
  listNotifications: listNotifications2,
  markAsRead: markAsRead2,
  markAllAsRead: markAllAsRead2
};

// src/modules/notification/notification.route.ts
var router10 = Router10();
router10.get("/", authenticate, notificationController.listNotifications);
var notificationRoutes = router10;
var flatRouter5 = Router10();
flatRouter5.patch("/:id/read", authenticate, notificationController.markAsRead);
flatRouter5.patch(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead
);
var notificationFlatRoutes = flatRouter5;

// src/modules/admin/admin.route.ts
import { Router as Router11 } from "express";

// src/modules/admin/admin.service.ts
async function listUsers(filters) {
  const { page, limit, skip } = parsePagination(
    filters
  );
  const where = { deletedAt: null };
  if (filters.role) where.role = filters.role;
  if (filters.isActive !== void 0) where.isActive = filters.isActive;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } }
    ];
  }
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);
  const items = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    totalBookings: u._count.bookings
  }));
  return { items, pagination: buildPaginationMeta(total, page, limit) };
}
async function updateUserRole(userId, role, actorId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null }
  });
  if (!user) throw ApiError.notFound("User not found");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role }
  });
  await writeAuditLog({
    userId: actorId,
    action: "ROLE_CHANGE",
    entityType: "User",
    entityId: userId,
    oldValues: { role: user.role },
    newValues: { role }
  });
  return { id: updated.id, role: updated.role, updatedAt: updated.updatedAt };
}
async function suspendUser(userId, suspend, reason, actorId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null }
  });
  if (!user) throw ApiError.notFound("User not found");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !suspend }
  });
  await writeAuditLog({
    userId: actorId,
    action: "SUSPEND",
    entityType: "User",
    entityId: userId,
    newValues: { isActive: !suspend, reason }
  });
  return {
    id: updated.id,
    isActive: updated.isActive,
    suspensionReason: suspend ? reason : null
  };
}
async function getDashboardStats() {
  const now = /* @__PURE__ */ new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
  const [
    totalUsers,
    totalOrganizers,
    totalEvents,
    totalBookings,
    revenueAgg,
    refundAgg,
    newUsersToday,
    newEventsToday,
    newBookingsToday,
    categoryGroups
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: "ORGANIZER", deletedAt: null } }),
    prisma.event.count({ where: { deletedAt: null } }),
    prisma.booking.count({ where: { deletedAt: null } }),
    prisma.booking.aggregate({
      where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
      _sum: { finalAmount: true }
    }),
    prisma.booking.aggregate({
      where: { status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] } },
      _sum: { refundAmount: true }
    }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.event.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.event.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: true
    })
  ]);
  const totalRevenue = Number(revenueAgg._sum.finalAmount ?? 0);
  const totalRefunds = Number(refundAgg._sum.refundAmount ?? 0);
  const recentBookings = await prisma.booking.count({
    where: { createdAt: { gte: thirtyDaysAgo } }
  });
  return {
    overview: {
      totalUsers,
      totalOrganizers,
      totalEvents,
      totalBookings,
      totalRevenue,
      totalRefunds
    },
    recentActivity: { newUsersToday, newEventsToday, newBookingsToday },
    popularCategories: categoryGroups.map((c) => ({
      category: c.category,
      count: c._count
    })),
    platformHealth: {
      activeUsers: totalUsers,
      conversionRate: totalBookings > 0 ? Number((recentBookings / totalBookings * 100).toFixed(1)) : 0,
      refundRate: totalRevenue > 0 ? Number(
        (totalRefunds / (totalRevenue + totalRefunds) * 100).toFixed(1)
      ) : 0
    }
  };
}
async function getAuditLogs(filters) {
  const { page, limit, skip } = parsePagination(
    filters
  );
  const where = {};
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.action)
    where.action = filters.action;
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) {
    where.createdAt = {
      ...filters.from ? { gte: new Date(filters.from) } : {},
      ...filters.to ? { lte: new Date(filters.to) } : {}
    };
  }
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);
  return { items: logs, pagination: buildPaginationMeta(total, page, limit) };
}
var adminService = {
  listUsers,
  updateUserRole,
  suspendUser,
  getDashboardStats,
  getAuditLogs
};

// src/modules/admin/admin.controller.ts
var listUsers2 = catchAsync(async (req, res) => {
  const q = req.query;
  const { items, pagination } = await adminService.listUsers({
    role: q.role,
    isActive: q.isActive !== void 0 ? q.isActive === "true" : void 0,
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    search: q.search
  });
  sendPaginated(res, "Users retrieved", items, pagination);
});
var updateUserRole2 = catchAsync(async (req, res) => {
  const result = await adminService.updateUserRole(
    req.params.id,
    req.body.role,
    req.user.id
  );
  sendSuccess(res, 200, "User role updated successfully", result);
});
var suspendUser2 = catchAsync(async (req, res) => {
  const result = await adminService.suspendUser(
    req.params.id,
    req.body.suspend,
    req.body.reason,
    req.user.id
  );
  sendSuccess(
    res,
    200,
    `User ${req.body.suspend ? "suspended" : "reinstated"} successfully`,
    result
  );
});
var getDashboardStats2 = catchAsync(async (_req, res) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, 200, "Dashboard statistics", stats);
});
var getAuditLogs2 = catchAsync(async (req, res) => {
  const q = req.query;
  const { items, pagination } = await adminService.getAuditLogs({
    entityType: q.entityType,
    action: q.action,
    userId: q.userId,
    from: q.from,
    to: q.to,
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 50
  });
  sendPaginated(res, "Audit logs retrieved", items, pagination);
});
var adminController = {
  listUsers: listUsers2,
  updateUserRole: updateUserRole2,
  suspendUser: suspendUser2,
  getDashboardStats: getDashboardStats2,
  getAuditLogs: getAuditLogs2
};

// src/modules/admin/admin.validation.ts
import { z as z10 } from "zod";
var updateUserRoleSchema = z10.object({
  body: z10.object({
    role: z10.enum(["ATTENDEE", "ORGANIZER", "ADMIN"])
  })
});
var suspendUserSchema = z10.object({
  body: z10.object({
    suspend: z10.boolean(),
    reason: z10.string().min(2).max(300)
  })
});
var listUsersQuerySchema = z10.object({
  query: z10.object({
    role: z10.enum(["ATTENDEE", "ORGANIZER", "ADMIN"]).optional(),
    isActive: z10.string().optional(),
    page: z10.string().optional(),
    limit: z10.string().optional(),
    search: z10.string().optional()
  })
});
var auditLogsQuerySchema = z10.object({
  query: z10.object({
    entityType: z10.string().optional(),
    action: z10.string().optional(),
    userId: z10.string().optional(),
    from: z10.string().optional(),
    to: z10.string().optional(),
    page: z10.string().optional(),
    limit: z10.string().optional()
  })
});

// src/modules/admin/admin.route.ts
var router11 = Router11();
router11.use(authenticate, authorize("ADMIN"));
router11.get("/users", adminController.listUsers);
router11.patch(
  "/users/:id/role",
  validateRequest(updateUserRoleSchema),
  adminController.updateUserRole
);
router11.patch(
  "/users/:id/suspend",
  validateRequest(suspendUserSchema),
  adminController.suspendUser
);
router11.get("/dashboard-stats", adminController.getDashboardStats);
router11.get("/audit-logs", adminController.getAuditLogs);
router11.use("/coupons", couponAdminRoutes);
var adminRoutes = router11;

// src/routes/index.ts
var router12 = Router12();
router12.use("/auth", authRoutes);
router12.use("/users", userRoutes);
router12.use("/users/bookings", bookingMyRoutes);
router12.use("/users/notifications", notificationRoutes);
router12.use("/events", eventRoutes);
router12.use("/ticket-tiers", ticketTierFlatRoutes);
router12.use("/bookings", bookingFlatRoutes);
router12.use("/payments", paymentRoutes);
router12.use("/waitlist", waitlistFlatRoutes);
router12.use("/reviews", reviewFlatRoutes);
router12.use("/coupons", couponRoutes);
router12.use("/notifications", notificationFlatRoutes);
router12.use("/admin", adminRoutes);
var apiRoutes = router12;

// src/middlewares/errorHandler.ts
function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500)
      logger.error(err.message, { stack: err.stack, path: req.path });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      code: err.code,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: `A record with this ${err.meta?.target?.join(", ") ?? "value"} already exists`,
        errors: [],
        code: "CONFLICT",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
        errors: [],
        code: "NOT_FOUND",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  logger.error("Unhandled error", { err, path: req.path });
  return res.status(500).json({
    success: false,
    message: "Something went wrong",
    errors: [],
    code: "INTERNAL_SERVER_ERROR",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}

// src/middlewares/notFound.ts
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    errors: [],
    code: "NOT_FOUND",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}

// src/app.ts
var app = express();
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400
  })
);
app.use(`/api/${env.apiVersion}/payments`, paymentWebhookRoute);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OK",
    data: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
  });
});
app.use(`/api/${env.apiVersion}`, apiRoutes);
app.use(notFound);
app.use(errorHandler);
var app_default = app;
export {
  app_default as default
};
//# sourceMappingURL=app.js.map