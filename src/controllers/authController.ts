/**
 * src/controllers/authController.ts
 * Authentication controller: handles signup, login, logout, token refresh,
 * password reset and password update flows. Uses JWTs and cookies.
 * Exports controller functions used by auth routes.
 */
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { StringValue } from "ms";
import type { AppRequest, AppResponse, Nextfn, UserType } from "../../types.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { promisify } from "util";
import User from "../models/userModel.js";
import type { ObjectId } from "mongoose";
import crypto from "crypto";
import Email from "../utils/email.js";

const signToken = (id: ObjectId, access: boolean = false) => {
    const JWTSign = process.env.JWT_SIGN as string;
    const JWTExpire = access
        ? (process.env.JWT_ACCESS_EXPIRE_TIME as StringValue)
        : (process.env.JWT_REFRESH_EXPIRE_TIME as StringValue);
    return jwt.sign({ id }, JWTSign, { expiresIn: JWTExpire });
};
const sendNewToken = async (
    user: UserType,
    res: AppResponse,
    statusCode: number,
) => {
    const refreshToken = signToken(user?._id);
    const accessToken = signToken(user?._id, true);

    // await prisma.user.findUnique(user.id, { refreshToken });
    await User.findByIdAndUpdate(user._id, { refreshToken });
    const cookieOptions: {
        httpOnly: boolean;
        secure?: boolean;
        maxAge: number;
    } = {
        httpOnly: true,
        maxAge:
            parseInt(process.env.COOKIE_EXPIRE_TIME as string) *
            24 *
            60 *
            60 *
            1000,
        secure: process.env.NODE_ENV === "production",
    };

    res.cookie("jwt", refreshToken, cookieOptions);

    return res.status(statusCode).json({
        status: "success",
        refreshToken,
        accessToken,
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        },
    });
};

export const refresh = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        let token: string | undefined;
        if (req.cookies) {
            token = req.cookies?.jwt;
        }
        if (!token)
            return next(new AppError("Invalid Token please login again", 403));

        const verifyAsync = promisify(jwt.verify) as (
            token: string,
            secret: string,
        ) => Promise<JwtPayload>;
        let jt;
        try {
            jt = await verifyAsync(token, process.env.JWT_SIGN as string);
        } catch {
            res.clearCookie("jwt");
            return next(new AppError("Session expired", 403));
        }
        const id = jt?.id;

        const user = await User.findOne({ _id: id, refreshToken: token });
        if (!user) {
            res.clearCookie("jwt");
            return next(
                new AppError("Session expired... Please login again", 403),
            );
        }

        const accessToken = signToken(user._id, true);
        return res.status(200).json({
            status: "success",
            data: {
                accessToken,
            },
        });
    },
);
export const login = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { email, password } = req.body;
        if (!email || !password)
            return next(
                new AppError("Please provide a valid email and password", 400),
            );
        const user = await User.findOne({ email }).select("+password");
        // comparePasswords compares the password entered by the user and the password stored in the database
        if (
            !user ||
            !(await user.comparePasswords(password, user.password as string))
        )
            return next(new AppError("No such user exists", 401));

        await sendNewToken(user, res, 200);
    },
);
export const logout = catchAsync(
    async (_req: AppRequest, res: AppResponse, _next: Nextfn) => {
        res.clearCookie("jwt");
        return res.status(200).json({
            status: "success",
        });
    },
);
export const signup = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { name, email, password, confirmPassword } = req.body;
        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword ||
            password !== confirmPassword
        )
            return next(new AppError("Please provide valid details", 400));
        const newUser = await User.create({
            name,
            email,
            password,
            confirmPassword,
        });
        if (!newUser) return next(new AppError("Failed to signup", 500));
        await sendNewToken(newUser, res, 201);
    },
);

export const forgotPassword = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const email = req.body.email;
        if (!email)
            return next(new AppError("Please provide a valid email id", 400));
        const user = await User.findOne({ email }).select("+password");
        if (!user)
            return next(
                new AppError("No such user with that email exists", 400),
            );
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const url = `${process.env.RESET_URL}/resetpassword/${resetToken}`;
        try {
            await new Email(
                {
                    userName: user.name,
                    email: user.email,
                },
                url,
            ).sendResetLink();
            return res.status(200).json({
                status: "success",
                data: {
                    message: "Mail sent successfully",
                },
            });
        } catch (err) {
            console.log(err);
            user.resetPasswordToken = undefined;
            user.resetTokenExpireTime = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                status: "fail",
                data: {
                    message: "Error updating the password",
                },
            });
        }
    },
);

/**
 * @brief Function to reset a user's password using a valid reset token.
 * @param {ExpressTypes.Request} req
 * ```
 * {
 * 		body: {
 * 			password: "newPassword123",
 * 			confirmPassword: "newPassword123"
 * 		},
 * 		params: {
 * 			resetToken: "token"
 * 		}
 * }
 * ```
 * request containing new password details and the token from the URL.
 * @param {ExpressTypes.Response} res - response object to set and return response to.
 * @param {ExpressTypes.NextFn} next - next function to pass control to error handler.
 * @return {json}
 * ```
 * {
 * 		status: "success",
 * 		token: "new jwt token",
 * 		data: {
 * 			user: {
 * 				...userdata
 * 			},
 * 		},
 * }
 * ```
 * @author `Gaurang Tyagi`
 */
export const resetPassword = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;
        const resetToken = req.params.resetToken;

        if (!password || !confirmPassword)
            return next(new AppError("Password is required", 400));

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken as string)
            .digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetTokenExpireTime: { $gte: Date.now() },
        }).select("+password");
        if (!user) return next(new AppError("Invalid token or password", 400));

        user.password = password;
        user.confirmPassword = confirmPassword;
        user.resetTokenExpireTime = undefined;
        user.resetPasswordToken = undefined;

        await user.save();
        await sendNewToken(user, res, 200);
    },
);

/**
 * @brief Function for an authenticated user to change their password.
 * @param {ExpressTypes.UserRequest} req
 * ```
 * {
 * 		user: UserObject,
 * 		body: {
 * 			prevPassword: "oldPassword",
 * 			password: "newPassword123",
 * 			confirmPassword: "newPassword123"
 * 		}
 * }
 * ```
 * request containing the authenticated user object and new/previous password details.
 * @param {ExpressTypes.Response} res - response object to set and return response to.
 * @param {ExpressTypes.NextFn} next - next function to pass control to error handler.
 * @return {json}
 * ```
 * {
 * 		status: "success",
 * 		token: "new jwt token",
 * 		data: {
 * 			user: {
 * 				...userdata
 * 			},
 * 		},
 * }
 * ```
 * @author `Gaurang Tyagi`
 */
export const updatePassword = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const prevPassword = req.body.prevPassword;
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;
        if (!password || !confirmPassword || !prevPassword)
            return next(new AppError("Please provide a valid password", 400));

        const user = await User.findById(req.user?._id).select("+password");
        if (
            !user ||
            !(await user.comparePasswords(
                prevPassword,
                user.password as string,
            ))
        ) {
            return next(new AppError("Incorrect previous password", 400));
        }
        user!.password = password;
        user!.confirmPassword = confirmPassword;
        await user!.save();

        user!.password = undefined;
        await sendNewToken(user, res, 200);
    },
);
