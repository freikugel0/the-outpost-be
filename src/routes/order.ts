import express, { type Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderSummaries,
  getUserOrders,
} from "../controllers/order.js";
import { authorize, requireAuth } from "../middlewares/auth.js";

const router: Router = express.Router();

router.get("/orders", requireAuth, getOrders);
router.get(
  "/users/:userId/orders",
  requireAuth,
  authorize(["ADMIN"]),
  getUserOrders,
);
router.get(
  "/orders/summary",
  requireAuth,
  authorize(["ADMIN"]),
  getOrderSummaries,
);
router.post("/orders", requireAuth, createOrder);

export default router;

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt.desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order created successfully
 */

/**
 * @swagger
 * /users/{userId}/orders:
 *   get:
 *     summary: Get all orders by a specific user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */

/**
 * @swagger
 * /orders/summary:
 *   get:
 *     summary: Get summarized orders by user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: orderCount.desc
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Order summaries retrieved successfully
 */
