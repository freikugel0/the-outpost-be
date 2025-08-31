import express, { type Router } from "express";
import { authorize, requireAuth } from "../middlewares/auth.js";
import {
  createProduct,
  deleteProduct,
  getProducts,
  restoreProduct,
  updateProduct,
} from "../controllers/product.js";
import { uploadImage } from "../middlewares/file.js";

const router: Router = express.Router();

router.get("/products", requireAuth, getProducts);
router.post(
  "/products",
  requireAuth,
  authorize(["ADMIN"]),
  uploadImage.single("file"),
  createProduct,
);
router.put(
  "/products/:id",
  requireAuth,
  authorize(["ADMIN"]),
  uploadImage.single("file"),
  updateProduct,
);
router.delete(
  "/products/:id",
  requireAuth,
  authorize(["ADMIN"]),
  deleteProduct,
);
router.put(
  "/products/:id/restore",
  requireAuth,
  authorize(["ADMIN"]),
  restoreProduct,
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, deleted]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: price.desc
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
 *         description: Paginated list of products
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               desc:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created
 */

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               desc:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated
 */

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Soft delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Product deleted
 */

/**
 * @swagger
 * /products/{id}/restore:
 *   put:
 *     summary: Restore deleted product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product restored
 */
