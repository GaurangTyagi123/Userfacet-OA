/**
 * src/controllers/globalErrorController.ts
 * Global error-handling middleware for Express. Normalizes errors and
 * sends structured error responses. Exported as default middleware.
 */
import type { AppRequest, AppResponse, Nextfn } from "../../types.js";
import AppError from "../utils/appError.js";

const handleTokenError = (_e: Error, statusCode: number) => {
    return new AppError("Invalid token... please login again", statusCode);
};

const handleDuplicateKeyError = (_e: Error) => {
    const message = `Cannot have duplicate entries`;
    return new AppError(message, 400);
};

const handleLimitError = (_e: Error) => {
    const message = _e.message;
    return new AppError(message, 400);
};

const handleObjectIDError = (_e: Error) => {
    return new AppError("Invalid id", 400);
};

export default (
    err: unknown,
    _req: AppRequest,
    res: AppResponse,
    _next: Nextfn,
) => {
    // Normalize unknown error shape into a mutable object
    let error = err as any;
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";

    const env = process.env.NODE_ENV || "development";

    if (env === "development") {
        if (error.name === "TokenExpiredError")
            error = handleTokenError(error, 401);
        if (error.name === "JsonWebTokenError")
            error = handleTokenError(error, 403);
        return res.status(error.statusCode).json({
            error,
            status: error.status,
            stack: error.stack,
            message: error.message,
        });
    }

    if (env === "production") {
        if (error.name === "TokenExpiredError")
            error = handleTokenError(error, 401);
        if (error.name === "JsonWebTokenError")
            error = handleTokenError(error, 403);

        if (error.code === 11000) error = handleDuplicateKeyError(error);

        if (error.name === "ValidationError") error = handleLimitError(error);

        if (error.name === "CastError") error = handleObjectIDError(error);

        if (error.isOperational) {
            return res.status(error.statusCode).json({
                message: error.message,
                status: error.status,
            });
        } else {
            console.error(error);
            return res.status(500).json({
                error: "error",
                message: "Something went wrong",
            });
        }
    }

    // Fallback for unknown environment
    console.error(error);
    return res.status(error.statusCode || 500).json({
        status: error.status || "error",
        message: error.message || "An unexpected error occurred",
    });
};
