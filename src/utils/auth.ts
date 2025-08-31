import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export const hashPassword = async (plain: string) => {
  return bcrypt.hash(plain, 12);
};

export const verifyPassword = async (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};

export const signJWT = (
  payload: object,
  expiresIn: number = 24 * 60 * 60 * 1000, // 1 Day
) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyJWT = <T>(token: string) => {
  return jwt.verify(token, JWT_SECRET) as T;
};
