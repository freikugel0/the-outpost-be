import type { Request, Response, NextFunction } from "express";
import { paginationResponse } from "../utils/response.js";
import prisma from "../utils/client.js";
import {
  idSchema,
  paginationSchema,
  ROLE,
  STATUS,
  transferPointSchema,
  userFilterSchema,
} from "../utils/validate.js";
import { AppError } from "../middlewares/error.js";
import type { JwtUser } from "../middlewares/auth.js";

const buildUserOrderBy = (sortBy?: string) => {
  const fallback = { createdAt: "desc" };

  const sort: any = {};
  if (!sortBy) return fallback;

  const [col, dir] = sortBy.split(".");
  const direction = dir === "asc" || dir === "desc" ? dir : "desc";

  if (col === "email") sort.email = direction;
  if (col === "role") sort.role = direction;
  if (col === "point") sort.point = direction;

  return Object.keys(sort).length > 0 ? sort : fallback;
};

const buildUserWhere = (params: {
  keyword?: string;
  status?: STATUS;
  role?: ROLE;
  minPoint?: number;
  maxPoint?: number;
}) => {
  const fallback = { price: { gte: 0 } };
  const where: any = {};

  if (params.keyword) {
    where.email = { contains: String(params.keyword), mode: "insensitive" };
  }

  if (params.status === "active") {
    where.deletedAt = null;
  } else if (params.status === "deleted") {
    where.deletedAt = { not: null };
  } else {
    where.deletedAt = null;
  }

  const pointRange: any = {};
  if (params.minPoint !== undefined) pointRange.gte = params.minPoint;
  if (params.maxPoint !== undefined) pointRange.lte = params.maxPoint;
  if (Object.keys(pointRange).length > 0) where.point = pointRange;

  return Object.keys(where).length > 0 ? where : fallback;
};

export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user as JwtUser;

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    omit: {
      password: true,
      deletedAt: true,
      role: true,
    },
  });

  return res.status(200).json(me);
};

export const getUsers = async (req: Request, res: Response) => {
  // Get query params
  const filterQuery = userFilterSchema.parse(req.query);
  const { sortBy } = req.query;

  // Pagination
  const { limit, page } = paginationSchema.parse(req.query);

  // Filtering
  const where = buildUserWhere({
    keyword: filterQuery?.keyword,
    status: filterQuery?.status,
    role: filterQuery?.role,
    minPoint: filterQuery?.minPoint,
    maxPoint: filterQuery?.maxPoint,
  });

  // Sorting
  const orderBy = buildUserOrderBy(sortBy ? String(sortBy) : undefined);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
      omit: {
        password: true,
        updatedAt: true,
        deletedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(200).json(
    paginationResponse({
      page,
      limit,
      total,
      data: users,
    }),
  );
};

export const getDetailUser = async (req: Request, res: Response) => {
  // Get query params
  const params = idSchema.safeParse(req.params);
  if (!params.success) throw new AppError(400, "Invalid ID in params");

  const user = await prisma.user.findUnique({
    where: { id: params.data.id },
    omit: { password: true },
  });
  if (!user) throw new AppError(404, "User not found");

  return res.status(200).json(user);
};

export const deactivateSelf = async (req: Request, res: Response) => {
  // Get user id for authorize
  const user = (req as any).user as JwtUser;

  const newUser = await prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date() },
    omit: { password: true },
  });
  if (!newUser) throw new AppError(404, "User not found");

  return res.status(200).json(newUser);
};

export const deactivateUser = async (req: Request, res: Response) => {
  // Get query params
  const params = idSchema.safeParse(req.params);
  if (!params.success) throw new AppError(400, "Invalid ID in params");

  const newUser = await prisma.user.update({
    where: { id: params.data.id },
    data: { deletedAt: new Date() },
    omit: { password: true },
  });
  if (!newUser) throw new AppError(404, "User not found");

  return res.status(200).json(newUser);
};

export const activateUser = async (req: Request, res: Response) => {
  // Get query params
  const params = idSchema.safeParse(req.params);
  if (!params.success) throw new AppError(400, "Invalid ID in params");

  const user = await prisma.user.findUnique({
    where: { id: params.data.id, deletedAt: { not: null } },
  });
  if (!user) throw new AppError(404, "User not found");

  const activatedUser = await prisma.user.update({
    where: { id: params.data.id },
    data: { deletedAt: null },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  res.status(200).json({ activatedUser });
};

export const transferPoint = async (req: Request, res: Response) => {
  // Get user id for authorize
  const user = (req as any).user as JwtUser;

  const parse = transferPointSchema.safeParse(req.body);
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

  // Validate point amount
  if (parse.data.amount <= 0) {
    throw new AppError(400, "Point must be greater than 0");
  }

  // Get user data
  const sender = await prisma.user.findUnique({
    where: { id: user.id },
  });
  const receiver = await prisma.user.findUnique({
    where: { id: parse.data.receiverId },
  });

  if (!sender || !receiver) {
    throw new AppError(400, "Sender or Receiver not found");
  }

  if (sender.id === receiver.id) {
    throw new AppError(400, "Can't self transfer point");
  }

  if (sender.point < parse.data.amount) {
    throw new AppError(400, "Insufficient points");
  }

  const [updatedSender, updatedReceiver] = await prisma.$transaction([
    prisma.user.update({
      where: { id: sender.id },
      data: { point: { decrement: parse.data.amount } },
      select: { id: true, email: true, point: true },
    }),
    prisma.user.update({
      where: { id: parse.data.receiverId },
      data: { point: { increment: parse.data.amount } },
      select: { id: true, email: true, point: true },
    }),
  ]);

  res.status(200).json({
    sender: updatedSender,
    receiver: updatedReceiver,
  });
};

export const uploadProfilePicture = async (req: Request, res: Response) => {
  const user = (req as any).user as JwtUser;
  const image = req.file;

  if (!image) {
    throw new AppError(400, "No file uploaded");
  }

  // Update user profile picture
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { image: image.filename },
    select: {
      id: true,
      email: true,
      image: true,
      createdAt: true,
    },
  });

  return res.status(200).json({ updatedUser });
};
