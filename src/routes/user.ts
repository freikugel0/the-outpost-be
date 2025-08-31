import express, { type Router } from "express";
import { authorize, requireAuth } from "../middlewares/auth.js";
import {
  activateUser,
  deactivateSelf,
  deactivateUser,
  getDetailUser,
  getMe,
  getUsers,
  transferPoint,
  uploadProfilePicture,
} from "../controllers/user.js";
import { uploadImage } from "../middlewares/file.js";

const router: Router = express.Router();

router.get("/me", requireAuth, getMe);
router.put("/me/deactivate", requireAuth, deactivateSelf);
router.put(
  "/me/change-image",
  requireAuth,
  uploadImage.single("file"),
  uploadProfilePicture,
);
router.get("/users", requireAuth, authorize(["ADMIN"]), getUsers);
router.get("/users/:id", requireAuth, authorize(["ADMIN"]), getDetailUser);
router.put(
  "/users/:id/deactivate",
  requireAuth,
  authorize(["ADMIN"]),
  deactivateUser,
);
router.put(
  "/users/:id/activate",
  requireAuth,
  authorize(["ADMIN"]),
  activateUser,
);
router.post("/transfer-point", requireAuth, transferPoint);

export default router;

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management & self-service
 */

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get logged in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /me/deactivate:
 *   put:
 *     summary: Deactivate your own account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 */

/**
 * @swagger
 * /me/change-image:
 *   put:
 *     summary: Change profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get list of users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search by email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, deleted]
 *       - in: query
 *         name: minPoint
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxPoint
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: email.asc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of users
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user detail by ID
 *     tags: [Users]
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
 *         description: User detail
 */

/**
 * @swagger
 * /users/{id}/deactivate:
 *   put:
 *     summary: Deactivate a user (ADMIN only)
 *     tags: [Users]
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
 *         description: User deactivated
 */

/**
 * @swagger
 * /users/{id}/activate:
 *   put:
 *     summary: Activate a user (ADMIN only)
 *     tags: [Users]
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
 *         description: User activated
 */

/**
 * @swagger
 * /transfer-point:
 *   post:
 *     summary: Transfer points to another user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 example: 2
 *               amount:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       200:
 *         description: Transfer successful
 */
