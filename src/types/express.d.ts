import { UserRole } from "../generated/prisma";

// Augments Express Request with the authenticated user, set by the
// `authenticate` middleware after verifying the JWT.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
