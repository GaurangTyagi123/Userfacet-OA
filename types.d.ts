import type Express from "express"
import type { User } from "./generated/prisma/client"
import type { ObjectId } from "mongoose"
import type { ParsedQs } from "qs"

declare type AppRequest = Express.Request & {
    user?: User
    parsedQuery ?: ParsedQs
}
declare type AppResponse = Express.Response
declare type Nextfn = Express.NextFunction
declare type ObjectId = ObjectId

declare interface UserType extends MongooseDocument {
    _id: ObjectId;
    name: string;
    email: string;
    role : "USER" | "ADMIN" | "LIBRARIAN"
    isVerified: boolean;
    otp?: string | undefined;
    otpExpireTime?: string | undefined;
    books ?: Array<BookType>
    password?: string;
    confirmPassword?: string | undefined;
    passwordUpdatedAt?: Date | undefined;
    resetPasswordToken?: string | undefined;
    resetTokenExpireTime?: number | undefined;
    refreshToken?: string | undefined;

    comparePasswords: (actualPassword: string, hashPassword: string) => Promise;
    createPasswordResetToken: () => string;
    passwordUpdatedAfter: (issuedTimeStamp: number) => boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare interface BookType {
    _id: ObjectId;
    ISBN: number;
    category: string;
    bookName: string;
    author: string;
    publisherName: string;
    ebookURL: string;
    description: string;
    deleted: boolean;
    borrowers: Array<UserType>;
    embeddings: Array<number>;
    slug: string;
    summary: string;
}