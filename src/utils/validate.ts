import z, { string } from "zod";
import { Role } from "../../generated/prisma/index.js";

// Const
export const ROLE = ["ADMIN", "USER"] as const;
export type ROLE = (typeof ROLE)[number];

export const STATUS = ["active", "deleted"] as const;
export type STATUS = (typeof STATUS)[number];

const stringToNumUndefined = z
  .string()
  .optional()
  .transform((val) => {
    const num = Number(val);
    return !isNaN(num) ? num : undefined;
  });

export const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : 30;
    }),
  page: z
    .string()
    .optional()
    .transform((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : 1;
    }),
});

export const idSchema = z.object({
  id: z.coerce.number().positive(),
});

export const registerSchema = z.object({
  email: z.email("Email is invalid"),
  password: z.string().min(8, "Minimum password is 8 character"),
  role: z.enum(Role).optional(), // Default to 'user' in db
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  remember: z.boolean().default(false),
});

export const userFilterSchema = z.object({
  keyword: z.string().optional(),
  role: z.enum(ROLE).optional().catch(undefined),
  status: z.enum(STATUS).optional().catch(undefined),
  minPoint: stringToNumUndefined,
  maxPoint: stringToNumUndefined,
});

export const productSchema = z.object({
  name: z.string().min(1, "Invalid product name"),
  desc: z.string(),
  price: z.coerce.number().positive("Price can't be negative"),
  stock: z.coerce.number().positive("Stock can't be negative").optional(),
});

export const productFilterSchema = z.object({
  keyword: z.string().optional(),
  status: z.enum(STATUS).optional().catch(undefined),
  minPrice: stringToNumUndefined,
  maxPrice: stringToNumUndefined,
  minStock: stringToNumUndefined,
  maxStock: stringToNumUndefined,
});

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .nonempty("Order must contain at least 1 item"),
});

export const orderFilterSchema = z.object({
  userId: stringToNumUndefined,
  minPrice: stringToNumUndefined,
  maxPrice: stringToNumUndefined,
  minOrder: stringToNumUndefined,
  maxOrder: stringToNumUndefined,
});

export const transferPointSchema = z.object({
  receiverId: z.number().int().positive("Invalid receiver ID"),
  amount: z.number().int().positive("Invalid amount"),
});
