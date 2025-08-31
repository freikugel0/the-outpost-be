import type { Response, Request } from "express";
import prisma from "../utils/client.js";
import {
  idSchema,
  paginationSchema,
  productFilterSchema,
  productSchema,
} from "../utils/validate.js";
import { AppError } from "../middlewares/error.js";
import { paginationResponse } from "../utils/response.js";
import type { JwtUser } from "../middlewares/auth.js";

const buildProductOrderBy = (sortBy?: string) => {
  const fallback = { createdAt: "desc" };

  const sort: any = {};
  if (!sortBy) return fallback;

  const [col, dir] = sortBy.split(".");
  const direction = dir === "asc" || dir === "desc" ? dir : "desc";

  if (col === "name") sort.name = direction;
  if (col === "price") sort.price = direction;
  if (col === "stock") sort.stock = direction;
  if (col === "createdAt") sort.createdAt = direction;

  return Object.keys(sort).length > 0 ? sort : fallback;
};

const buildProductWhere = (params: {
  user: JwtUser;
  keyword?: string;
  status?: "active" | "deleted";
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
}) => {
  const fallback = { price: { gte: 0 } };
  const where: any = {};

  if (params.keyword) {
    where.OR = [
      { name: { contains: String(params.keyword), mode: "insensitive" } },
      { desc: { contains: String(params.keyword), mode: "insensitive" } },
    ];
  }

  if (params.status === "active") {
    where.deletedAt = null;
  } else if (params.status === "deleted" && params.user.role === "ADMIN") {
    where.deletedAt = { not: null };
  } else {
    where.deletedAt = null;
  }

  const totalPriceRange: any = {};
  if (params.minPrice !== undefined) totalPriceRange.gte = params.minPrice;
  if (params.maxPrice !== undefined) totalPriceRange.lte = params.maxPrice;
  if (Object.keys(totalPriceRange).length > 0) where.price = totalPriceRange;

  const stockRange: any = {};
  if (params.minStock !== undefined) stockRange.gte = params.minStock;
  if (params.maxStock !== undefined) stockRange.lte = params.maxStock;
  if (Object.keys(stockRange).length > 0) where.stock = stockRange;

  return Object.keys(where).length > 0 ? where : fallback;
};

export const getProducts = async (req: Request, res: Response) => {
  // Get user id for authorize
  const user = (req as any).user as JwtUser;

  // Get query params
  const filterQuery = productFilterSchema.parse(req.query);
  const { sortBy } = req.query;

  // Pagination
  const { limit, page } = paginationSchema.parse(req.query);

  // Filtering
  const where = buildProductWhere({
    user,
    keyword: filterQuery?.keyword,
    status: filterQuery?.status,
    minPrice: filterQuery?.minPrice,
    maxPrice: filterQuery?.maxPrice,
    minStock: filterQuery?.minStock,
    maxStock: filterQuery?.maxStock,
  });

  // Sorting
  const orderBy = buildProductOrderBy(sortBy ? String(sortBy) : undefined);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
      omit: {
        deletedAt: !(
          filterQuery?.status === "deleted" && user.role === "ADMIN"
        ),
      },
    }),
    prisma.product.count({ where }),
  ]);

  return res.status(200).json(
    paginationResponse({
      page,
      limit,
      total,
      data: products,
    }),
  );
};

export const createProduct = async (req: Request, res: Response) => {
  const body = productSchema.safeParse(req.body);
  const image = req.file;
  if (!body.success)
    throw new AppError(
      400,
      "Invalid request body",
      body.error.issues.map((err) => ({
        path: err.path,
        msg: err.message,
      })),
    );

  const product = await prisma.product.create({
    data: {
      name: body.data.name,
      desc: body.data.desc,
      price: body.data.price,
      stock: body.data.stock ?? 0,
      image: image?.filename ?? null,
    },
    omit: { deletedAt: true, updatedAt: true },
  });

  return res.status(201).json({ product });
};

export const updateProduct = async (req: Request, res: Response) => {
  // Get query params
  const params = idSchema.safeParse(req.params);
  if (!params.success) throw new AppError(400, "Invalid ID in params");

  const body = productSchema.safeParse(req.body);
  const image = req.file;

  if (!body.success)
    throw new AppError(
      400,
      "Invalid request body",
      body.error.issues.map((err) => ({
        path: err.path,
        msg: err.message,
      })),
    );

  const oldProduct = await prisma.product.findUnique({
    where: { id: params.data.id },
    select: { image: true },
  });
  if (!oldProduct) throw new AppError(404, "Product not found");

  const product = await prisma.product.update({
    where: { id: params.data.id },
    data: {
      name: body.data.name,
      desc: body.data.desc,
      price: body.data.price,
      stock: body.data.stock ?? 0,
      image: image?.filename ?? oldProduct?.image ?? null,
    },
    omit: { deletedAt: true, createdAt: true },
  });

  return res.status(200).json({ product });
};

export const deleteProduct = async (req: Request, res: Response) => {
  // Get query params
  const params = idSchema.safeParse(req.params);
  if (!params.success) throw new AppError(400, "Invalid ID in params");

  const oldProduct = await prisma.product.findUnique({
    where: { id: params.data.id },
  });
  if (!oldProduct) throw new AppError(404, "Product not found");

  // Soft delete
  await prisma.product.update({
    where: { id: oldProduct.id },
    data: {
      deletedAt: new Date(),
    },
  });

  return res.status(204).json({});
};

export const restoreProduct = async (req: Request, res: Response) => {
  // Get query params
  const params = idSchema.safeParse(req.params);
  if (!params.success) throw new AppError(400, "Invalid ID in params");

  const product = await prisma.product.findUnique({
    where: { id: params.data.id, deletedAt: { not: null } },
  });
  if (!product) throw new AppError(404, "Product not found");

  const restoredProduct = await prisma.product.update({
    where: { id: product.id },
    data: { deletedAt: null },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  res.status(200).json({ restoredProduct });
};
