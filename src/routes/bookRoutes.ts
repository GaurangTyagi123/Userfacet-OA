/**
 * src/routes/bookRoutes.ts
 * Express router for book-related endpoints (list, create, update, delete).
 * Mounts controller handlers and any route-specific middleware.
 */
import { Router } from "express";
import {
    createBook,
    deleteBook,
    findBooks,
    getBook,
    getBooks,
    getBookSummary,
    updateBook,
} from "../controllers/bookController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = Router();

router
    .route("/")
    .get(protect, restrictTo("ADMIN", "LIBRARIAN"), getBooks)
    .post(protect, restrictTo("ADMIN", "LIBRARIAN"), createBook);
router.route("/findBookByQuery").get(protect, findBooks);
router
    .route("/:bookId")
    .get(protect, restrictTo("ADMIN", "LIBRARIAN"), getBook)
    .patch(protect, restrictTo("ADMIN", "LIBRARIAN"), updateBook)
    .delete(protect, restrictTo("ADMIN", "LIBRARIAN"), deleteBook);
router.route("/get-summary/:ISBN").get(protect, getBookSummary);

export default router;
