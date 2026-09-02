import { prisma } from "@/config/db";
import { ApiError } from "@/utils/ApiError";
import { comparePassword, hashPassword } from "@/utils/password";
import { cloudinary } from "@/config/cloudinary";

const PROFILE_SELECT = {
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
  createdAt: true,
} as const;

async function getMe(userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: PROFILE_SELECT });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

async function updateMe(userId: string, data: Record<string, unknown>) {
  const user = await prisma.user.update({ where: { id: userId }, data, select: PROFILE_SELECT });
  return user;
}

async function uploadProfileImage(userId: string, fileBuffer: Buffer): Promise<string> {
  const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `users/${userId}`, resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });

  await prisma.user.update({ where: { id: userId }, data: { profileImage: uploaded.secure_url } });
  return uploaded.secure_url;
}

async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) throw ApiError.badRequest("Current password is incorrect", [{ field: "currentPassword", message: "Incorrect password" }]);

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

async function getPublicProfile(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, name: true, profileImage: true, bio: true, role: true },
  });
  if (!user) throw ApiError.notFound("User not found");

  const [totalEvents, ratingAgg] = await Promise.all([
    user.role === "ORGANIZER" ? prisma.event.count({ where: { organizerId: userId, deletedAt: null } }) : 0,
    prisma.review.aggregate({
      where: { event: { organizerId: userId }, deletedAt: null },
      _avg: { rating: true },
    }),
  ]);

  return {
    ...user,
    totalEvents,
    averageRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : null,
  };
}

export const userService = { getMe, updateMe, uploadProfileImage, changePassword, getPublicProfile };
