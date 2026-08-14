/**
 * src/models/bookModel.ts
 * Mongoose schema and model for `Book`. Defines fields and schema-level
 * behavior. Exports the Book model.
 */
import mongoose from "mongoose";
import slugify from "slugify";

const bookSchema = new mongoose.Schema(
    {
        ISBN: {
            type: Number,
            required: [true, "Each book must have an ISBN"],
            unique: true,
        },
        bookName: String,
        category: String,
        author: String,
        publisherName: String,
        ebookURL: String,
        description: String,
        slug: String,
        summary: String,
        deleted: {
            type: Boolean,
            default: false,
            select: false,
        },
        embeddings: {
            type: [Number],
            required: false,
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

bookSchema.pre("save", function (this: any) {
    this.slug = slugify(this.bookName);
});
bookSchema.pre(/^find/, function (this: any) {
    this.find({
        deleted: false,
    }).select("-__v -embeddings");
});

const bookModel = mongoose.model("book", bookSchema);
export default bookModel;
