import type { Response, Request } from "express";
import { AppError } from "../middlewares/error.js";
import { hashPassword, signJWT, verifyPassword } from "../utils/auth.js";
import { loginSchema, registerSchema } from "../utils/validate.js";
import prisma from "../utils/client.js";
import type { Prisma } from "../../generated/prisma/index.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

export const register = async (req: Request, res: Response) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    throw new AppError(
      400,
      "Error in validation",
      parse.error.issues.map((err) => ({
        path: err.path,
        msg: err.message,
      })),
    );
  }

  const { email, password, role } = parse.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: role ?? "USER",
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
    return res.status(201).json({ user });
  } catch (err: any) {
    if ((err as Prisma.PrismaClientKnownRequestError).code === "P2002") {
      throw new AppError(409, "Email already registered");
    }
    console.error(err);
  }
};

export const login = async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    throw new AppError(400, "Email or password is invalid");
  }

  const { email, password } = parse.data;

  // Get user by email
  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
  });
  if (!user) throw new AppError(404, "User not found");

  // Verify password
  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new AppError(401, "Password is incorrect");

  const token = signJWT({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Return as cookie set
  if (parse.data.remember) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  return res.status(200).json({ token });
};

export const resetPasswordRequest = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) throw new AppError(404, "User not found");

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Store temporary reset password token in db
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
    },
  });

  return res.status(200).json({ resetToken });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new AppError(400, "Invalid or expired token reset");
  }

  // Update user password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashedPassword },
  });

  // Delete temporary token from database
  await prisma.passwordResetToken.delete({
    where: { id: record.id },
  });

  res.status(204).json({});
};
