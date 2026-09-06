import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", password, name: "Platform Admin", role: "ADMIN", isEmailVerified: true },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@example.com" },
    update: {},
    create: { email: "organizer@example.com", password, name: "Tech Corp", role: "ORGANIZER", isEmailVerified: true },
  });

  const attendee = await prisma.user.upsert({
    where: { email: "attendee@example.com" },
    update: {},
    create: { email: "attendee@example.com", password, name: "John Doe", role: "ATTENDEE", isEmailVerified: true },
  });

  const event = await prisma.event.upsert({
    where: { slug: "tech-conference-2026-demo" },
    update: {},
    create: {
      title: "Tech Conference 2026",
      slug: "tech-conference-2026-demo",
      description:
        "Annual technology conference featuring industry leaders discussing the future of software, AI, and infrastructure.",
      category: "Conference",
      subCategory: "Technology",
      venue: "Bangabandhu International Conference Center",
      address: "Agargaon, Dhaka 1207",
      city: "Dhaka",
      country: "Bangladesh",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
      status: "PUBLISHED",
      publishedAt: new Date(),
      organizerId: organizer.id,
      maxTicketsPerUser: 4,
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: "seed-tier-early-bird" },
    update: {},
    create: {
      id: "seed-tier-early-bird",
      eventId: event.id,
      name: "Early Bird",
      description: "Limited early bird tickets",
      price: 500,
      quantity: 50,
      minPurchase: 1,
      maxPurchase: 4,
      includes: ["Lunch", "Swag Bag"],
    },
  });

  await prisma.ticketTier.upsert({
    where: { id: "seed-tier-vip" },
    update: {},
    create: {
      id: "seed-tier-vip",
      eventId: event.id,
      name: "VIP",
      description: "VIP access with premium benefits",
      price: 2000,
      quantity: 5, // intentionally small — good for demonstrating the concurrency test
      minPurchase: 1,
      maxPurchase: 2,
      includes: ["VIP Lounge", "Lunch", "Swag Bag", "Meet & Greet"],
    },
  });

  await prisma.coupon.upsert({
    where: { code: "EARLY50" },
    update: {},
    create: {
      code: "EARLY50",
      description: "50% off for early bird registration",
      discountType: "PERCENTAGE",
      discountValue: 50,
      minPurchase: 500,
      maxDiscount: 1000,
      usageLimit: 100,
      perUserLimit: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seed complete:");
  console.log(`  Admin:     admin@example.com / Password123!`);
  console.log(`  Organizer: organizer@example.com / Password123! (owns "${event.title}")`);
  console.log(`  Attendee:  attendee@example.com / Password123!`);
  console.log(`  Coupon:    EARLY50 (50% off, min purchase 500)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
