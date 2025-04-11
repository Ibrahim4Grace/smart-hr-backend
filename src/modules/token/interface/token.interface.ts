export interface AuthJwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface EmailVerificationPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
