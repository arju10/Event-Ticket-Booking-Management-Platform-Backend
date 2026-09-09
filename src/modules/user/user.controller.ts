import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { userService } from "./user.service";

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user!.id);
  sendSuccess(res, 200, "Profile retrieved successfully", user);
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateMe(req.user!.id, req.body);
  sendSuccess(res, 200, "Profile updated successfully", user);
});

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file)
    throw ApiError.badRequest("No image file provided", [
      { field: "image", message: "Image is required" },
    ]);
  const profileImage = await userService.uploadProfileImage(
    req.user!.id,
    req.file.buffer,
  );
  sendSuccess(res, 200, "Profile image updated successfully", { profileImage });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  await userService.changePassword(
    req.user!.id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  sendSuccess(res, 200, "Password changed successfully", null);
});

const getPublicProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getPublicProfile(req.params.id);
  sendSuccess(res, 200, "User profile retrieved", user);
});

export const userController = {
  getMe,
  updateMe,
  uploadProfileImage,
  changePassword,
  getPublicProfile,
};
