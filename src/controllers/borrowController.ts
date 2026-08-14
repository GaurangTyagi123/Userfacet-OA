import catchAsync from "../utils/catchAsync.js";
import Borrow from "../models/borrowModel.js";
import User from "../models/userModel.js";
import Book from "../models/bookModel.js";
/**
 * src/controllers/borrowController.ts
 * Borrow controller: handles borrowing-related actions (create, return,
 * list borrows) and enforces business rules. Exports route handlers.
 */
import type { AppRequest, AppResponse, Nextfn } from "../../types.js";
import AppError from "../utils/appError.js";
import { differenceInCalendarDays } from "date-fns";

const borrowBook = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { bookId, userId } = req.body;
        if (!bookId || !userId)
            return next(
                new AppError("Please provide a valide bookId and userId", 400),
            );
        const book = await Book.findById(bookId).where({
            deleted: false,
        });
        const user = await User.findById(userId);

        if (!book || !user) {
            return next(new AppError("No such book or user exists", 400));
        }
        const returnDay = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (Date.now() - returnDay.getTime() >= 0) {
            return next(new AppError("Invalid return date", 400));
        }
        const borrow = await Borrow.create({
            book: bookId,
            user: userId,
            returnDate: returnDay,
        });
        return res.status(201).json({
            status: "success",
            data: {
                borrow,
            },
        });
    },
);
const returnBook = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { bookId, userId } = req.body;
        if (!bookId || !userId)
            return next(
                new AppError("Please provide a valid bookId and userId", 400),
            );
        const book = await Book.findById(bookId).where({
            deleted: false,
        });
        const user = await User.findById(userId);

        if (!book || !user) {
            return next(new AppError("No such book or user exists", 400));
        }
        const borrow = await Borrow.findOne({
            user: userId,
            book: bookId,
        });
        if (!borrow)
            return next(
                new AppError(
                    "No borrow records exists with this user and book",
                    404,
                ),
            );
        const today = Date.now();
        const returnDate = new Date(borrow.returnDate).getTime();
        if (today - returnDate > 0) {
            await Borrow.findByIdAndDelete(borrow._id);
            return res.status(200).json({
                status: "success",
                message: `book was overdue by ${differenceInCalendarDays(today, returnDate)} days`,
            });
        } else {
            await Borrow.findByIdAndDelete(borrow._id);
            return res.status(200).json({
                status: "success",
                message: `book returned successfully`,
            });
        }
    },
);
const getDueBooks = catchAsync(
    async (_req: AppRequest, res: AppResponse, _next: Nextfn) => {
        const today = Date.now();
        const books = await Borrow.find({
            returnDate: {
                $lte: new Date(today),
            },
        });

        return res.status(200).json({
            status: "success",
            results: books.length,
            data: { books },
        });
    },
);
export { borrowBook, returnBook, getDueBooks };
