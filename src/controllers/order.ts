import type { Response, Request } from "express";
import prisma from "../utils/client.js";
import type { Prisma } from "../../generated/prisma/index.js";
import { AppError } from "../middlewares/error.js";
import {
  orderFilterSchema,
  orderSchema,
  paginationSchema,
} from "../utils/validate.js";
import type { JwtUser } from "../middlewares/auth.js";
import { paginationResponse } from "../utils/response.js";

const buildOrderOrderBy = (sortBy?: string) => {
  const fallback = { createdAt: "desc" };

  const sort: any = {};
  if (!sortBy) return fallback;

  const [col, dir] = sortBy.split(".");
  const direction = dir === "asc" || dir === "desc" ? dir : "desc";

  if (col === "totalPrice") sort.totalPrice = direction;
  if (col === "createdAt") sort.createdAt = direction;

  return Object.keys(sort).length > 0 ? sort : fallback;
};

const buildOrderWhere = (
  params: {
    userId?: number;
    minPrice?: number;
    maxPrice?: number;
  } = {},
): Prisma.OrderWhereInput => {
  const fallback = { items: { some: { totalPrice: { gte: 0 } } } };

  const where: any = {};

  if (params.userId !== undefined) where.userId = params.userId;

  const totalPriceRange: Prisma.FloatFilter = {};
  if (params.minPrice !== undefined) totalPriceRange.gte = params.minPrice;
  if (params.maxPrice !== undefined) totalPriceRange.lte = params.maxPrice;

  if (Object.keys(totalPriceRange).length > 0) {
    where.totalPrice = totalPriceRange;
  }

  return Object.keys(where).length > 0 ? where : fallback;
};

const buildOrderGroupedOrderBy = (sortBy?: string) => {
  const fallback = { _max: { createdAt: "desc" } };

  const sort: any = {};
  if (!sortBy) return fallback;

  const [col, dir] = sortBy.split(".");
  const direction = dir === "asc" || dir === "desc" ? dir : "desc";

  if (col === "totalPrice") sort._sum = { totalPrice: direction };
  if (col === "orderCount") sort._count = { id: direction };

  return Object.keys(sort).length > 0 ? sort : fallback;
};

const buildOrderGroupedHaving = ({
  minPrice,
  maxPrice,
  minOrder,
  maxOrder,
}: {
  minPrice?: number;
  maxPrice?: number;
  minOrder?: number;
  maxOrder?: number;
}) => {
  const fallback = { totalPrice: { _sum: { gte: 0 } } };
  const having: any = {};

  const totalPriceRange: any = {};
  if (minPrice !== undefined) totalPriceRange.gte = minPrice;
  if (maxPrice !== undefined) totalPriceRange.lte = maxPrice;

  if (Object.keys(totalPriceRange).length > 0) {
    having.totalPrice = {
      _sum: { ...totalPriceRange },
    };
  }

  const countRange: any = {};
  if (minOrder !== undefined) countRange.gte = minOrder;
  if (maxOrder !== undefined) countRange.lte = maxOrder;

  if (Object.keys(countRange).length > 0) {
    having.id = {
      _count: { ...countRange },
    };
  }

  return Object.keys(having).length > 0 ? having : fallback;
};

export const getOrders = async (req: Request, res: Response) => {
  const user = (req as any).user as JwtUser;

  // Get query params
  const { sortBy } = req.query;
  const { minPrice, maxPrice } = orderFilterSchema.parse(req.query);

  // Pagination
  const { limit, page } = paginationSchema.parse(req.query);

  // Ordering
  const orderBy = buildOrderOrderBy(sortBy ? String(sortBy) : undefined);

  // Filtering
  const where =
    user.role === "ADMIN"
      ? buildOrderWhere({ minPrice, maxPrice })
      : buildOrderWhere({
          userId: user.id,
          minPrice,
          maxPrice,
        });

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      include: { items: { omit: { orderId: true } } },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where }),
  ]);

  return res.status(200).json(
    paginationResponse({
      page,
      limit,
      total,
      data: orders,
    }),
  );
};

