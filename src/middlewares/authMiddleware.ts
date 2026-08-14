/**
 * src/middlewares/authMiddleware.ts
 * Authentication middleware: verifies JWTs, protects routes, and attaches
 * the authenticated user to the request object. Exports middleware helpers.
 */
import type { RequestHandler } from "express";
import type { AppRequest, AppResponse, Nextfn, UserType } from "../../types.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { promisify } from "util";
import User from "../models/userModel.js";

export const restrictTo: (...roles: string[]) => RequestHandler = (
    ...roles: string[]
) => {
    return (async (req: AppRequest, _res: AppResponse, next: Nextfn) => {
        const { role } = (await User.findById(req?.user?._id)) as UserType;
        if (roles.includes(role as string)) return next();
        return next(new AppError("You are not authorized", 401));
    }) as RequestHandler;
};
export const protect = catchAsync(
    async (req: AppRequest, _res: AppResponse, next: Nextfn) => {
        let token: string | undefined;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ").at(1);
        }
        if (!token) return next(new AppError("Invalid Token", 401));
        const verifyAsync = promisify(jwt.verify) as (
            token: string,
            secret: string,
        ) => Promise<JwtPayload>;
        const jt = await verifyAsync(token, process.env.JWT_SIGN as string);
        const id = jt?.id;
        const issuedAt = jt?.iat;
        const user = await User.findById(id);
        if (!user) return next(new AppError("Unauthenticated", 401));

        if (user.passwordUpdatedAfter(issuedAt as number))
            return next(new AppError("Password updated recently", 401));

        req.user = user;
        return next();
    },
);
