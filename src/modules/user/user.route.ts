import { Router } from "express";
import multer from "multer";
import { userController } from "./user.controller";
import { authenticate } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { updateMeSchema, changePasswordSchema } from "./user.validation";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get("/me", authenticate, userController.getMe);
router.patch(
  "/me",
  authenticate,
  validateRequest(updateMeSchema),
  userController.updateMe,
);
router.post(
  "/me/profile-image",
  authenticate,
  upload.single("image"),
  userController.uploadProfileImage,
);
router.patch(
  "/change-password",
  authenticate,
  validateRequest(changePasswordSchema),
  userController.changePassword,
);
router.get("/:id/profile", userController.getPublicProfile);

export const userRoutes = router;