export const getUserOrders = async (req: Request, res: Response) => {
  const params = orderFilterSchema.safeParse(req.params);
  if (!params.success) throw new AppError(400, "Invalid user id in params");

  const user = await prisma.user.findUnique({
    where: { id: params.data.userId },
    select: { id: true },
  });
  if (!user) throw new AppError(404, "User not found");

  // Get query params
  const { sortBy } = req.query;
  const { minPrice, maxPrice } = orderFilterSchema.parse(req.query);

  // Pagination
  const { limit, page } = paginationSchema.parse(req.query);

  // Ordering
  const orderBy = buildOrderOrderBy(sortBy ? String(sortBy) : undefined);

  // Filtering
  const where = buildOrderWhere({
    userId: user.id,
    minPrice,
    maxPrice,
  });

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      include: { items: { omit: { orderId: true } } },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where }),
  ]);

  return res.status(200).json(
    paginationResponse({
      page,
      limit,
      total,
      data: orders,
    }),
  );
};

export const getOrderSummaries = async (req: Request, res: Response) => {
  // Get query params
  const { sortBy } = req.query;
  const { minPrice, maxPrice, minOrder, maxOrder } = orderFilterSchema.parse(
    req.query,
  );

  // Pagination
  const { limit, page } = paginationSchema.parse(req.query);

  // Ordering
  const orderBy = buildOrderGroupedOrderBy(sortBy ? String(sortBy) : undefined);

  // Filtering
  const having = buildOrderGroupedHaving({
    minPrice,
    maxPrice,
    minOrder,
    maxOrder,
  });

  const [orders, total] = await Promise.all([
    prisma.order
      .groupBy({
        by: ["userId"],
        _sum: { totalPrice: true },
        _count: { _all: true },
        _max: { createdAt: true },
        orderBy,
        take: limit,
        having,
        skip: (page - 1) * limit,
      })
      .then((res) =>
        res.map((col) => ({
          userId: col.userId,
          orderCount: col._count._all,
          totalPrice: col._sum.totalPrice,
          createdAt: col._max.createdAt,
        })),
      ),
    prisma.order
      .groupBy({
        by: ["userId"],
        _sum: { id: true },
        _count: { _all: true },
        _max: { createdAt: true },
        having,
      })
      .then((res) => res.length),
  ]);

  return res.status(200).json(
    paginationResponse({
      page,
      limit,
      total,
      data: orders,
    }),
  );
};

export const createOrder = async (req: Request, res: Response) => {
  const body = orderSchema.safeParse(req.body);
  if (!body.success)
    throw new AppError(
      400,
      "Invalid request body",
      body.error.issues.map((err) => ({
        path: err.path,
        msg: err.message,
      })),
    );

  const user = (req as any).user as JwtUser;
  const items = body.data.items;

  // Get valid products by product id
  const productIds = body.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
  });

  if (products.length !== productIds.length) {
    throw new AppError(400, "One or more products not found");
  }

  // Stock availability check
  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    if (product.stock < item.quantity) {
      throw new AppError(400, `Not enough stock for product ${product.name}`);
    }
  });

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: { userId: user.id },
    });

    // Create order items and subtract the stock
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = products.find((p) => p.id === item.productId)!;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });

        return tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: product.price * item.quantity,
          },
          omit: { orderId: true },
        });
      }),
    );

    const totalOrderPrice = orderItems.reduce(
      (acc, item) => acc + item.totalPrice,
      0,
    );

    const newOrderWithTotalPrice = await tx.order.update({
      where: { id: newOrder.id },
      data: {
        totalPrice: { increment: totalOrderPrice },
      },
    });

    // Increment user point per 1000
    const points = Math.floor(totalOrderPrice / 1000);
    await tx.user.update({
      where: { id: user.id },
      data: { point: { increment: points } },
    });

    return { ...newOrderWithTotalPrice, points, items: orderItems };
  });

  return res.status(201).json({ order });
};
