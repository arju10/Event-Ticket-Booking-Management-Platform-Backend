import { UserRole } from "@prisma/client";

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
