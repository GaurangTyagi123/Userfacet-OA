/**
 * src/routes/authRoutes.ts
 * Express router defining authentication-related routes (signup, login,
 * logout, password reset, token refresh). Exports the configured router.
 */
import { Router } from "express";
import {
    forgotPassword,
    login,
    logout,
    refresh,
    resetPassword,
    signup,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(protect, logout);
router.route("/refresh").post(refresh);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword/:resetToken").post(resetPassword);

export default router;
