/**
 * src/utils/appError.ts
 * App-specific Error subclass used to create consistent operational errors
 * across the application. Instances carry `statusCode` and `isOperational`.
 */
// Application's error handler
class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;
