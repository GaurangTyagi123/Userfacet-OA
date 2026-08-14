/**
 * src/controllers/bookController.ts
 * Book controller: CRUD operations and business logic related to books.
 * Exports controller handlers for the book routes.
 */
import type { AppRequest, AppResponse, Nextfn } from "../../types.js";
import Book from "../models/bookModel.js";
import Borrow from "../models/borrowModel.js";
import { generateEmbedding } from "../services/embeddingService.js";
import ApiFilter from "../utils/apiFilter.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import axios from "axios";
import checkRequestBody from "../utils/checkRequestBody.js";

const findBooks = catchAsync(
    async (req: AppRequest, res: AppResponse, _next: Nextfn) => {
        const { query } = req.query;
        const queryEmbedding = await generateEmbedding(query as string);
        const results = await Book.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embeddings",
                    queryVector: queryEmbedding,
                    numCandidates: 100,
                    limit: 10,
                },
            },

            {
                $project: {
                    title: 1,
                    author: 1,
                    category: 1,
                    description: 1,
                    summary: 1,
                },
            },
        ]);

        return res.status(200).json({
            status: "success",
            data: {
                count: results.length,
                results,
            },
        });
    },
);
const getBooks = catchAsync(
    async (req: AppRequest, res: AppResponse, _next: Nextfn) => {
        const query = Book.find();
        const books = await new ApiFilter(query, req.parsedQuery!)
            .filter()
            .sort()
            .paginate()
            .project().query;
        return res.status(200).json({
            status: "success",
            data: {
                count: books.length,
                books,
            },
        });
    },
);
const getBook = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { bookId } = req.params;
        if (!bookId) return next(new AppError("invalid book id", 400));
        const book = await Book.findById(bookId);
        return res.status(200).json({
            status: "success",
            data: {
                book,
            },
        });
    },
);
const getBookByISBN = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { ISBN } = req.params;
        if (!ISBN) return next(new AppError("invalid book id", 400));
        const book = await Book.findOne({
            ISBN: Number(ISBN),
        });
        return res.status(200).json({
            status: "success",
            data: {
                book,
            },
        });
    },
);
const getBookSummary = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { ISBN } = req.params;
        if (!ISBN)
            return next(new AppError("Please provide a valid ISBN", 400));
        const book = await Book.findOne({
            ISBN: Number(ISBN),
        });
        if (!book)
            return next(
                new AppError(
                    "Sorry we do not have this particular book at this momment",
                    404,
                ),
            );
        if (book.summary) {
            return res.status(200).json({
                status: "success",
                data: {
                    summary: book.summary,
                },
            });
        }
        const response = await axios.post(
            process.env.AI_API_URL || "",
            {
                model: "gpt-4o-mini",

                messages: [
                    {
                        role: "user",
                        content: `
Generate a concise summary for the following book.

Title: ${book.bookName}
Author: ${book.author}
Category: ${book.category}

The description should be 5-7 sentences and suitable
for an e-library catalog.
        `,
                    },
                ],

                temperature: 0.7,
                max_tokens: 200,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.AI_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            },
        );

        const summary = response.data.choices[0].message.content;
        if (!summary)
            return next(
                new AppError(
                    "There was an error in generating a summary for the book",
                    500,
                ),
            );
        book.summary = summary;
        await book.save();
        return res.status(200).json({
            status: "success",
            data: {
                summary,
            },
        });
    },
);
const createBook = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { bookName, author, category, ISBN } = req.body;
        if (!bookName || !author || !category || !ISBN)
            return next(new AppError("Please provide complete details", 400));
        const response = await axios.post(
            process.env.AI_API_URL || "",
            {
                model: "gpt-4o-mini",

                messages: [
                    {
                        role: "user",
                        content: `
Generate a concise description for the following book.

Title: ${bookName}
Author: ${author}
Category: ${category}

The description should be 2-3 sentences and suitable
for an e-library catalog.
        `,
                    },
                ],

                temperature: 0.7,
                max_tokens: 200,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.AI_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            },
        );

        const description = response.data.choices[0].message.content;
        if (!description)
            return next(
                new AppError(
                    "There was an error in generating a description for the book",
                    500,
                ),
            );
        const embeddings = await generateEmbedding(`
            Title : ${bookName}
            Author : ${author}
            Category : ${category}
            description : ${description}
            `);
        const book = await Book.create({
            ISBN,
            bookName,
            author,
            category,
            description,
            embeddings,
        });
        return res.status(201).json({
            status: "success",
            data: {
                book,
            },
        });
    },
);
const updateBook = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { bookId } = req.params;
        if (!bookId)
            return next(new AppError("Please provide a valid book id", 400));
        const updatedBook = checkRequestBody(
            req.body,
            [
                "bookName",
                "category",
                "author",
                "publisherName",
                "ebookURL",
                "description",
            ],
            true,
        );
        const book = await Book.findByIdAndUpdate(bookId, updatedBook, {
            runValidators: true,
            returnDocument: "after",
        });
        return res.status(200).json({
            status: "success",
            data: {
                book,
            },
        });
    },
);
const deleteBook = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { bookId } = req.params;
        if (!bookId)
            return next(new AppError("Please provide a valid book id", 400));
        const isBorrowed = await Borrow.findOne({
            book: bookId,
        });
        if (isBorrowed)
            return next(
                new AppError("Cannot remove book as it has been borrowed", 400),
            );
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                status: "fail",
                message: "book not found",
            });
        }
        book.deleted = true;
        await book.save();
        return res.status(204).end();
    },
);

export {
    findBooks,
    getBook,
    getBooks,
    getBookByISBN,
    getBookSummary,
    createBook,
    updateBook,
    deleteBook,
};
