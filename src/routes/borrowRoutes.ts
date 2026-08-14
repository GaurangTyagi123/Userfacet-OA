/**
 * src/routes/borrowRoutes.ts
 * Router for borrow-related endpoints: creating borrows, returning items,
 * and listing borrow records. Exports the borrow router.
 */
import { Router } from "express";
import {
    borrowBook,
    getDueBooks,
    returnBook,
} from "../controllers/borrowController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/borrow-book").post(protect, restrictTo("LIBRARIAN"), borrowBook);
router.route("/return-book").post(protect, restrictTo("LIBRARIAN"), returnBook);
router
    .route("/get-due-books")
    .get(protect, restrictTo("LIBRARIAN"), getDueBooks);

export default router;
