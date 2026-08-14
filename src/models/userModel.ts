/**
 * src/models/userModel.ts
 * Mongoose schema and model for `User`. Includes fields, validation,
 * password hashing, and helper instance methods. Exports the User model.
 */
import { Schema, model, type HydratedDocument } from "mongoose";

import validator from "validator";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import type { UserType } from "../../types.js";

const userSchema = new Schema(
    {
        name: {
            type: String,
            min: 5,
            validate: {
                validator: (name: string) => {
                    return /^[a-zA-Z]+[a-zA-Z0-9_-\s]+/.test(name);
                },
            },
            required: [true, "User must have a name"],
        },
        email: {
            type: String,
            unique: true,
            required: [true, "User must have an email"],
            validate: [validator.isEmail],
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN", "LIBRARIAN"],
            default: "USER",
        },
        otp: String,
        otpExpireTime: Date,
        password: {
            type: String,
            min: 8,
            select: false,
        },
        confirmPassword: {
            type: String,
            min: 8,
            validate: {
                message: "Passwords do not match",
                validator: function (this: UserType, pass: string) {
                    return pass === this.password;
                },
            },
        },
        passwordUpdatedAt: {
            type: Date,
            select: false,
        },
        resetPasswordToken: String,
        resetTokenExpireTime: Date,
        refreshToken: String,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

userSchema.pre("save", async function (this: HydratedDocument<UserType>) {
    // if the password field is not modified then call the next middleware
    if (!this.isModified("password")) return;

    // hash the password
    this.password = await bcryptjs.hash(this.password as string, 12);

    // remove confirmPassword from the document
    this.confirmPassword = undefined;

    return;
});

userSchema.pre("save", function (this: HydratedDocument<UserType>) {
    if (!this.isModified("password") || this.isNew) return;

    this.passwordUpdatedAt = new Date(Date.now() - 1000);
});

// . SCHEMA FUNCTIONS

userSchema.methods.createPasswordResetToken = function (this: UserType) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.resetTokenExpireTime = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

userSchema.methods.comparePasswords = async function (
    actualPassword: string,
    hashPassword: string,
) {
    return await bcryptjs.compare(actualPassword, hashPassword);
};
userSchema.methods.passwordUpdatedAfter = function (issuedTimeStamp: number) {
    if (this.passwordUpdatedAt) {
        const updateTimeStamp = this.passwordUpdatedAt.getTime() / 1000;
        return updateTimeStamp > issuedTimeStamp;
    }
};

const userModel = model<UserType>("User", userSchema);

export default userModel;
