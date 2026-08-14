/**
 * src/models/borrowModel.ts
 * Mongoose schema and model for `Borrow` records. Captures relations between
 * users and books and timestamps for borrow/return events.
 */
import mongoose, { Schema } from "mongoose";

const borrowSchema = new mongoose.Schema(
    {
        user: {
            type: Schema.ObjectId,
            ref: "User",
        },
        book: {
            type: Schema.ObjectId,
            ref: "book",
        },
        returnDate: {
            type: Date,
            required: [true, "Borrowed book must have a return date"],
        },
    },
    {
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
    },
);

const borrowModel = mongoose.model("borrow", borrowSchema);
export default borrowModel;
