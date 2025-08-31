import express, { type Router } from "express";
import {
  login,
  register,
  resetPassword,
  resetPasswordRequest,
} from "../controllers/auth.js";

const router: Router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/request-reset-password", resetPasswordRequest);
router.post("/auth/reset-password", resetPassword);

export default router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Auth & Security Management
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mysecret123
 *     responses:
 *       '201':
 *         description: User successfully registered
 *       '409':
 *         description: Email already registered
 *       '400':
 *         description: Validation error
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mysecret123
 *               remember:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       '200':
 *         description: Successful login
 *       '401':
 *         description: Password is incorrect
 *       '404':
 *         description: User not found
 */

/**
 * @openapi
 * /auth/request-reset-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       '200':
 *         description: Password reset token generated
 *       '404':
 *         description: User not found
 */

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: 4a7d1ed414474e4033ac29ccb8653d9b
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: myNewSecret123
 *     responses:
 *       '204':
 *         description: Password successfully reset
 *       '400':
 *         description: Invalid or expired reset token
 */
