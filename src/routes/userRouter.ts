/**
 * src/routes/userRouter.ts
 * Router for user-specific endpoints such as profile management and user CRUD.
 * Exports the configured Express router.
 */
import { Router } from "express";
import {
    changeRole,
    getUser,
    updateUser,
} from "../controllers/userController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { updatePassword } from "../controllers/authController.js";

const router = Router();

router.route("/:id").get(protect, restrictTo("ADMIN"), getUser);

router.route("/updateMe").post(protect, updateUser);
router.route("/changeRole").patch(protect, restrictTo("ADMIN"), changeRole);
router.post("/updatePassword", protect, updatePassword);

export default router;
