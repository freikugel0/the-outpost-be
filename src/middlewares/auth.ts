import type { Request, Response, NextFunction } from "express";
import { AppError } from "./error.js";
import { verifyJWT } from "../utils/auth.js";

export type Role = "USER" | "ADMIN";

export type JwtUser = {
  id: number;
  email: string;
  role: Role;
  iat: number;
  exp: number;
};

const getToken = (req: Request): string | null => {
  const cookieToken = req.cookies?.token ?? null;

  const headerToken = () => {
    const authHeader = req.headers.authorization;
    return authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
  };

  return cookieToken ?? headerToken();
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = getToken(req);

  if (!token) {
    throw new AppError(401, "Missing or invalid authorization");
  }

  try {
    const decoded = verifyJWT<JwtUser>(token);
    (req as any).user = decoded;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
};

export const authorize = (roles: Array<Role>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtUser | undefined;
    if (!user) throw new AppError(401, "Unauthorized");
    if (!roles.includes(user.role)) {
      throw new AppError(403, "Access forbidden");
    }
    next();
  };
};
